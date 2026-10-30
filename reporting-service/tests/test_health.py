from fastapi.testclient import TestClient


def test_health_ok(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "reporting-service"}
