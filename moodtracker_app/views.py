from django.views.generic import TemplateView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import date, timedelta

from .models import MoodLog
from .serializers import MoodLogSerializer


# ---------------- HOME PAGE ----------------
class HomeView(TemplateView):
    template_name = "index.html"


# ---------------- LOG MOOD ----------------
class LogMoodAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = {
            "user": request.user.id,
            "mood": request.data.get("mood")
        }
        serializer = MoodLogSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response({"status": "OK"})
        return Response(serializer.errors, status=400)


# ---------------- WEEKLY MOOD ----------------
class WeeklyMoodAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        week_ago = today - timedelta(days=7)

        logs = MoodLog.objects.filter(
            user=request.user,
            date__gte=week_ago
        )

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
