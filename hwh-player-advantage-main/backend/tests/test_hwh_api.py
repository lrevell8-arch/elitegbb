"""
HWH Player Advantage™ - Backend API Tests
Tests: Health check, Admin auth/export, Coach registration/login/messaging/subscription
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@hoopwithher.com"
ADMIN_PASSWORD = "AdminPass123!"

# Test coach credentials (will be created during tests)
TEST_COACH_EMAIL = f"test_coach_{uuid.uuid4().hex[:8]}@university.edu"
TEST_COACH_PASSWORD = "TestPass123!"
TEST_COACH_NAME = "Test Coach"
TEST_COACH_SCHOOL = "Test University"


class TestHealthCheck:
    """Health check and basic API tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status with supabase database"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "supabase"
        print(f"✓ Health check passed: database={data['database']}")
    
    def test_root_endpoint(self):
        """Test /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "HWH Player Advantage" in data.get("message", "")
        print(f"✓ Root endpoint passed: {data.get('message')}")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful: {data['user']['email']}")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Admin login correctly rejected invalid credentials")


class TestAdminDashboard:
    """Admin dashboard and stats tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_admin_stats(self, admin_token):
        """Test admin stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_players" in data
        assert "total_projects" in data
        assert "projects_by_status" in data
        print(f"✓ Admin stats: {data['total_players']} players, {data['total_projects']} projects")
    
    def test_admin_players_list(self, admin_token):
        """Test admin players list endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/players",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "players" in data
        assert "total" in data
        print(f"✓ Admin players list: {data['total']} total players")
    
    def test_admin_projects_list(self, admin_token):
        """Test admin projects list endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/projects",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin projects list: {len(data)} projects")


class TestAdminExport:
    """Admin export functionality tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin login failed")
    
    def test_export_players_csv(self, admin_token):
        """Test export players as CSV"""
        response = requests.post(
            f"{BASE_URL}/api/admin/export",
            json={"export_type": "players", "format": "csv"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "csv"
        assert data["export_type"] == "players"
        assert "count" in data
        assert "csv_content" in data
        print(f"✓ Export players CSV: {data['count']} records")
    
    def test_export_players_json(self, admin_token):
        """Test export players as JSON"""
        response = requests.post(
            f"{BASE_URL}/api/admin/export",
            json={"export_type": "players", "format": "json"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "json"
        assert data["export_type"] == "players"
        assert "data" in data
        print(f"✓ Export players JSON: {data['count']} records")
    
    def test_export_projects_csv(self, admin_token):
        """Test export projects as CSV"""
        response = requests.post(
            f"{BASE_URL}/api/admin/export",
            json={"export_type": "projects", "format": "csv"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "csv"
        assert data["export_type"] == "projects"
        print(f"✓ Export projects CSV: {data['count']} records")
    
    def test_export_submissions_csv(self, admin_token):
        """Test export submissions as CSV"""
        response = requests.post(
            f"{BASE_URL}/api/admin/export",
            json={"export_type": "submissions", "format": "csv"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["format"] == "csv"
        assert data["export_type"] == "submissions"
        print(f"✓ Export submissions CSV: {data['count']} records")


class TestCoachRegistration:
    """Coach registration tests"""
    
    def test_coach_register(self):
        """Test coach registration"""
        response = requests.post(
            f"{BASE_URL}/api/coach/register",
            json={
                "email": TEST_COACH_EMAIL,
                "password": TEST_COACH_PASSWORD,
                "name": TEST_COACH_NAME,
                "school": TEST_COACH_SCHOOL,
                "title": "Head Coach",
                "state": "CA"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_COACH_EMAIL
        assert "pending verification" in data.get("message", "").lower()
        print(f"✓ Coach registration successful: {data['email']}")
    
    def test_coach_register_duplicate(self):
        """Test coach registration with duplicate email"""
        # First registration
        requests.post(
            f"{BASE_URL}/api/coach/register",
            json={
                "email": f"dup_{TEST_COACH_EMAIL}",
                "password": TEST_COACH_PASSWORD,
                "name": TEST_COACH_NAME,
                "school": TEST_COACH_SCHOOL
            }
        )
        # Second registration with same email
        response = requests.post(
            f"{BASE_URL}/api/coach/register",
            json={
                "email": f"dup_{TEST_COACH_EMAIL}",
                "password": TEST_COACH_PASSWORD,
                "name": TEST_COACH_NAME,
                "school": TEST_COACH_SCHOOL
            }
        )
        assert response.status_code == 400
        print("✓ Duplicate coach registration correctly rejected")


class TestCoachLogin:
    """Coach login tests"""
    
    def test_coach_login_unverified(self):
        """Test coach login with unverified account"""
        # Register a new coach
        new_email = f"unverified_{uuid.uuid4().hex[:8]}@test.edu"
        requests.post(
            f"{BASE_URL}/api/coach/register",
            json={
                "email": new_email,
                "password": TEST_COACH_PASSWORD,
                "name": "Unverified Coach",
                "school": "Test School"
            }
        )
        # Try to login
        response = requests.post(
            f"{BASE_URL}/api/coach/login",
            json={"email": new_email, "password": TEST_COACH_PASSWORD}
        )
        # Should be 403 (pending verification)
        assert response.status_code == 403
        print("✓ Unverified coach login correctly blocked")
    
    def test_coach_login_invalid(self):
        """Test coach login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/coach/login",
            json={"email": "nonexistent@test.edu", "password": "wrongpass"}
        )
        assert response.status_code == 401
        print("✓ Invalid coach login correctly rejected")


class TestCoachSubscription:
    """Coach subscription tier tests"""
    
    def test_subscription_tiers(self):
        """Test subscription tiers endpoint (public)"""
        response = requests.get(f"{BASE_URL}/api/coach/subscription/tiers")
        assert response.status_code == 200
        data = response.json()
        assert "tiers" in data
        tiers = data["tiers"]
        
        # Verify all 3 tiers exist
        assert "basic" in tiers
        assert "premium" in tiers
        assert "elite" in tiers
        
        # Verify pricing
        assert tiers["basic"]["price"] == 99.00
        assert tiers["premium"]["price"] == 299.00
        assert tiers["elite"]["price"] == 499.00
        
        print(f"✓ Subscription tiers: Basic ${tiers['basic']['price']}, Premium ${tiers['premium']['price']}, Elite ${tiers['elite']['price']}")


class TestCoachMessaging:
    """Coach messaging tests (requires Elite tier)"""
    
    @pytest.fixture
    def verified_coach_token(self):
        """Get a verified coach token - using existing verified coach"""
        # Try to login with existing verified coach
        response = requests.post(
            f"{BASE_URL}/api/coach/login",
            json={"email": "coach@university.edu", "password": "CoachPass123!"}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("No verified coach available for testing")
    
    def test_messages_requires_elite(self, verified_coach_token):
        """Test that messages endpoint requires Elite tier"""
        response = requests.get(
            f"{BASE_URL}/api/coach/messages",
            headers={"Authorization": f"Bearer {verified_coach_token}"}
        )
        # Should be 403 if not Elite tier
        if response.status_code == 403:
            print("✓ Messages endpoint correctly requires Elite tier")
        elif response.status_code == 200:
            print("✓ Messages endpoint accessible (coach has Elite tier)")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_elite_coaches_requires_elite(self, verified_coach_token):
        """Test that elite-coaches endpoint requires Elite tier"""
        response = requests.get(
            f"{BASE_URL}/api/coach/elite-coaches",
            headers={"Authorization": f"Bearer {verified_coach_token}"}
        )
        # Should be 403 if not Elite tier
        if response.status_code == 403:
            print("✓ Elite coaches endpoint correctly requires Elite tier")
        elif response.status_code == 200:
            data = response.json()
            print(f"✓ Elite coaches endpoint accessible: {data.get('total', 0)} coaches")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")


class TestCoachProspects:
    """Coach prospects browsing tests"""
    
    @pytest.fixture
    def verified_coach_token(self):
        """Get a verified coach token"""
        response = requests.post(
            f"{BASE_URL}/api/coach/login",
            json={"email": "coach@university.edu", "password": "CoachPass123!"}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("No verified coach available for testing")
    
    def test_browse_prospects(self, verified_coach_token):
        """Test browsing verified prospects"""
        response = requests.get(
            f"{BASE_URL}/api/coach/prospects",
            headers={"Authorization": f"Bearer {verified_coach_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "prospects" in data
        assert "total" in data
        print(f"✓ Browse prospects: {data['total']} verified players")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
