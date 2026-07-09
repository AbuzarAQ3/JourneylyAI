from django.urls import path, include
from . import views

urlpatterns = [
    path('settings/', views.settings, name='settings'),
    path('temp/', views.temp, name='temp'),
    path('temp2/', views.temp2, name='temp2'),
]