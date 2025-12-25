from rest_framework import serializers
from .models import MoodLog

class MoodLogSerializer(serializers.ModelSerializer):
    tag = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tag_emoji = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = MoodLog
        fields = "__all__"
