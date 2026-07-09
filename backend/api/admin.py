from django.contrib import admin
from .models import Core, Component, Item, Item_Generic, Item_Viewset, Item_ViewsetModel

admin.site.register(Core)
admin.site.register(Component)
admin.site.register(Item)
admin.site.register(Item_Generic)
admin.site.register(Item_Viewset)