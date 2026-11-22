from django.db import models
from django.conf import settings
from django.utils import timezone
from zoneinfo import ZoneInfo
from datetime import timedelta
from django.core.validators import MaxValueValidator

# Core_Voyager/Journey Model:
class JourneyModel(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="Untitled")
    description = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def start_date(self):
        first = self.locations.order_by("position").first()
        if not first:
            return None

        return timezone.localtime(
            first.arrival_at,
            ZoneInfo(first.timezone)
        ).date()

    @property
    def end_date(self):
        last = self.locations.order_by("-position").first()
        if not last:
            return None

        local_departure = timezone.localtime(
            last.departure_at,
            ZoneInfo(last.timezone)
        )
        return (local_departure - timedelta(microseconds=1)).date()

    def __str__(self):
        return self.title

# Locations throught the Journey with specified datetime duration:
class LocationModel(models.Model):

    journey = models.ForeignKey(
        JourneyModel,
        on_delete=models.CASCADE,
        related_name="locations"
    )

    location = models.CharField(max_length=150)
    position = models.PositiveSmallIntegerField()
    arrival_at = models.DateTimeField()
    departure_at = models.DateTimeField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    timezone = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ["position", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["journey", "position"],
                name="unique_location_position_per_journey",
            )
        ]
    
    def __str__(self):
        return self.location

# Core Weather Models for forecasts for each location for a specified duration.
class WeatherModel(models.Model):

    location = models.ForeignKey(
        LocationModel,
        on_delete=models.CASCADE,
        related_name='weather_reports',
    )
    date = models.DateField()
    temp_max = models.FloatField(null=True, blank=True)
    temp_min = models.FloatField(null=True, blank=True)
    precipitation_prob = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MaxValueValidator(100)],
    )
    precipitation_sum = models.FloatField(null=True, blank=True)
    wind_speed_max = models.FloatField(null=True, blank=True)
    hourly_data = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["location", "date"],
                name="unique_weather_per_location_date",
            )
        ]

    def __str__(self):
        return f'Weather: {self.location}'
    
# Activities Model for Additional Markups on the Visualization
class ActivityModel(models.Model):
    event_location = models.ForeignKey(
        LocationModel, 
        on_delete=models.CASCADE, 
        related_name='location_activities'
    )
    event = models.CharField(max_length=100)
    address = models.CharField(max_length=100, blank=True)
    notes = models.TextField(max_length=250, blank=True)
    scheduled_time = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    position = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.event