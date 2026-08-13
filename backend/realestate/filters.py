# realestate/filters.py
import django_filters
from properties.models import Property


class PropertyFilter(django_filters.FilterSet):
    """
    Declarative filter set for the Property model.
    Supports range filters for price/beds and exact match for categoricals.
    """

    price_min = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    beds_min = django_filters.NumberFilter(field_name="beds", lookup_expr="gte")
    area_min = django_filters.NumberFilter(field_name="area_sqft", lookup_expr="gte")
    area_max = django_filters.NumberFilter(field_name="area_sqft", lookup_expr="lte")
    city = django_filters.CharFilter(lookup_expr="icontains")
    state = django_filters.CharFilter(lookup_expr="icontains")
    locality = django_filters.CharFilter(lookup_expr="icontains")
    zip_code = django_filters.CharFilter(lookup_expr="iexact")
    year_built_min = django_filters.NumberFilter(field_name="year_built", lookup_expr="gte")
    bhk = django_filters.NumberFilter(field_name="bhk")
    bhk_min = django_filters.NumberFilter(field_name="bhk", lookup_expr="gte")

    class Meta:
        model = Property
        fields = {
            "property_type": ["exact"],
            "category": ["exact"],
            "status": ["exact"],
            "beds": ["exact"],
            "baths": ["exact", "gte"],
            "agent": ["exact"],
            "possession_status": ["exact"],
            "furnishing": ["exact"],
            "transaction_type": ["exact"],
            "is_verified": ["exact"],
            "is_featured": ["exact"],
        }
