from django.urls import path
from . import views
urlpatterns = [
    path("", views.HomeView.as_view(), name="home"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("signup/", views.SignUpView.as_view(), name="signup"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("change-avatar/", views.ChangeAvatarView.as_view(), name="change-avatar"),
    path("daily-moods/", views.DailyMoodListView.as_view(), name="daily-moods"),
    path("api/log-mood/", views.LogMoodAPI.as_view(), name="log-mood"),
    path("api/weekly/", views.WeeklyMoodAPI.as_view(), name="weekly-mood"),
    path("api/monthly/", views.MonthlyMoodAPI.as_view(), name="monthly-mood"),
    path("dashboard/", views.DashboardView.as_view(), name="dashboard"),
]
