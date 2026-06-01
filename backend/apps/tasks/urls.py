from django.urls import path
from apps.tasks.views import (
    TaskListCreateView,
    TaskDetailView,
    TaskCompleteView,
    CalendarView,
)

urlpatterns = [
    
    path('', TaskListCreateView.as_view(), name='task-list-create'),
    
    path('calendar/', CalendarView.as_view(), name='task-calendar'),
    
    path('<str:task_id>/', TaskDetailView.as_view(), name='task-detail'),
    path('<str:task_id>/complete/', TaskCompleteView.as_view(), name='task-complete'),
]