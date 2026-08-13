# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model extending AbstractUser.
    Adds role-based differentiation between agents and regular users.
    """

    class Role(models.TextChoices):
        BUYER = "buyer", "Buyer"
        AGENT = "agent", "Agent"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.get_full_name()} <{self.email}>"

    @property
    def is_agent(self):
        return self.role == self.Role.AGENT

    @property
    def full_name(self):
        return self.get_full_name() or self.username


class AgentProfile(models.Model):
    """
    Extended profile for users with the Agent role.
    OneToOne relationship ensures a single profile per agent.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="agent_profile",
        limit_choices_to={"role": User.Role.AGENT},
    )
    phone = models.CharField(max_length=20)
    company = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    image = models.URLField(blank=True, help_text="S3 or Cloudinary URL")
    license_number = models.CharField(max_length=100, blank=True)
    years_of_experience = models.PositiveSmallIntegerField(default=0)
    specializations = models.JSONField(
        default=list, blank=True, help_text='e.g. ["Luxury", "Commercial"]'
    )
    website = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agent_profiles"
        verbose_name = "Agent Profile"
        verbose_name_plural = "Agent Profiles"

    def __str__(self):
        return f"Agent: {self.user.full_name} @ {self.company}"
