from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.responses import success_response, error_response
from apps.tasks.serializers import (
    TaskCreateSerializer,
    TaskUpdateSerializer,
    serialize_task,
)
from apps.tasks.services import (
    create_task,
    get_user_tasks,
    get_task_by_id,
    update_task,
    complete_task,
    delete_task,
    get_calendar_tasks,
)


class TaskListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        filters = {
            'status': request.query_params.get('status'),
            'priority': request.query_params.get('priority'),
        }

        filters = {k: v for k, v in filters.items() if v}

        tasks = get_user_tasks(user=request.user, filters=filters)
        data = [serialize_task(task) for task in tasks]

        return success_response(
            message="Tasks fetched successfully.",
            data=data,
        )
    
    def post(self, request):
        
        serializer = TaskCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Invalid task data.",
                data=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        task = create_task(user=request.user, data=serializer.validated_data)

        return success_response(
            message="Task created successfully.",
            data=serialize_task(task),
            status_code=status.HTTP_201_CREATED,
        )
    
class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_task_or_404(self, task_id: str, user):
        task = get_task_by_id(task_id=task_id, user=user)

        if not task:
            return None, error_response(
                message="Task not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return task, None
    
    def get(self, request, task_id):
        
        task, err = self._get_task_or_404(task_id, request.user)
        if err:
            return err
        
        return success_response(
            message="Task fetched successfully.",
            data=serialize_task(task),
        )
    
    def put(self, request, task_id):
        task, err = self._get_task_or_404(task_id, request.user)
        if err:
            return err
        
        serializer = TaskUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Invalid task data.",
                data=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        updated_task = update_task(task=task, data=serializer.validated_data)
        return success_response(
            message="Task updated successfully.",
            data=serialize_task(updated_task),
        )
    
    def delete(self, request, task_id):
        
        task, err = self._get_task_or_404(task_id, request.user)
        if err:
            return err
        
        delete_task(task)

        return success_response(
            message="Task deleted successfully.",
            status_code=status.HTTP_200_OK,
        )
    

class TaskCompleteView(APIView):

    permission_classes = [IsAuthenticated]
    def patch(self, request, task_id):
        task = get_task_by_id(task_id=task_id, user=request.user)
        if not task:
            return error_response(
                message="Task not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        
        updated_task = complete_task(task)
        return success_response(
            message="Task marked as completed.",
            data=serialize_task(updated_task),
        )



class CalendarView(APIView):
    
    permission_classes = [IsAuthenticated]
    def get(self, request):
        
        try:
            year = int(request.query_params.get('year'))
            month = int(request.query_params.get('month'))
        except (TypeError, ValueError):
            return error_response(
                message="Valid 'year' and 'month' query parameters are required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        if not (1 <= month <= 12):
            return error_response(
                message="Month must be between 1 and 12.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        grouped_tasks = get_calendar_tasks(
            user=request.user,
            year=year,
            month=month,
        )
        
        return success_response(
            message="Calendar tasks fetched successfully.",
            data=grouped_tasks,
        )
    
