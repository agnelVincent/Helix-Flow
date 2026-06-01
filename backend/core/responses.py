from rest_framework.response import Response
from rest_framework import status

def success_response(message : str, data : None, status_code = status.HTTP_200_OK) -> Response:
    return Response(
        {
            'success' : True,
            'message' : message,
            'data' : data
        },
        status = status_code
    )


def error_response(message : str, data : None, status_code = status.HTTP_400_BAD_REQUEST) -> Response:
    return Response(
        {
            'success' : False,
            'message' : message,
            'data' : data
        },
        status = status_code
    )