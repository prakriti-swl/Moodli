from django.urls import path
from . import views
urlpatterns = [
    path("", views.HomeView.as_view(), name="home"),
    path("api/log-mood/", views.LogMoodAPI.as_view(), name="log-mood"),
    path("api/weekly/", views.WeeklyMoodAPI.as_view(), name="weekly-mood"),
    path("api/monthly/", views.MonthlyMoodAPI.as_view(), name="monthly-mood"),
]
