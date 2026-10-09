"""Only the website may call the API (when a proxy secret is set).

The website forwards every /api request to this API and adds a secret header. Requests
without it came straight to the API's own address, skipping the website, and are refused.
"""

import hmac
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.config import Settings, get_settings

HEADER = "x-civiclens-proxy"


def require_proxy(request: Request, settings: Annotated[Settings, Depends(get_settings)]) -> None:
    if not settings.proxy_secret:
        return
    sent = request.headers.get(HEADER, "")
    if not hmac.compare_digest(sent.encode(), settings.proxy_secret.encode()):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Please use CivicLens through its website.")
