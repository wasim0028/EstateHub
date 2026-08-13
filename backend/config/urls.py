"""
Root URL configuration for EstateHub.
Routes /admin/ to Django admin and /api/ to the realestate app's API routes.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('realestate.urls')),
]

# Serve media files locally in development (S3/Cloudinary handles this in prod)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
