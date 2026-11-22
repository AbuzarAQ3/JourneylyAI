from django.shortcuts import redirect, render
from django.conf import settings
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.db.models import Max
import logging

from django.utils import timezone as django_timezone
from datetime import timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from voyager.models import JourneyModel, LocationModel, WeatherModel
from voyager.forms import AddDestinationForm
from voyager.services.weather_forecasts import OpenMeteoWeatherService, WeatherServiceError

WMO_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    51: "Light drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    80: "Rain showers",
    95: "Thunderstorm",
}

logger = logging.getLogger(__name__)

def bind_local_timezone(dt_value, tz: ZoneInfo):
    """Attaches destination timezone cleanly whether dt_value is naive or aware."""
    if django_timezone.is_aware(dt_value):
        # Strip Django's default server timezone without shifting the wall-clock time
        dt_value = django_timezone.make_naive(dt_value)
    return django_timezone.make_aware(dt_value, tz)

# voyager_studio core view
@login_required
def studio(request, pk):
    home_url = reverse('home')
    logout_url = reverse('account_logout')
    if request.user.is_authenticated:
        print(request.user.id, request.user.username, request.user.email)
    else:
        print("User: No Active Session")

    journey = get_object_or_404(JourneyModel, pk=pk, user=request.user)
    locations = journey.locations.all().order_by("position", "arrival_at")

    if request.method == "POST":
        form = AddDestinationForm(request.POST)

        if form.is_valid():
            latitude = float(form.cleaned_data["first_latitude"])
            longitude = float(form.cleaned_data["first_longitude"])

            try:
                forecast = OpenMeteoWeatherService().fetch_forecast(
                    latitude=latitude,
                    longitude=longitude,
                )
                timezone_name = forecast["timezone"]
                destination_tz = ZoneInfo(timezone_name)
            except (WeatherServiceError, KeyError, ZoneInfoNotFoundError) as exc:
                logger.exception("Timezone resolution failed: %s", exc)
                form.add_error(
                    None,
                    "Could not resolve the destination timezone. Please try again."
                )

            else:
                arrival_at = bind_local_timezone(
                    form.cleaned_data["first_arrival_at"],
                    destination_tz,
                )
                departure_at = bind_local_timezone(
                    form.cleaned_data["first_departure_at"],
                    destination_tz,
                )

                duration = (
                    departure_at.astimezone(dt_timezone.utc)
                    - arrival_at.astimezone(dt_timezone.utc)
                )

                if duration < timedelta(hours=1):
                    form.add_error(
                        "first_departure_at",
                        "Your destination stay must be at least one hour."
                    )
                else:
                    max_pos = (
                        journey.locations.aggregate(Max("position"))["position__max"]
                    )
                    next_position = 0 if max_pos is None else max_pos + 1

                    LocationModel.objects.create(
                        journey=journey,
                        location=form.cleaned_data["first_location"],
                        latitude=latitude,
                        longitude=longitude,
                        arrival_at=arrival_at,
                        departure_at=departure_at,
                        timezone=timezone_name,
                        position=next_position,
                    )

                return redirect("studio", pk=journey.pk)
    else:
        form = AddDestinationForm()


    locations_data = []

    for idx, loc in enumerate(locations, start=1):

        destination_tz = (
            ZoneInfo(loc.timezone)
            if loc.timezone
            else django_timezone.get_current_timezone()
        )

        arrival_local = django_timezone.localtime(
            loc.arrival_at, destination_tz
        )

        departure_local = django_timezone.localtime(
            loc.departure_at, destination_tz
        )

        locations_data.append({
            "id": loc.id,
            "name": loc.location,
            "lat": float(loc.latitude),
            "lng": float(loc.longitude),
            "position": idx,
            "arrival": arrival_local.strftime("%b %d, %H:%M %Z"),
            "departure": departure_local.strftime("%b %d, %H:%M %Z"),
            "timezone": loc.timezone,
        })

    context = {
        'journey': journey,
        'locations': locations,
        'form': form,
        'MAPTILER_MAP_KEY': settings.MAPTILER_MAP_KEY,
        'locations_data': locations_data,
    }

    return render(
        request,
        "voyager/voyager_studio.html", context
    )


def get_weather_forecasts(latitude, longitude, target_date):
    """
        requests:
        (
        latitude: float,
        longitude: float,
        target_date: date,
        )

        returns 
        {
        "date": date_string,
        "timezone": data.get("timezone"),
        "daily": daily_summary,
        "hourly": hourly_records,
        }

        which ofc needz to be processed.
    """
    processed_data = OpenMeteoWeatherService().get_day_forecast(latitude, longitude, target_date)
    print(processed_data)
