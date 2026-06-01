from mongoengine import (
    Document,
    StringField,
    BooleanField,
    DateTimeField,
    ReferenceField,
)
from datetime import datetime, timezone
from core.constants import (
    TASK_STATUS_PENDING,
    TASK_STATUS_CHOICES,
    TASK_PRIORITY_MEDIUM,
    TASK_PRIORITY_CHOICES,
    TASK_STATUS_COMPLETED
)

def utcnow():
    return datetime.now(timezone.utc)


class Task(Document):

    user = ReferenceField('auth_app.User', required=True)
    
    title = StringField(required=True, max_length=200)
    description = StringField(max_length=2000, default='')
    
    status = StringField(
        choices=TASK_STATUS_CHOICES,
        default=TASK_STATUS_PENDING,
    )
    priority = StringField(
        choices=TASK_PRIORITY_CHOICES,
        default=TASK_PRIORITY_MEDIUM,
    )
    
    due_date = DateTimeField(required=False, default=None)
    
    is_completed = BooleanField(default=False)
    completed_at = DateTimeField(required=False, default=None)
    
    created_at = DateTimeField(default=utcnow)
    updated_at = DateTimeField(default=utcnow)

    meta = {
        'collection': 'tasks',
        'indexes': [
            'user',
            'status',
            'due_date',
            ('user', '-created_at'),
        ],
        'ordering': ['-created_at'],
    }

    def mark_completed(self):
        self.is_completed = True
        self.status = TASK_STATUS_COMPLETED
        self.completed_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)
        
    def __str__(self):
        return f"{self.title} [{self.status}]"
