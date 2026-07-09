from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.core_voyager, name="voyager"),
]