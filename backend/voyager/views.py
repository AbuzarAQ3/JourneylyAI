from django.shortcuts import render
from django.urls import reverse
from datetime import timedelta
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import redirect, render
from django.views.decorators.http import require_GET
import requests

from .services.geocoding import resolve_place
from .forms import QuickStartForm
from .models import JourneyModel, DayModel, LocationModel

# entrypoint to the voyager studio
@login_required
def entrypoint(request):
    journeys = JourneyModel.objects.filter(user=request.user)
    context = {
        'journeys': journeys,
    }
    return render(request, 'voyager/voyager_studio_entrypoint.html', context)

# quick start mode
@login_required
def quick_start(request):
    if request.method == "POST":
        form = QuickStartForm(request.POST)

        if form.is_valid():
            with transaction.atomic():
                journey = form.save(commit=False)
                journey.user = request.user
                journey.save()

                first_day = None
                total_days = (journey.end_date - journey.start_date).days + 1

                for day_number in range(1, total_days + 1):
                    journey_date = journey.start_date + timedelta(days=day_number - 1)
                    day = DayModel.objects.create(
                        journey=journey,
                        journey_day=day_number,
                        journey_date=journey_date,
                    )
                    if first_day is None:
                        first_day = day

                LocationModel.objects.create(
                    day=first_day,
                    location=form.cleaned_data["first_location"],
                    latitude=form.cleaned_data["first_latitude"],
                    longitude=form.cleaned_data["first_longitude"],
                    location_type=LocationModel.LocationType.START,
                    position=0,
                )
            return redirect("studio")
        
    else:
        form = QuickStartForm()
        
    return render(request, "voyager/quick_start.html", {"form": form})

# location fetcher using the geocoding module
@login_required
@require_GET
def location_search(request):
    query = request.GET.get("first_location", "").strip()

    places = []
    search_error = False

    if len(query) >= 3:
        try:
            places = resolve_place(query)

        except LookupError:
            pass

        except requests.RequestException:
            search_error = True

    return render(
        request,
        "voyager/partials/_location_suggestions.html",
        {
            "places": places,
            "query": query,
            "search_error": search_error,
        },
    )

# voyager_studio core view
@login_required
def studio(request):
    home_url = reverse('home')
    logout_url = reverse('account_logout')
    if request.user.is_authenticated:
        print(request.user.id, request.user.username, request.user.email)
    else:
        print("User: No Active Session")

    context = {
    }

    return render(request, 'voyager/voyager_studio.html', context)

