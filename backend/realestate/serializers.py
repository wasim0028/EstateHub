# serializers.py — combined for users & properties
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from users.models import AgentProfile
from properties.models import Booking, ContactMessage, Inquiry, Locality, Property, PropertyImage, SavedProperty

User = get_user_model()


# ─────────────────────────────────────────────
# USER & AUTH SERIALIZERS
# ─────────────────────────────────────────────


class AgentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentProfile
        fields = [
            "id",
            "phone",
            "company",
            "bio",
            "image",
            "license_number",
            "years_of_experience",
            "specializations",
            "website",
            "linkedin",
        ]


class UserSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for public user data.
    Includes nested agent_profile when present.
    """

    agent_profile = AgentProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "phone",
            "avatar",
            "agent_profile",
            "created_at",
        ]
        read_only_fields = ["id", "role", "created_at"]

    def get_full_name(self, obj):
        return obj.full_name


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Handles new user registration with password confirmation.
    """

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
            "username",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
            "role",
            "phone",
        ]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            password=validated_data["password"],
            role=validated_data.get("role", User.Role.BUYER),
            phone=validated_data.get("phone", ""),
        )
        # Auto-create agent profile for agent role
        if user.role == User.Role.AGENT:
            AgentProfile.objects.create(user=user, phone=user.phone, company="")
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT pair serializer to include user data in the response.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


# ─────────────────────────────────────────────
# PROPERTY SERIALIZERS
# ─────────────────────────────────────────────


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image_url", "caption", "is_primary", "order"]


class PropertyAgentSerializer(serializers.ModelSerializer):
    """
    Lightweight agent info embedded within property responses.
    """

    agent_profile = AgentProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "phone", "avatar", "agent_profile"]

    def get_full_name(self, obj):
        return obj.full_name


class PropertyListSerializer(serializers.ModelSerializer):
    """
    Compact serializer for property list views (cards, search results).
    Avoids heavy fields like full description and all images.
    """

    primary_image = serializers.SerializerMethodField()
    agent_name = serializers.SerializerMethodField()
    formatted_price = serializers.CharField(read_only=True)
    bhk_label = serializers.CharField(read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id",
            "slug",
            "title",
            "property_type",
            "category",
            "status",
            "price",
            "formatted_price",
            "price_per_sqft",
            "locality",
            "city",
            "state",
            "zip_code",
            "bhk",
            "bhk_label",
            "beds",
            "baths",
            "area_sqft",
            "possession_status",
            "furnishing",
            "transaction_type",
            "is_verified",
            "is_featured",
            "primary_image",
            "agent_name",
            "is_saved",
            "created_at",
        ]

    def get_primary_image(self, obj):
        return obj.primary_image

    def get_agent_name(self, obj):
        return obj.agent.full_name if obj.agent else None

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        # `_saved_ids` may be pre-populated by the view for efficiency
        saved_ids = self.context.get("saved_ids")
        if saved_ids is not None:
            return obj.id in saved_ids
        return SavedProperty.objects.filter(user=request.user, property=obj).exists()


class PropertyDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer for property detail pages.
    Includes nested images and full agent profile.
    """

    images = PropertyImageSerializer(many=True, read_only=True)
    agent = PropertyAgentSerializer(read_only=True)
    agent_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.AGENT),
        source="agent",
        write_only=True,
        required=False,
    )
    formatted_price = serializers.CharField(read_only=True)
    bhk_label = serializers.CharField(read_only=True)
    primary_image = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id",
            "slug",
            "title",
            "description",
            "property_type",
            "category",
            "status",
            "price",
            "formatted_price",
            "price_per_sqft",
            "address",
            "locality",
            "city",
            "state",
            "zip_code",
            "country",
            "latitude",
            "longitude",
            "bhk",
            "bhk_label",
            "beds",
            "baths",
            "area_sqft",
            "carpet_area_sqft",
            "lot_size_sqft",
            "year_built",
            "garage_spaces",
            "floors",
            "possession_status",
            "furnishing",
            "transaction_type",
            "is_verified",
            "is_featured",
            "views_count",
            "features",
            "images",
            "primary_image",
            "agent",
            "agent_id",
            "is_saved",
            "meta_description",
            "listed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "slug", "price_per_sqft", "views_count", "created_at", "updated_at",
        ]

    def get_primary_image(self, obj):
        return obj.primary_image

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return SavedProperty.objects.filter(user=request.user, property=obj).exists()


class PropertyWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating properties (agent dashboard).
    Handles image URL list as separate payload for bulk creation.
    """

    image_urls = serializers.ListField(
        child=serializers.URLField(),
        write_only=True,
        required=False,
        help_text="List of image URLs to attach to this property",
    )

    class Meta:
        model = Property
        exclude = ["slug", "price_per_sqft", "views_count", "created_at", "updated_at"]

    def create(self, validated_data):
        image_urls = validated_data.pop("image_urls", [])
        property_instance = super().create(validated_data)
        self._save_images(property_instance, image_urls)
        return property_instance

    def update(self, instance, validated_data):
        image_urls = validated_data.pop("image_urls", None)
        instance = super().update(instance, validated_data)
        if image_urls is not None:
            instance.images.all().delete()
            self._save_images(instance, image_urls)
        return instance

    def _save_images(self, property_instance, image_urls):
        images = [
            PropertyImage(
                property=property_instance,
                image_url=url,
                is_primary=(i == 0),
                order=i,
            )
            for i, url in enumerate(image_urls)
        ]
        PropertyImage.objects.bulk_create(images)


# ─────────────────────────────────────────────
# INQUIRY SERIALIZER
# ─────────────────────────────────────────────


class InquirySerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source="property.title", read_only=True)
    property_id = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(), source="property"
    )

    class Meta:
        model = Inquiry
        fields = [
            "id",
            "property_id",
            "property_title",
            "name",
            "email",
            "phone",
            "message",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def create(self, validated_data):
        # Associate the authenticated user if logged in
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["user"] = request.user
            if not validated_data.get("name"):
                validated_data["name"] = request.user.full_name
            if not validated_data.get("email"):
                validated_data["email"] = request.user.email
        return super().create(validated_data)


# ─────────────────────────────────────────────
# LOCALITY & SAVED PROPERTY (WISHLIST) SERIALIZERS
# ─────────────────────────────────────────────


class LocalitySerializer(serializers.ModelSerializer):
    property_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Locality
        fields = [
            "id",
            "name",
            "city",
            "state",
            "slug",
            "description",
            "avg_price_per_sqft",
            "image_url",
            "property_count",
        ]


class SavedPropertySerializer(serializers.ModelSerializer):
    property = PropertyListSerializer(read_only=True)
    property_id = serializers.PrimaryKeyRelatedField(
        queryset=Property.objects.all(), source="property", write_only=True
    )

    class Meta:
        model = SavedProperty
        fields = ["id", "property", "property_id", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data["user"] = request.user
        obj, _ = SavedProperty.objects.get_or_create(
            user=validated_data["user"], property=validated_data["property"]
        )
        return obj


# ─────────────────────────────────────────────
# SITE VISIT BOOKING (RAZORPAY TOKEN PAYMENT) SERIALIZERS
# ─────────────────────────────────────────────


class BookingSerializer(serializers.ModelSerializer):
    property = PropertyListSerializer(read_only=True)
    property_title = serializers.CharField(source="property.title", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "property", "property_title", "amount", "status",
            "preferred_date", "notes", "razorpay_order_id", "razorpay_payment_id",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


# ─────────────────────────────────────────────
# CONTACT MESSAGE SERIALIZER
# ─────────────────────────────────────────────


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "phone", "subject", "message", "created_at"]
        read_only_fields = ["id", "created_at"]


# ─────────────────────────────────────────────
# PASSWORD RESET
# ─────────────────────────────────────────────

class PasswordResetRequestSerializer(serializers.Serializer):
    """Accepts the email address to send a reset link to."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Validates the emailed token and the chosen new password."""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "The two passwords do not match."}
            )
        validate_password(attrs["new_password"])
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """
    In-app password change for a signed-in user.

    Requires the current password, so a hijacked session (or someone at an
    unlocked laptop) can't silently take over the account by setting a new one.
    """

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("That is not your current password.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "The two passwords do not match."}
            )
        if attrs["new_password"] == attrs["current_password"]:
            raise serializers.ValidationError(
                {"new_password": "The new password must be different from the current one."}
            )
        validate_password(attrs["new_password"], self.context["request"].user)
        return attrs


class AgentBookingSerializer(serializers.ModelSerializer):
    """
    Booking as the listing's agent sees it — includes the buyer's contact
    details so the agent can actually meet them for the site visit.

    Only ever served from the for_my_listings endpoint, which filters to
    properties the requesting agent owns; buyers never receive this shape.
    """

    property_title = serializers.CharField(source="property.title", read_only=True)
    property_slug = serializers.CharField(source="property.slug", read_only=True)
    buyer_name = serializers.CharField(source="user.full_name", read_only=True)
    buyer_email = serializers.EmailField(source="user.email", read_only=True)
    buyer_phone = serializers.CharField(source="user.phone", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "property_title", "property_slug",
            "buyer_name", "buyer_email", "buyer_phone",
            "amount", "status", "preferred_date", "notes",
            "razorpay_payment_id", "created_at",
        ]
        read_only_fields = fields
