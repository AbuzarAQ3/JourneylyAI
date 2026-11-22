# voyager/views/__init__.py
from .entrypoint import entrypoint
from .quick_start import quick_start
from .location_search import location_search
from .studio import studio




#  temporary 
from django.shortcuts import render

def temp_studio(request):
    return render(request, 'voyager/temp_studio.html')

def temp_act(request):
    return render(request, 'voyager/temp_act.html')
