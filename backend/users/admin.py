from django.conf import settings
from django.contrib import admin
from django.db import models
from django.contrib.auth.admin import UserAdmin




from django.contrib.auth import get_user_model
User = get_user_model()

class Profile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
from .models import CustomUser
@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    pass
