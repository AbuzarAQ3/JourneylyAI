from django.shortcuts import render

def root(request):
    return render(request, 'index.html')
def home(request):
    return render(request, 'main-index.html')
def profile(request):
    return render(request, 'accounts/profile.html')

