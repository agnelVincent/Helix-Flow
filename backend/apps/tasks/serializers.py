from datetime import datetime, timezone
from rest_framework import serializers
from core.constants import (
    TASK_STATUS_CHOICES,
    TASK_STATUS_PENDING,
    TASK_STATUS_IN_PROGRESS,
    TASK_STATUS_COMPLETED,
    TASK_PRIORITY_CHOICES,
    TASK_PRIORITY_MEDIUM,
)

class TaskCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)

    description = serializers.CharField(
        max_length=2000,
        required=False,
        allow_blank=True,
        default='',
    )

    status = serializers.ChoiceField(
        choices=TASK_STATUS_CHOICES,
        default=TASK_STATUS_PENDING,
    )

    priority = serializers.ChoiceField(
        choices=TASK_PRIORITY_CHOICES,
        default=TASK_PRIORITY_MEDIUM,
    )

    due_date = serializers.DateTimeField(
        required=False,
        allow_null=True,
        default=None,
    )

    def validate_due_date(self, value):

        if value and value < datetime.now(timezone.utc):
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value
    
class TaskUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200, required=False)
    
    description = serializers.CharField(
        max_length=2000,
        required=False,
        allow_blank=True,
    )

    status = serializers.ChoiceField(
        choices=TASK_STATUS_CHOICES,
        required=False,
    )

    priority = serializers.ChoiceField(
        choices=TASK_PRIORITY_CHOICES,
        required=False,
    )

    due_date = serializers.DateTimeField(
        required=False,
        allow_null=True,
    )

    def validate_due_date(self, value):
        if value and value < datetime.now(timezone.utc):
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value
    
def serialize_task(task) -> dict:
    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "is_completed": task.is_completed,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    }
