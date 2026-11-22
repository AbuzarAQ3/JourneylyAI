from datetime import timedelta, timezone as dt_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
import logging

from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.utils import timezone as django_timezone

from voyager.models import LocationModel
from voyager.forms import QuickStartForm
from voyager.services.weather_forecasts import (
    OpenMeteoWeatherService,
    WeatherServiceError,
)

logger = logging.getLogger(__name__)


def bind_local_timezone(dt_value, tz: ZoneInfo):
    """Attaches destination timezone cleanly whether dt_value is naive or aware."""
    if django_timezone.is_aware(dt_value):
        # Strip Django's default server timezone without shifting the wall-clock time
        dt_value = django_timezone.make_naive(dt_value)
    return django_timezone.make_aware(dt_value, tz)

@login_required
def quick_start(request):
    if request.method == "POST":
        form = QuickStartForm(request.POST)

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
                return render(request, "voyager/quick_start.html", {"form": form})

            # Safely bind destination timezone
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
                with transaction.atomic():
                    journey = form.save(commit=False)
                    journey.user = request.user
                    journey.save()

                    LocationModel.objects.create(
                        journey=journey,
                        location=form.cleaned_data["first_location"],
                        latitude=latitude,
                        longitude=longitude,
                        arrival_at=arrival_at,
                        departure_at=departure_at,
                        timezone=timezone_name,
                        position=0,
                    )

                return redirect('studio', pk=journey.pk)
    else:
        form = QuickStartForm()

    context = {
        'form': form,
    }

    return render(
        request,
        "voyager/quick_start.html",
        context
    )
