from django.urls import path, include
from . import views

urlpatterns = [
    path('entrypoint/', views.entrypoint, name="entrypoint"),
    path('quickstart/', views.quick_start, name="quick_start"),
    path("locations/search/", views.location_search, name="location_search",),
    path('studio/', views.studio, name="studio"),
]