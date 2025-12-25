from django.contrib import admin
from .models import MoodLog, Profile

# Register your models here.
admin.site.register(MoodLog)
admin.site.register(Profile)