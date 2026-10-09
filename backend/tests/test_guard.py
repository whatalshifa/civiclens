from app.config import Settings, get_settings


def test_with_a_proxy_secret_only_the_website_gets_in(client):
    client.app.dependency_overrides[get_settings] = lambda: Settings(proxy_secret="s3cret")
    assert client.get("/api/laws").status_code == 403
    assert client.get("/api/laws", headers={"x-civiclens-proxy": "wrong"}).status_code == 403
    assert client.get("/api/laws", headers={"x-civiclens-proxy": "s3cret"}).status_code == 200


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}
