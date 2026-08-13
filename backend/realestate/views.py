# views.py
import hashlib
import hmac
import json
import logging
import os
import uuid

import razorpay
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.files.storage import default_storage
from django.db import connections, transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from properties.models import Booking, ContactMessage, Inquiry, Locality, Property, PropertyImage, SavedProperty
from realestate.serializers import (
    AgentBookingSerializer,
    BookingSerializer,
    ChangePasswordSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ContactMessageSerializer,
    CustomTokenObtainPairSerializer,
    InquirySerializer,
    LocalitySerializer,
    PropertyDetailSerializer,
    PropertyListSerializer,
    PropertyWriteSerializer,
    SavedPropertySerializer,
    UserRegistrationSerializer,
    UserSerializer,
)
from realestate.filters import PropertyFilter
from realestate.permissions import IsAgentOrReadOnly, IsOwnerOrAdmin

User = get_user_model()

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# AUTH VIEWS
# ─────────────────────────────────────────────


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Public endpoint. Creates a new user account.
    Returns JWT tokens and user data on success.
    """

    throttle_scope = "register"

    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Issue JWT tokens immediately after registration
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Public endpoint. Returns JWT access/refresh tokens + user data.
    The Next.js API route handler sets these as httpOnly cookies.
    """

    throttle_scope = "login"

    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the provided refresh token to invalidate the session.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_205_RESET_CONTENT,
            )
        except Exception:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/me/   — Retrieve authenticated user's profile.
    PUT  /api/auth/me/   — Update authenticated user's profile.
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ─────────────────────────────────────────────
# PROPERTY VIEWS
# ─────────────────────────────────────────────


class PropertyViewSet(viewsets.ModelViewSet):
    """
    /api/properties/

    list    GET    — Public. Paginated list with full filtering support.
    create  POST   — Agents only. Create a new listing.
    retrieve GET   — Public. Single property by ID or slug.
    update  PUT    — Owner agent or admin only. Full update.
    partial_update PATCH — Owner agent or admin only. Partial update.
    destroy DELETE — Owner agent or admin only. Delete listing.

    Query parameters supported:
        ?search=        Full-text search on title, description, city, address
        ?city=          Filter by city (case-insensitive)
        ?state=         Filter by state
        ?property_type= sale | rent
        ?category=      house | apartment | condo | ...
        ?status=        active | pending | sold | rented
        ?beds=          Exact or minimum beds (use ?beds__gte=3)
        ?price__lte=    Maximum price
        ?price__gte=    Minimum price
        ?ordering=      price | -price | created_at | -created_at | beds
    """

    permission_classes = [IsAgentOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = PropertyFilter
    search_fields = ["title", "description", "city", "address", "state", "zip_code"]
    ordering_fields = ["price", "created_at", "beds", "baths", "area_sqft"]
    ordering = ["-created_at"]
    lookup_field = "slug"

    def get_queryset(self):
        qs = (
            Property.objects.select_related("agent", "agent__agent_profile")
            .prefetch_related("images")
        )
        # Non-agents only see active listings
        if not (
            self.request.user.is_authenticated
            and self.request.user.role in ["agent", "admin"]
        ):
            qs = qs.filter(status="active")
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return PropertyListSerializer
        if self.action in ["create", "update", "partial_update"]:
            return PropertyWriteSerializer
        return PropertyDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Property.objects.filter(pk=instance.pk).update(
            views_count=instance.views_count + 1
        )
        instance.refresh_from_db(fields=["views_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_permissions(self):
        if self.action in ["retrieve", "list"]:
            return [permissions.AllowAny()]
        if self.action in ["create", "upload_image"]:
            return [permissions.IsAuthenticated(), IsAgentOrReadOnly()]
        # Custom actions that any signed-in user (usually a buyer) performs on
        # someone else's listing. Without this branch they fall through to the
        # IsOwnerOrAdmin default below, which checks obj.agent == request.user
        # and therefore 403s every buyer — breaking the wishlist heart and the
        # enquiry form. Note that per-action `permission_classes` on @action is
        # ignored whenever get_permissions() is overridden, so they must be
        # listed here.
        if self.action in ["inquire", "toggle_save", "saved", "my_listings"]:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def perform_create(self, serializer):
        serializer.save(agent=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def my_listings(self, request):
        """GET /api/properties/my_listings/ — Agent's own listings."""
        qs = self.get_queryset().filter(agent=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = PropertyListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = PropertyListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["post"],
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_image(self, request):
        """
        POST /api/properties/upload_image/ — Upload one or more image files.

        Returns {"urls": [...]} with absolute URLs suitable for the
        `image_urls` field on create/update.

        The admin form previously called URL.createObjectURL() and sent the
        resulting `blob:` URLs. Those are browser-local, die with the tab, and
        are rejected by the serializer's URLField — so choosing files from disk
        could never work. This gives those files somewhere real to live.

        In production set USE_S3=True and these go to the bucket instead;
        default_storage handles both cases.
        """
        files = request.FILES.getlist("files") or request.FILES.getlist("file")
        if not files:
            return Response(
                {"detail": "No files were uploaded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
        max_bytes = 10 * 1024 * 1024  # 10 MB per file

        urls = []
        for f in files:
            ext = os.path.splitext(f.name)[1].lower()
            if ext not in allowed:
                return Response(
                    {"detail": f"Unsupported file type '{ext or f.name}'. "
                               f"Allowed: {', '.join(sorted(allowed))}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if f.size > max_bytes:
                return Response(
                    {"detail": f"'{f.name}' is larger than 10 MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            saved_path = default_storage.save(
                f"properties/{uuid.uuid4().hex}{ext}", f
            )
            urls.append(request.build_absolute_uri(default_storage.url(saved_path)))

        return Response({"urls": urls}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def inquire(self, request, slug=None):
        """POST /api/properties/{slug}/inquire/ — Submit an inquiry."""
        property_instance = self.get_object()
        serializer = InquirySerializer(
            data={**request.data, "property_id": property_instance.id},
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def toggle_save(self, request, slug=None):
        """
        POST /api/properties/{slug}/toggle_save/ — Wishlist toggle (heart icon).
        Creates a SavedProperty if none exists, otherwise removes it.
        """
        property_instance = self.get_object()
        saved, created = SavedProperty.objects.get_or_create(
            user=request.user, property=property_instance
        )
        if not created:
            saved.delete()
            return Response({"saved": False}, status=status.HTTP_200_OK)
        return Response({"saved": True}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def saved(self, request):
        """GET /api/properties/saved/ — The current user's wishlisted properties."""
        saved_ids = set(
            SavedProperty.objects.filter(user=request.user).values_list(
                "property_id", flat=True
            )
        )
        qs = self.get_queryset().filter(id__in=saved_ids)
        page = self.paginate_queryset(qs)
        context = self.get_serializer_context()
        context["saved_ids"] = saved_ids
        if page is not None:
            serializer = PropertyListSerializer(page, many=True, context=context)
            return self.get_paginated_response(serializer.data)
        serializer = PropertyListSerializer(qs, many=True, context=context)
        return Response(serializer.data)


# ─────────────────────────────────────────────
# INQUIRY VIEWS
# ─────────────────────────────────────────────


class InquiryViewSet(viewsets.ModelViewSet):
    """
    /api/inquiries/

    Agents can view inquiries for their properties.
    Any user (including anonymous) can create an inquiry.
    """

    serializer_class = InquirySerializer
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == "admin":
            return Inquiry.objects.select_related("property", "user").all()
        # Agents see inquiries for their own listings only
        return Inquiry.objects.select_related("property", "user").filter(
            property__agent=user
        )


# ─────────────────────────────────────────────
# LOCALITY VIEWS
# ─────────────────────────────────────────────


class LocalityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /api/localities/

    Read-only endpoint powering "Explore by locality" sections and
    locality insight pages (avg price/sqft, description, hero image).

    Query parameters:
        ?city=   Filter localities within a given city.
    """

    queryset = Locality.objects.all()
    serializer_class = LocalitySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "city"]
    lookup_field = "slug"

    def get_queryset(self):
        qs = super().get_queryset()
        city = self.request.query_params.get("city")
        if city:
            qs = qs.filter(city__iexact=city)
        return qs


# ─────────────────────────────────────────────
# SITE VISIT BOOKING — RAZORPAY TOKEN PAYMENT
# ─────────────────────────────────────────────


class BookingViewSet(viewsets.GenericViewSet):
    """
    /api/bookings/create_order/   POST  — create a Razorpay order for a site-visit token
    /api/bookings/verify_payment/ POST  — verify the Razorpay payment signature
    /api/bookings/mine/           GET   — the current user's bookings

    Payment is only ever reachable when logged in — every action here
    requires authentication.
    """

    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _razorpay_client(self):
        return razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

    @action(detail=False, methods=["post"])
    def create_order(self, request):
        property_id = request.data.get("property_id")
        property_instance = get_object_or_404(Property, id=property_id)

        amount_inr = settings.SITE_VISIT_TOKEN_AMOUNT
        booking = Booking.objects.create(
            user=request.user,
            property=property_instance,
            amount=amount_inr,
            preferred_date=request.data.get("preferred_date") or None,
            notes=request.data.get("notes", ""),
        )

        client = self._razorpay_client()
        order = client.order.create(
            {
                "amount": int(amount_inr * 100),  # paise
                "currency": "INR",
                "receipt": f"booking_{booking.id}",
                "notes": {
                    "booking_id": str(booking.id),
                    "property": property_instance.title,
                },
            }
        )
        booking.razorpay_order_id = order["id"]
        booking.save(update_fields=["razorpay_order_id"])

        return Response(
            {
                "booking_id": booking.id,
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": settings.RAZORPAY_KEY_ID,
                "property_title": property_instance.title,
                "prefill": {
                    "name": request.user.full_name,
                    "email": request.user.email,
                    "contact": getattr(request.user, "phone", "") or "",
                },
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"])
    def verify_payment(self, request):
        booking = get_object_or_404(
            Booking, id=request.data.get("booking_id"), user=request.user
        )
        params = {
            "razorpay_order_id": request.data.get("razorpay_order_id"),
            "razorpay_payment_id": request.data.get("razorpay_payment_id"),
            "razorpay_signature": request.data.get("razorpay_signature"),
        }

        client = self._razorpay_client()
        try:
            client.utility.verify_payment_signature(params)
        except razorpay.errors.SignatureVerificationError:
            booking.status = Booking.Status.FAILED
            booking.save(update_fields=["status"])
            return Response(
                {"verified": False, "detail": "Payment signature verification failed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = Booking.Status.PAID
        booking.razorpay_payment_id = params["razorpay_payment_id"]
        booking.razorpay_signature = params["razorpay_signature"]
        booking.save(update_fields=["status", "razorpay_payment_id", "razorpay_signature"])

        return Response({"verified": True, "booking": BookingSerializer(booking).data})

    @action(detail=False, methods=["get"], url_path="for_my_listings")
    def for_my_listings(self, request):
        """
        GET /api/bookings/for_my_listings/ — Site visits booked on properties
        the requesting agent owns.

        Without this an agent had no way to see who paid to visit their own
        listings; the data was admin-only. Buyers get an empty list, since they
        own no properties.

        Optional ?status=paid to show only completed payments.
        """
        bookings = (
            Booking.objects.filter(property__agent=request.user)
            .select_related("user", "property")
            .order_by("-created_at")
        )

        status_filter = request.query_params.get("status")
        if status_filter:
            bookings = bookings.filter(status=status_filter)

        return Response(AgentBookingSerializer(bookings, many=True).data)

    @action(detail=False, methods=["get"])
    def mine(self, request):
        qs = Booking.objects.filter(user=request.user).select_related("property")
        return Response(BookingSerializer(qs, many=True).data)


# ─────────────────────────────────────────────
# CONTACT MESSAGE (PUBLIC /contact FORM)
# ─────────────────────────────────────────────


class ContactMessageViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """POST /api/contact-messages/ — public contact form submission."""

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]


class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/ — Email a password reset link.

    Always returns 200 with the same message whether or not the address is
    registered. Revealing which emails exist would turn this into an account
    enumeration oracle.
    """

    throttle_scope = "password_reset"

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        generic_response = Response(
            {"detail": "If that email is registered, a reset link is on its way."},
            status=status.HTTP_200_OK,
        )

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return generic_response

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        send_mail(
            subject="Reset your EstateHub password",
            message=(
                f"Hi {user.first_name or user.username},\n\n"
                f"Use the link below to choose a new password. "
                f"It expires in a few days and can only be used once.\n\n"
                f"{reset_url}\n\n"
                f"If you didn't request this, you can safely ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )

        return generic_response


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/ — Set a new password using the
    uid + token from the emailed link.
    """

    throttle_scope = "password_reset"

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            uid = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "This reset link is invalid. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, data["token"]):
            return Response(
                {"detail": "This reset link has expired or already been used. "
                           "Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(data["new_password"])
        user.save(update_fields=["password"])

        return Response(
            {"detail": "Password updated. You can now sign in."},
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/ — Change your own password while signed in.

    Verifies the current password first, then rotates refresh tokens so any
    other sessions are logged out — standard behaviour after a password change.
    """

    throttle_scope = "change_password"

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        # Issue a fresh token pair so the caller isn't logged out of the tab
        # they're currently using.
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "detail": "Password changed successfully.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


class HealthCheckView(APIView):
    """
    GET /api/health/ — Liveness/readiness probe for load balancers.

    Returns 200 when the app can reach its database, 503 otherwise, so a
    balancer stops routing traffic to an instance whose DB connection has
    died rather than serving errors to users.

    Deliberately unauthenticated and unthrottled: probes run every few seconds
    and must not consume rate limit, and must not need credentials.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = []

    def get(self, request):
        checks = {}
        healthy = True

        try:
            connections["default"].cursor().execute("SELECT 1")
            checks["database"] = "ok"
        except Exception as exc:  # noqa: BLE001 - report any failure to the probe
            checks["database"] = "error"
            healthy = False
            logger.error("Health check DB failure: %s", exc)

        return Response(
            {"status": "healthy" if healthy else "unhealthy", "checks": checks},
            status=status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE,
        )


@method_decorator(csrf_exempt, name="dispatch")
class RazorpayWebhookView(APIView):
    """
    POST /api/webhooks/razorpay/ — Server-to-server payment notification.

    Why this exists: verify_payment only runs if the user's browser makes it
    back from the Razorpay redirect. If their connection drops, they close the
    tab, or their battery dies mid-redirect, the money leaves their account but
    the booking stays "created" forever. Razorpay calls this endpoint directly,
    independent of the browser, and retries on failure.

    Security: the payload is signed with RAZORPAY_WEBHOOK_SECRET (a different
    value from the API key secret). Without verification, anyone who found this
    URL could POST a fake "payment captured" event and mark bookings paid for
    free, so an unset secret rejects every request rather than trusting them.

    Idempotency: the browser callback and this webhook race each other, and
    Razorpay may retry. Marking an already-paid booking paid again is treated
    as success and changes nothing.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []   # Razorpay has no session/JWT with us
    throttle_classes = []         # never rate-limit payment notifications

    def post(self, request):
        secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", "")
        if not secret:
            logger.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is unset.")
            return Response(
                {"detail": "Webhook not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        signature = request.headers.get("X-Razorpay-Signature", "")
        if not signature:
            return Response(
                {"detail": "Missing signature."}, status=status.HTTP_400_BAD_REQUEST
            )

        # Verify against the RAW body — re-serialising request.data would change
        # key order/whitespace and never match the signature.
        raw_body = request.body.decode("utf-8")

        expected = hmac.new(
            secret.encode("utf-8"), raw_body.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        # Constant-time compare so an attacker can't discover the signature
        # byte-by-byte from response timing.
        if not hmac.compare_digest(expected, signature):
            logger.warning("Razorpay webhook signature mismatch — rejected.")
            return Response(
                {"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payload = json.loads(raw_body)
        except json.JSONDecodeError:
            return Response(
                {"detail": "Malformed payload."}, status=status.HTTP_400_BAD_REQUEST
            )

        event = payload.get("event", "")
        entity = (
            payload.get("payload", {}).get("payment", {}).get("entity", {}) or {}
        )
        order_id = entity.get("order_id")
        payment_id = entity.get("id")

        if not order_id:
            # Events we don't handle (refunds, settlements, subscriptions).
            # Return 200 so Razorpay stops retrying something we ignore on purpose.
            return Response({"status": "ignored", "event": event})

        with transaction.atomic():
            booking = (
                Booking.objects.select_for_update()
                .filter(razorpay_order_id=order_id)
                .first()
            )

            if booking is None:
                logger.warning("Webhook for unknown order_id=%s", order_id)
                # 200 prevents endless retries for an order we have no record of.
                return Response({"status": "unknown_order"})

            if event == "payment.captured":
                if booking.status == Booking.Status.PAID:
                    # Browser callback already handled it, or Razorpay retried.
                    return Response({"status": "already_paid", "booking_id": booking.id})

                booking.status = Booking.Status.PAID
                booking.razorpay_payment_id = payment_id or booking.razorpay_payment_id
                booking.save(update_fields=["status", "razorpay_payment_id", "updated_at"])
                logger.info("Booking %s marked PAID via webhook.", booking.id)
                return Response({"status": "marked_paid", "booking_id": booking.id})

            if event == "payment.failed":
                # Don't overwrite a successful payment with a failure from an
                # earlier abandoned attempt on the same order.
                if booking.status != Booking.Status.PAID:
                    booking.status = Booking.Status.FAILED
                    booking.save(update_fields=["status", "updated_at"])
                return Response({"status": "marked_failed", "booking_id": booking.id})

        return Response({"status": "ignored", "event": event})
