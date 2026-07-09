from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('item_viewset', views.Items_Viewset, basename='Item_Viewset')
router.register('item_viewset', views.Items_ViewsetModel, basename='Item_ViewsetModel')

urlpatterns = [
    path('core', views.api_views, name='api_views'),
    path('core/<int:pk>/', views.api_view_details),

    path('component/', views.Components.as_view()),
    path('component/<int:pk>/', views.ComponentsFull.as_view()),

    path('item/', views.Items.as_view()),
    path('item/<int:pk>/', views.ItemsFull.as_view()),

    path('item_generic/', views.Items_Generic.as_view()),
    path('item_generic/<int:pk>/', views.Items_GenericFull.as_view()),
    
    path('', include(router.urls))
]