# properties/models.py
from django.conf import settings
from django.db import models
from django.utils.text import slugify


def format_indian_currency(amount):
    """
    Formats a numeric amount using the Indian numbering system with
    Lakh (L) / Crore (Cr) suffixes, the convention used by Indian
    real-estate portals such as housing.com and 99acres.
    e.g. 4500000 -> "₹45.0 L", 125000000 -> "₹12.5 Cr"
    """
    if amount is None:
        return "₹0"
    amount = float(amount)
    if amount >= 1_00_00_000:  # 1 crore
        return f"₹{amount / 1_00_00_000:.2f} Cr"
    if amount >= 1_00_000:  # 1 lakh
        return f"₹{amount / 1_00_000:.2f} L"
    return f"₹{amount:,.0f}"


class Property(models.Model):
    """
    Core Property listing model.
    Supports both Sale and Rent listings with comprehensive detail fields.
    """

    class PropertyType(models.TextChoices):
        SALE = "sale", "For Sale"
        RENT = "rent", "For Rent"

    class PropertyCategory(models.TextChoices):
        HOUSE = "house", "House"
        APARTMENT = "apartment", "Apartment"
        CONDO = "condo", "Condo"
        TOWNHOUSE = "townhouse", "Townhouse"
        LAND = "land", "Land"
        COMMERCIAL = "commercial", "Commercial"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PENDING = "pending", "Pending"
        SOLD = "sold", "Sold"
        RENTED = "rented", "Rented"
        OFF_MARKET = "off_market", "Off Market"

    class PossessionStatus(models.TextChoices):
        READY_TO_MOVE = "ready_to_move", "Ready to Move"
        UNDER_CONSTRUCTION = "under_construction", "Under Construction"
        NEW_LAUNCH = "new_launch", "New Launch"

    class Furnishing(models.TextChoices):
        UNFURNISHED = "unfurnished", "Unfurnished"
        SEMI_FURNISHED = "semi_furnished", "Semi-Furnished"
        FULLY_FURNISHED = "fully_furnished", "Fully Furnished"

    class TransactionType(models.TextChoices):
        NEW_BOOKING = "new_booking", "New Booking"
        RESALE = "resale", "Resale"

    # Core identification
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    description = models.TextField()

    # Listing classification
    property_type = models.CharField(
        max_length=10, choices=PropertyType.choices, default=PropertyType.SALE
    )
    category = models.CharField(
        max_length=15, choices=PropertyCategory.choices, default=PropertyCategory.HOUSE
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.ACTIVE
    )

    # Pricing
    price = models.DecimalField(max_digits=14, decimal_places=2)
    price_per_sqft = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    # Location
    address = models.CharField(max_length=500)
    locality = models.CharField(
        max_length=150, blank=True, db_index=True,
        help_text="Neighbourhood / locality, e.g. Salt Lake Sector V",
    )
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, db_index=True)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default="India")
    latitude = models.DecimalField(
        max_digits=12, decimal_places=8, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=12, decimal_places=8, null=True, blank=True
    )

    # Property details
    bhk = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Number of bedrooms as BHK config, e.g. 3 for 3BHK"
    )
    beds = models.PositiveSmallIntegerField(default=0)
    baths = models.DecimalField(
        max_digits=3, decimal_places=1, default=0, help_text="e.g. 2.5 for 2 full + 1 half"
    )
    area_sqft = models.PositiveIntegerField(default=0)
    carpet_area_sqft = models.PositiveIntegerField(null=True, blank=True)
    lot_size_sqft = models.PositiveIntegerField(null=True, blank=True)
    year_built = models.PositiveSmallIntegerField(null=True, blank=True)
    garage_spaces = models.PositiveSmallIntegerField(default=0)
    floors = models.PositiveSmallIntegerField(default=1)

    possession_status = models.CharField(
        max_length=20, choices=PossessionStatus.choices,
        default=PossessionStatus.READY_TO_MOVE,
    )
    furnishing = models.CharField(
        max_length=20, choices=Furnishing.choices, default=Furnishing.UNFURNISHED,
    )
    transaction_type = models.CharField(
        max_length=20, choices=TransactionType.choices, default=TransactionType.NEW_BOOKING,
    )

    # Trust / marketing signals (housing.com / 99acres style)
    is_verified = models.BooleanField(
        default=False, help_text="RERA / agent-verified listing"
    )
    is_featured = models.BooleanField(
        default=False, help_text="Show in featured/spotlight sections"
    )
    views_count = models.PositiveIntegerField(default=0)

    # Features & amenities stored as JSON for flexibility
    features = models.JSONField(
        default=list,
        blank=True,
        help_text='e.g. ["Pool", "Gym", "Pet Friendly"]',
    )

    # Relationships
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="listings",
        limit_choices_to={"role": "agent"},
    )

    # SEO
    meta_description = models.CharField(max_length=300, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    listed_at = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "properties"
        verbose_name = "Property"
        verbose_name_plural = "Properties"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["city", "state"]),
            models.Index(fields=["property_type", "status"]),
            models.Index(fields=["price"]),
            models.Index(fields=["beds"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.city}, {self.state}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f"{self.title}-{self.city}")
            slug = base_slug
            counter = 1
            while Property.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug

        if self.area_sqft and self.price:
            self.price_per_sqft = self.price / self.area_sqft

        super().save(*args, **kwargs)

    @property
    def primary_image(self):
        img = self.images.filter(is_primary=True).first()
        if not img:
            img = self.images.first()
        return img.image_url if img else None

    @property
    def formatted_price(self):
        display = format_indian_currency(self.price)
        if self.property_type == self.PropertyType.RENT:
            return f"{display}/mo"
        return display

    @property
    def bhk_label(self):
        return f"{self.bhk} BHK" if self.bhk else ""


class PropertyImage(models.Model):
    """
    Stores image references (URLs) for a Property.
    Supports ordering and marking a primary/thumbnail image.
    Images themselves are hosted on S3 or Cloudinary.
    """

    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="images"
    )
    image_url = models.URLField(help_text="S3 or Cloudinary public URL")
    caption = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "property_images"
        verbose_name = "Property Image"
        verbose_name_plural = "Property Images"
        ordering = ["-is_primary", "order"]

    def __str__(self):
        tag = " [PRIMARY]" if self.is_primary else ""
        return f"Image for {self.property.title}{tag}"

    def save(self, *args, **kwargs):
        # Ensure only one primary image per property
        if self.is_primary:
            PropertyImage.objects.filter(
                property=self.property, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class Inquiry(models.Model):
    """
    Contact inquiry submitted by a visitor/user about a specific property.
    Allows both authenticated users and anonymous visitors.
    """

    class Status(models.TextChoices):
        NEW = "new", "New"
        READ = "read", "Read"
        RESPONDED = "responded", "Responded"
        CLOSED = "closed", "Closed"

    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="inquiries"
    )

    # Optional FK if the user is logged in
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inquiries",
    )

    # Always-required contact fields (supports anonymous submissions)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    message = models.TextField()

    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.NEW
    )
    agent_notes = models.TextField(blank=True, help_text="Internal notes from the agent")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inquiries"
        verbose_name = "Inquiry"
        verbose_name_plural = "Inquiries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Inquiry from {self.name} about {self.property.title}"


class Locality(models.Model):
    """
    A neighbourhood / locality within a city, used to power
    "Explore by locality" insight sections on the homepage and city pages —
    similar to housing.com's locality guide pages.
    """

    name = models.CharField(max_length=150)
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True)
    avg_price_per_sqft = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    image_url = models.URLField(blank=True)

    class Meta:
        db_table = "localities"
        verbose_name = "Locality"
        verbose_name_plural = "Localities"
        unique_together = ("name", "city")
        ordering = ["city", "name"]

    def __str__(self):
        return f"{self.name}, {self.city}"

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f"{self.name}-{self.city}")
            slug = base_slug
            counter = 1
            while Locality.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def property_count(self):
        return Property.objects.filter(
            locality__iexact=self.name, city__iexact=self.city, status="active"
        ).count()


class SavedProperty(models.Model):
    """
    A user's "shortlisted" / wishlisted property — the heart-icon save
    feature found on housing.com and 99acres.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_properties"
    )
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="saved_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "saved_properties"
        verbose_name = "Saved Property"
        verbose_name_plural = "Saved Properties"
        unique_together = ("user", "property")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} saved {self.property.title}"


class Booking(models.Model):
    """
    A site-visit reservation. The buyer pays a small refundable "token"
    amount via Razorpay (UPI/PhonePe/GPay/cards) to lock in a visit slot —
    mirrors the "book a site visit" token-payment flow used by Indian
    real-estate portals. Payment is required to be logged in.
    """

    class Status(models.TextChoices):
        CREATED = "created", "Created"       # Razorpay order created, awaiting payment
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="site_visit_bookings"
    )
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="site_visit_bookings"
    )
    amount = models.DecimalField(
        max_digits=8, decimal_places=2, help_text="Token amount in INR"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)

    # Razorpay identifiers
    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)

    preferred_date = models.DateField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "site_visit_bookings"
        ordering = ["-created_at"]
        verbose_name = "Site Visit Booking"
        verbose_name_plural = "Site Visit Bookings"

    def __str__(self):
        return f"{self.user} — {self.property.title} ({self.status})"


class ContactMessage(models.Model):
    """A message submitted through the public /contact page."""

    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "contact_messages"
        ordering = ["-created_at"]
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"

    def __str__(self):
        return f"{self.name} <{self.email}> — {self.subject or 'General enquiry'}"
