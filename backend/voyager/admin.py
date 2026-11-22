from django.contrib import admin
from voyager.models import JourneyModel, LocationModel, WeatherModel, ActivityModel

# Register your models here.

@admin.register(JourneyModel)
class JourneyModelAdmin(admin.ModelAdmin):
    pass

@admin.register(LocationModel)
class LocationModelAdmin(admin.ModelAdmin):
    list_display = ('journey', 'location', 'arrival_at')
    list_filter = ('journey', 'location',)
    search_fields = ('location',)      

@admin.register(WeatherModel)
class WeatherModelAdmin(admin.ModelAdmin):
    pass

@admin.register(ActivityModel)
class ActivityModelAdmin(admin.ModelAdmin):
    pass
