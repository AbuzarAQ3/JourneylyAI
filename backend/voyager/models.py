from django.db import models
from django.conf import settings
from django.utils import timezone

# Core_Voyager/Journey Model:
class JourneyModel(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="Untitled")
    description = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField(default=timezone.localdate)
    end_date = models.DateField()

    def __str__(self):
        return self.title

# Parent Day Model:
class DayModel(models.Model):
    journey = models.ForeignKey(JourneyModel, on_delete=models.CASCADE, related_name='days')
    journey_day = models.PositiveSmallIntegerField()
    journey_date = models.DateField()

    def __str__(self):
        return f'{self.journey} Day: {self.journey_date}'

# Singular, Individual Locations as Destinations:
class LocationModel(models.Model):

    class LocationType(models.TextChoices):
        START = "start", "Starting Point"
        STOP = "stop", "Intermediate Stop"
        END = "end", "Ending Point"
    day = models.ForeignKey(
        DayModel,
        on_delete=models.CASCADE,
        related_name="locations"
    )

    location = models.CharField(max_length=150)
    address = models.CharField(max_length=250, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    location_type = models.CharField(
        max_length=5,
        choices=LocationType.choices,
        default=LocationType.STOP
    )
    position = models.PositiveIntegerField()

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return f'{self.day} At: {self.location}'

# Core Weather Models fetching the reports and statuses, 24 fields per day
class WeatherModel(models.Model):
    day = models.ForeignKey(DayModel, on_delete=models.CASCADE, related_name='weather_reports')
    hourly_weather = models.JSONField(default=dict)

    def __str__(self):
        return f'Weather Reports: {self.day}'

# Activities Model for Additional Markups on the Visualization
class ActivityModel(models.Model):
    day = models.ForeignKey(DayModel, on_delete=models.CASCADE, related_name='day_activities')
    event_location = models.ForeignKey(
        LocationModel, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='location_activities'
    )
    event = models.CharField(max_length=150)
    notes = models.TextField(max_length=250, blank=True)
    scheduled_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    reminder = models.BooleanField(default=False) # future: imma use remind_at DateTimeField for notification mechanism.
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return f'{self.event} - {self.day}'