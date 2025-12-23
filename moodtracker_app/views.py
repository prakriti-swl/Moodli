from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import logout
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic import TemplateView, View
from .models import Profile
from django.utils import timezone
from datetime import date, timedelta  

from .models import MoodLog
from .serializers import MoodLogSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
import pytz

# -------------------- Home Page -------------------
class HomeView(LoginRequiredMixin, TemplateView):
    template_name = "home.html"
    login_url = "/login/"


# -------------------- Login View -------------------
class LoginView(View):
    def get(self, request, *args, **kwargs):
        form = AuthenticationForm()
        return render(request, 'login.html', {'form': form})

    def post(self, request, *args, **kwargs):
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('home')  
            else:
                form.add_error(None, "Invalid credentials")
        return render(request, 'login.html', {'form': form})

# -------------------- Sign Up View -------------------
class SignUpView(View):
    def get(self, request, *args, **kwargs):
        form = UserCreationForm()
        return render(request, 'signup.html', {'form': form})

    def post(self, request, *args, **kwargs):
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Log the user in immediately after sign-up
            return redirect('home')  
        return render(request, 'signup.html', {'form': form})

# -------------------- Logout View -------------------
class LogoutView(View):
    def get(self, request, *args, **kwargs):
        logout(request)
        return redirect('home')  

# -------------------- Daily Mood Data View -------------------
from itertools import groupby
from django.utils import timezone

class DailyMoodListView(LoginRequiredMixin, TemplateView):
    template_name = "daily_moods.html"
    login_url = "/login/"  # Redirect to login if not authenticated

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Fetch daily mood data of the authenticated user, ordered by date
        moods = MoodLog.objects.filter(user=self.request.user).order_by('-date')
        
        # This ensures we're grouping by day, not the full timestamp
        grouped_moods = []
        # Group moods by the date part only (ignoring time)
        for date, group in groupby(moods, key=lambda x: x.date.date()):  # .date() gets only the date part
            grouped_moods.append({
                'date': date,
                'moods': list(group)
            })
        
        context['grouped_moods'] = grouped_moods
        return context



class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard.html"
    login_url = "/admin/login/"


# ---------------- LOG MOOD ----------------
class LogMoodAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Set the local timezone
        local_tz = pytz.timezone('Asia/Kathmandu')  # Nepal's time zone
        
        # Get the current local time in Nepal
        local_time = datetime.now(local_tz) 

        # Step 3: Prepare the data for the MoodLog
        data = {
            "user": request.user.id,
            "mood": request.data.get("mood"),
            "date": local_time  # Set the date to the current local time in Nepal
        }
        
        # Step 4: Serialize and save the MoodLog
        serializer = MoodLogSerializer(data=data)

        if serializer.is_valid():
            serializer.save()  # Save the MoodLog with the correct time zone and date
            return Response({"status": "OK"})
        return Response(serializer.errors, status=400)


# ---------------- WEEKLY MOOD ----------------
class WeeklyMoodAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()

        # Monday of current week
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)

        logs = MoodLog.objects.filter(
            user=request.user,
            date__range=[monday, sunday]
        ).order_by("date")

        serializer = MoodLogSerializer(logs, many=True)
        return Response(serializer.data)


# ---------------- MONTHLY MOOD ----------------
class MonthlyMoodAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        first_day = today.replace(day=1)

        logs = MoodLog.objects.filter(
            user=request.user,
            date__gte=first_day
        )
        
        serializer = MoodLogSerializer(logs, many=True)
        return Response(serializer.data)

# ------ PROFILE PIC -------
class ChangeAvatarView(LoginRequiredMixin, View):
    def post(self, request, *args, **kwargs):
        profile, _ = Profile.objects.get_or_create(user=request.user)

        if profile.can_change_avatar() and "avatar" in request.FILES:
            profile.avatar = request.FILES["avatar"]
            profile.last_changed = timezone.now()
            profile.save()

        return redirect(request.META.get("HTTP_REFERER", "/"))