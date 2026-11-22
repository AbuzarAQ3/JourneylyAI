from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required

from voyager.models import JourneyModel

# entrypoint to the voyager studio
@login_required
def entrypoint(request):
    journeys = JourneyModel.objects.filter(user=request.user)
    context = {
        'journeys': journeys,
    }
    return render(request, 'voyager/entrypoint.html', context)