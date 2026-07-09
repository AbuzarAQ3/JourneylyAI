from django.db import models
from django.conf import settings
from cities_light.models import City

# Main Container Model:
class TripsModel(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=100, default="Untitled")
    description = models.TextField(max_length=512, blank=True)
    startDate = models.DateField()
    endDate = models.DateField()

    def __str__(self):
        return self.title

# Destinations Per Day Model:
class dayModel(models.Model):
    trip = models.ForeignKey(TripsModel, on_delete=models.CASCADE)
    day = models.PositiveSmallIntegerField()
    dayDate = models.DateField()
    destinations = models.ManyToManyField(City, through='destinationModel')

# Singular, Individual Destination:
class destinationModel(models.Model):
    day = models.ForeignKey(dayModel, on_delete=models.CASCADE)
    destination = models.ForeignKey(City, on_delete=models.CASCADE)
    order = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ['order']
        unique_together = ['day', 'destination']