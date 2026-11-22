from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET

from ..services.geocoding import resolve_place
import requests

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