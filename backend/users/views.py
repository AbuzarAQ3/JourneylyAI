from django.shortcuts import render, redirect

def settings(request):
    return render(request, 'account/settings_base_layout.html')