from datetime import datetime, timezone
from apps.tasks.models import Task

def create_task(user, data: dict) -> Task:
    task = Task(
        user=user,
        title=data['title'],
        description=data.get('description', ''),
        status=data.get('status', 'pending'),
        priority=data.get('priority', 'medium'),
        due_date=data.get('due_date', None),
    )
    task.save()
    return task

def get_user_tasks(user, filters: dict = None):
    queryset = Task.objects.filter(user=user)

    if filters:
        status = filters.get('status')
        priority = filters.get('priority')

        if status:
            queryset = queryset.filter(status=status)

        if priority:
            queryset = queryset.filter(priority=priority)

    return queryset

def get_task_by_id(task_id: str, user) -> Task | None:
    try:
        return Task.objects.get(id=task_id, user=user)
    except (Task.DoesNotExist, Exception):
        return None
    

def update_task(task: Task, data: dict) -> Task:
    updatable_fields = ['title', 'description', 'status', 'priority', 'due_date']

    for field in updatable_fields:
        if field in data:
            setattr(task, field, data[field])

    task.updated_at = datetime.now(timezone.utc)
    task.save()
    return task

def complete_task(task: Task) -> Task:
    if task.is_completed:
        return task  
    
    task.mark_completed()  
    task.save()
    return task

def delete_task(task: Task) -> None:
    task.delete()

def get_calendar_tasks(user, year: int, month: int) -> dict:

    from apps.tasks.serializers import serialize_task
    from calendar import monthrange
    
    _, last_day = monthrange(year, month)

    start = datetime(year, month, 1, tzinfo=timezone.utc)
    end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)
    
    tasks = Task.objects.filter(
        user=user,
        due_date__gte=start,
        due_date__lte=end,
    )
    
    grouped: dict = {}
    for task in tasks:
        date_key = task.due_date.strftime('%Y-%m-%d')
        if date_key not in grouped:
            grouped[date_key] = []
        grouped[date_key].append(serialize_task(task))
        
    return grouped