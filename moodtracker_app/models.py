from django.db import models
from django.contrib.auth.models import User

class MoodLog(models.Model):
    MOOD_CHOICES = [
        ("Very Happy", "Very Happy"),
        ("Happy", "Happy"),
        ("Neutral", "Neutral"),
        ("Sad", "Sad"),
        ("Very Sad", "Very Sad"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    date = models.DateTimeField(auto_now_add=True)  # Changed from DateField to DateTimeField

    def __str__(self):
        return f"{self.user.username} - {self.mood} on {self.date}"
