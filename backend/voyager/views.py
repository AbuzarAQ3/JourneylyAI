from django.shortcuts import render
from django.http import HttpResponse
from django.urls import reverse

# Create your views here.
def core_voyager(request):
    home_url = reverse('home')
    logout_url = reverse('account_logout')
    if request.user.is_authenticated:
        print(request.user.id, request.user.username, request.user.email, request.user.socialaccount_set.all())
    else:
        print("User: No Active Session")


    return render(request, 'core_voyager.html')