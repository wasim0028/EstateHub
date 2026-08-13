from django.contrib import admin

from properties.models import Booking, ContactMessage, Inquiry, Locality, Property, PropertyImage, SavedProperty


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'city', 'locality', 'bhk', 'property_type', 'status',
        'price', 'is_verified', 'is_featured', 'agent', 'created_at',
    )
    list_filter = (
        'property_type', 'category', 'status', 'city', 'possession_status',
        'furnishing', 'transaction_type', 'is_verified', 'is_featured',
    )
    list_editable = ('is_verified', 'is_featured')
    search_fields = ('title', 'address', 'locality', 'city', 'state', 'zip_code')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [PropertyImageInline]
    autocomplete_fields = ['agent']


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'property', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'email', 'property__title')


@admin.register(Locality)
class LocalityAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'state', 'avg_price_per_sqft')
    list_filter = ('city',)
    search_fields = ('name', 'city')
    prepopulated_fields = {'slug': ('name', 'city')}


@admin.register(SavedProperty)
class SavedPropertyAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'created_at')
    search_fields = ('user__email', 'property__title')


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'amount', 'status', 'preferred_date', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__email', 'property__title', 'razorpay_order_id', 'razorpay_payment_id')
    readonly_fields = ('razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'created_at', 'updated_at')


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)
