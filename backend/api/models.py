from django.db import models

# Create your models here.
class Core(models.Model):
    field1 = models.CharField(max_length=100)
    field2 = models.IntegerField()
    field3 = models.CharField(max_length=10)

    def __str__(self):
        return self.field1

class Component(models.Model):
    field4 = models.IntegerField()
    field5 = models.TextField(max_length=100)

class Item(models.Model):
    field6 = models.IntegerField()
    field7 = models.CharField(max_length=128)

class Item_Generic(models.Model):
    field8 = models.IntegerField()
    field9 = models.CharField(max_length=128)

class Item_Viewset(models.Model):
    field10 = models.IntegerField()
    field11 = models.CharField(max_length=128)

class Item_ViewsetModel(models.Model):
    field12 = models.IntegerField()
    field13 = models.CharField(max_length=128)