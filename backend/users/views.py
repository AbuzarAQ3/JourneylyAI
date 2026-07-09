from django.shortcuts import render, redirect

def settings(request):
    return render(request, 'account/settings_base_layout.html')
def temp(request):
    return render(request, 'temp.html')
def temp2(request):
    return render(request, 'temp2.html')