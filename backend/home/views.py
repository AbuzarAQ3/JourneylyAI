from django.shortcuts import render

def home(request):
    return render(request, 'home/home.html')
def profile(request):
    return render(request, 'accounts/profile.html')

