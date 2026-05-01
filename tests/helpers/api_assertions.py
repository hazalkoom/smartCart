import base64
import hashlib
import hmac
import json
import os
import time
import uuid
from pathlib import Path


def unique_suffix() -> str:
    return uuid.uuid4().hex[:8]


def _b64url_encode(payload: bytes) -> str:
    return base64.urlsafe_b64encode(payload).rstrip(b'=').decode('ascii')


def _load_jwt_secret() -> str:
    secret = os.getenv('JWT_SECRET')
    if secret:
        return secret

    env_path = Path(__file__).resolve().parents[2] / 'backend' / '.env'
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            if key.strip() == 'JWT_SECRET':
                return value.strip().strip('"').strip("'")

    raise AssertionError('JWT_SECRET is not set for tests')


def create_email_verification_token(user_id: str, expires_in_seconds: int = 3600) -> str:
    secret = _load_jwt_secret()
    now = int(time.time())
    header = {'alg': 'HS256', 'typ': 'JWT'}
    payload = {
        'id': user_id,
        'purpose': 'email_verification',
        'exp': now + expires_in_seconds,
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    signing_input = f"{header_b64}.{payload_b64}".encode('ascii')
    signature = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def json_body(response):
    try:
        return response.json()
    except Exception as exc:
        raise AssertionError(f"Response is not JSON. status={response.status_code} body={response.text}") from exc


def assert_status(response, expected: int, context: str = ""):
    if response.status_code != expected:
        prefix = f"{context}: " if context else ""
        raise AssertionError(
            f"{prefix}Expected status {expected}, got {response.status_code}. Body: {response.text}"
        )


def assert_success(response, expected_status: int = 200, context: str = ""):
    assert_status(response, expected_status, context)
    body = json_body(response)
    if body.get("success") is not True:
        raise AssertionError(f"{context}: Expected success=true. Body: {body}")
    return body


def get_data(response, context: str = ""):
    body = json_body(response)
    if "data" not in body:
        raise AssertionError(f"{context}: Missing 'data' in response body: {body}")
    return body["data"]


def get_error(response, context: str = ""):
    body = json_body(response)
    error = body.get("error")
    if not isinstance(error, dict):
        raise AssertionError(f"{context}: Missing 'error' object in response body: {body}")
    return error


def assert_error(response, expected_status: int, expected_code: str = None, message_contains: str = None, context: str = ""):
    assert_status(response, expected_status, context)
    error = get_error(response, context)

    if expected_code and error.get("code") != expected_code:
        raise AssertionError(
            f"{context}: Expected error.code={expected_code}, got {error.get('code')}. Body: {json_body(response)}"
        )

    if message_contains:
        message = str(error.get("message", ""))
        if message_contains.lower() not in message.lower():
            raise AssertionError(
                f"{context}: Expected error.message to contain '{message_contains}', got '{message}'."
            )

    return error
