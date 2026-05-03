
from config import settings

import urllib.parse


def generate_google_redirect_uri():
    query_params = {
        "client_id": settings.OAUTH_GOOGLE_CLIENT_ID,
        "redirect_uri": "http://localhost:5173/auth/google",
        "response_type": "code",
        "scope": " ".join([ 
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/calendar.readonly",
            "openid",
            "email",
            "profile"
        ]),
        "access_type": "offline"
    }
    query_string = urllib.parse.urlencode(query_params , quote_via=urllib.parse.quote)
    api_url = "https://accounts.google.com/o/oauth2/v2/auth"
    return f"{api_url}?{query_string}"