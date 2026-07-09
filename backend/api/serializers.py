from rest_framework import serializers
from .models import Core, Component, Item, Item_Generic, Item_Viewset, Item_ViewsetModel

class CoreSerializers(serializers.ModelSerializer):
    class Meta:
        model = Core
        fields = '__all__'

class ComponentSerializers(serializers.ModelSerializer):
    class Meta:
        model = Component
        fields = '__all__'

class ItemSerializers(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class Item_GenericSerializers(serializers.ModelSerializer):
    class Meta:
        model = Item_Generic
        fields = '__all__'

class Item_ViewsetSerializers(serializers.ModelSerializer):
    class Meta:
        model = Item_Viewset
        fields = '__all__'

class Item_ViewsetModelSerializers(serializers.ModelSerializer):
    class Meta:
        model = Item_ViewsetModel
        fields = '__all__'