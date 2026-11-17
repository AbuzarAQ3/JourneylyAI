from django.contrib import admin
from voyager.models import JourneyModel, DayModel, LocationModel, ActivityModel

# Register your models here.

@admin.register(JourneyModel)
class JourneyModelAdmin(admin.ModelAdmin):
    pass

@admin.register(DayModel)
class DayModelAdmin(admin.ModelAdmin):
    pass

@admin.register(LocationModel)
class LocationModelAdmin(admin.ModelAdmin):
    pass

@admin.register(ActivityModel)
class ActivityModelAdmin(admin.ModelAdmin):
    pass
