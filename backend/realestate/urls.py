# realestate/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from realestate.views import (
    RazorpayWebhookView,
    HealthCheckView,
    ChangePasswordView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    BookingViewSet,
    ContactMessageViewSet,
    InquiryViewSet,
    LocalityViewSet,
    LoginView,
    LogoutView,
    MeView,
    PropertyViewSet,
    RegisterView,
)

router = DefaultRouter()
router.register(r"properties", PropertyViewSet, basename="property")
router.register(r"inquiries", InquiryViewSet, basename="inquiry")
router.register(r"localities", LocalityViewSet, basename="locality")
router.register(r"bookings", BookingViewSet, basename="booking")
router.register(r"contact-messages", ContactMessageViewSet, basename="contact-message")

urlpatterns = [
    # Auth endpoints
    path("webhooks/razorpay/", RazorpayWebhookView.as_view(), name="razorpay-webhook"),
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    # Resource endpoints
    path("", include(router.urls)),
]


# config/urls.py (root)
# from django.contrib import admin
# from django.urls import path, include
#
# urlpatterns = [
#     path("admin/", admin.site.urls),
#     path("api/", include("realestate.urls")),
# ]
