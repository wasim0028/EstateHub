# realestate/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAgentOrReadOnly(BasePermission):
    """
    Allows read access to everyone.
    Write access is restricted to authenticated users with the Agent or Admin role.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and request.user.role in ("agent", "admin")
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: only the owning agent or an admin can modify.
    Assumes the model has an `agent` field.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_staff or request.user.role == "admin":
            return True
        # Check agent ownership
        if hasattr(obj, "agent"):
            return obj.agent == request.user
        # Check user ownership (for inquiries, etc.)
        if hasattr(obj, "user"):
            return obj.user == request.user
        return False
