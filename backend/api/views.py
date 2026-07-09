from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.http import Http404
from .models import Core, Component, Item, Item_Generic, Item_Viewset, Item_ViewsetModel
from .serializers import CoreSerializers, ComponentSerializers, ItemSerializers, Item_GenericSerializers, Item_ViewsetSerializers, Item_ViewsetModelSerializers
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import mixins, generics, viewsets
from .paginations import CustomPagination
from django_filters.rest_framework import DjangoFilterBackend

@api_view(['GET', 'POST'])
def api_views(request):
    if request.method == 'GET':
        trips = Core.objects.all()
        serializer = CoreSerializers(trips, many = True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        serializer = CoreSerializers(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status = status.HTTP_201_CREATED)
        return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def api_view_details(request, pk):
    try:
        trips = Core.objects.get(pk = pk)
    except Core.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = CoreSerializers(trips)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = CoreSerializers(trips, data = request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status = status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status = status.HTTP_400_BAD_REQUEST)
    
    elif request.method =='DELETE':
        trips.delete()
        return Response(status = status.HTTP_204_NO_CONTENT)
    
class Components(APIView):
    def get(self, request):
        components = Component.objects.all()
        serializer = ComponentSerializers(components, many = True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = ComponentSerializers(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class ComponentsFull(APIView):
    def get_object(self, pk):
        try:
            component = Component.objects.get(pk=pk)
            return component
        except Component.DoesNotExist:
            raise Http404
        
    def get(self, request, pk):
        component = self.get_object(pk)
        serializer = ComponentSerializers(component)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        component = self.get_object(pk)
        serializer = ComponentSerializers(component, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        component = self.get_object(pk)
        component.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
# MIXINS 
class Items(mixins.ListModelMixin, mixins.CreateModelMixin, generics.GenericAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializers

    def get(self, request):
        return self.list(request)
    def post(self, request):
        return self.create(request)

class ItemsFull(mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, generics.GenericAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializers

    def get(self, request, pk):
        return self.retrieve(request, pk)
    
    def put(self, request, pk):
        return self.update(request, pk)
    
    def delete(self, request, pk):
        return self.destroy(request, pk)
    
#  GENERICS
class Items_Generic(generics.ListCreateAPIView):
    queryset = Item_Generic.objects.all()
    serializer_class = Item_GenericSerializers

# class Items_GenericFull(generics.RetrieveAPIView, generics.UpdateAPIView, generics.DestroyAPIView):
class Items_GenericFull(generics.RetrieveUpdateDestroyAPIView):
    queryset = Item_Generic.objects.all()
    serializer_class = Item_GenericSerializers
    lookup_field = 'pk'
    
# VIEWSETS
class Items_Viewset(viewsets.ViewSet):
    def list(self, request):
        queryset = Item_Viewset.objects.all()
        serializer = Item_ViewsetSerializers(queryset, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = Item_ViewsetSerializers(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def retrieve(self, request, pk=None):
        items = get_object_or_404(Item_Viewset, pk=pk)
        serializer = Item_ViewsetSerializers(items)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def update(self, request, pk=None):
        items = get_object_or_404(Items_Viewset, pk=pk)
        serializer = Item_ViewsetSerializers(Item_Viewset, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)

    def delete(request, pk=None):
        items = get_object_or_404(Items_Viewset, pk=pk)
        items.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class Items_ViewsetModel(viewsets.ModelViewSet):
    queryset = Item_ViewsetModel.objects.all()
    serializer_class = Item_ViewsetModelSerializers
    