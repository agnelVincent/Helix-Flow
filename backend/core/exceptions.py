from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        raw = response.data

        if isinstance(raw, dict):
            message = next(
                (
                    v[0] if isinstance(v,list) else str(v) for v in raw.values()
                ),
                'An error occured'
            )
        elif isinstance(raw, list):
            message = next(
                (
                    v[0] if isinstance(v,list) else str(v) for v in raw
                ),
                'An error occured'
            )
        else:
            message = str(raw)

        response.data = {
            'success' : False,
            'status_code': response.status_code,
            'message' : message,
            'data' : None
        }

    return response