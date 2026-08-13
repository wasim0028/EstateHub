from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from users.models import AgentProfile, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'full_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Real Estate Profile', {'fields': ('role', 'phone', 'avatar')}),
    )


@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'phone', 'years_of_experience')
    search_fields = ('user__email', 'company')
