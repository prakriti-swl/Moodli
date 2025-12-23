from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

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


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(
        upload_to="avatars/",
        default="avatars/default.jfif",
        blank=True
    )
    last_changed = models.DateTimeField(null=True, blank=True)

    def can_change_avatar(self):
        if not self.last_changed:
            return True
        return timezone.now() >= self.last_changed + timedelta(days=15)
    
