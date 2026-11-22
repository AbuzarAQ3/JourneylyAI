from django.urls import path, include
from . import views

urlpatterns = [
    path('entrypoint/', views.entrypoint, name="entrypoint"),
    path('quickstart/', views.quick_start, name="quick_start"),
    path("locations/search/", views.location_search, name="location_search",),
    path('studio/<int:pk>/', views.studio, name="studio"),
    path('studio/', views.studio, name="studio"),


    path('temp_studio/', views.temp_studio, name="temp_studio"),
    path('temp_act/', views.temp_act, name="temp_act"),
]