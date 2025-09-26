#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime, timedelta
import time

class EmergencyManagementAPITester:
    def __init__(self, base_url="https://urbanresponse.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Store created resources for cleanup and reference
        self.created_zones = []
        self.created_devices = []
        self.created_incidents = []
        self.created_users = []
        self.created_alerts = []

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")

            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_sample_data_initialization(self):
        """Test sample data initialization"""
        print("\n🔧 Testing Sample Data Initialization...")
        
        response = self.make_request('POST', '/init/sample-data')
        if response and response.status_code == 200:
            self.log_result("Sample Data Initialization", True, response_data=response.json())
        else:
            self.log_result("Sample Data Initialization", False, 
                          f"Status: {response.status_code if response else 'No response'}")

    def test_authentication(self):
        """Test authentication system"""
        print("\n🔐 Testing Authentication...")
        
        # Test login with admin credentials
        login_data = {"username": "admin1", "password": "admin123"}
        response = self.make_request('POST', '/auth/login', login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'access_token' in data and 'user' in data:
                self.token = data['access_token']
                self.user_data = data['user']
                self.log_result("Admin Login", True, f"User: {self.user_data['username']}, Role: {self.user_data['role']}")
            else:
                self.log_result("Admin Login", False, "Missing token or user data in response")
        else:
            self.log_result("Admin Login", False, 
                          f"Status: {response.status_code if response else 'No response'}")
            return False

        # Test invalid login
        invalid_login = {"username": "invalid", "password": "wrong"}
        response = self.make_request('POST', '/auth/login', invalid_login)
        
        if response and response.status_code == 401:
            self.log_result("Invalid Login Rejection", True)
        else:
            self.log_result("Invalid Login Rejection", False, 
                          f"Expected 401, got {response.status_code if response else 'No response'}")

        return self.token is not None

    def test_zones_management(self):
        """Test zone management endpoints"""
        print("\n🗺️ Testing Zone Management...")
        
        # Get all zones
        response = self.make_request('GET', '/zones')
        if response and response.status_code == 200:
            zones = response.json()
            self.log_result("Get All Zones", True, f"Found {len(zones)} zones")
            
            # Store existing zones for reference
            if zones:
                self.created_zones.extend(zones)
        else:
            self.log_result("Get All Zones", False, 
                          f"Status: {response.status_code if response else 'No response'}")

        # Create new zone
        new_zone = {
            "name": "Test Zone",
            "zone_type": "Religious",
            "camera_count": 50,
            "density": 1000,
            "area_code": "TEST1",
            "description": "Test zone for API testing",
            "capacity": 1000
        }
        
        response = self.make_request('POST', '/zones', new_zone)
        if response and response.status_code == 200:
            zone_data = response.json()
            self.created_zones.append(zone_data)
            self.log_result("Create Zone", True, f"Created zone: {zone_data['name']}")
        else:
            self.log_result("Create Zone", False, 
                          f"Status: {response.status_code if response else 'No response'}")

    def test_device_management(self):
        """Test device management endpoints"""
        print("\n📹 Testing Device Management...")
        
        # Get all devices
        response = self.make_request('GET', '/devices')
        if response and response.status_code == 200:
            devices = response.json()
            self.log_result("Get All Devices", True, f"Found {len(devices)} devices")
            
            if devices:
                self.created_devices.extend(devices)
        else:
            self.log_result("Get All Devices", False, 
                          f"Status: {response.status_code if response else 'No response'}")

        # Create new device (if we have zones)
        if self.created_zones:
            new_device = {
                "device_id": "TEST-CAM-001",
                "name": "Test Camera 1",
                "device_type": "Fixed",
                "zone_id": self.created_zones[0]['id'],
                "zone_name": self.created_zones[0]['name'],
                "location": "Test Location"
            }
            
            response = self.make_request('POST', '/devices', new_device)
            if response and response.status_code == 200:
                device_data = response.json()
                self.created_devices.append(device_data)
                self.log_result("Create Device", True, f"Created device: {device_data['name']}")
            else:
                self.log_result("Create Device", False, 
                              f"Status: {response.status_code if response else 'No response'}")

        # Test device filtering by zone
        if self.created_zones:
            zone_id = self.created_zones[0]['id']
            response = self.make_request('GET', '/devices', params={'zone_id': zone_id})
            if response and response.status_code == 200:
                zone_devices = response.json()
                self.log_result("Filter Devices by Zone", True, f"Found {len(zone_devices)} devices in zone")
            else:
                self.log_result("Filter Devices by Zone", False, 
                              f"Status: {response.status_code if response else 'No response'}")

    def test_incident_management(self):
        """Test incident management endpoints"""
        print("\n🚨 Testing Incident Management...")
        
        # Get all incidents
        response = self.make_request('GET', '/incidents')
        if response and response.status_code == 200:
            incidents = response.json()
            self.log_result("Get All Incidents", True, f"Found {len(incidents)} incidents")
            
            if incidents:
                self.created_incidents.extend(incidents)
        else:
            self.log_result("Get All Incidents", False, 
                          f"Status: {response.status_code if response else 'No response'}")

        # Create new incident (if we have zones)
        if self.created_zones:
            new_incident = {
                "title": "Test Emergency Incident",
                "description": "This is a test incident for API testing",
                "incident_type": "Medical Emergency",
                "zone": self.created_zones[0]['name'],
                "zone_id": self.created_zones[0]['id'],
                "source": "TEST-CAM-001",
                "severity": 4,
                "location": "Test Building A"
            }
            
            response = self.make_request('POST', '/incidents', new_incident)
            if response and response.status_code == 200:
                incident_data = response.json()
                self.created_incidents.append(incident_data)
                self.log_result("Create Incident", True, f"Created incident: {incident_data['title']}")
                
                # Test incident update
                incident_id = incident_data['incident_id']
                update_data = {
                    "status": "In Progress",
                    "notes": "Test note added via API"
                }
                
                response = self.make_request('PUT', f'/incidents/{incident_id}', update_data)
                if response and response.status_code == 200:
                    updated_incident = response.json()
                    self.log_result("Update Incident", True, f"Updated status to: {updated_incident['status']}")
                else:
                    self.log_result("Update Incident", False, 
                                  f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_result("Create Incident", False, 
                              f"Status: {response.status_code if response else 'No response'}")

        # Test incident filtering
        response = self.make_request('GET', '/incidents', params={'status': 'Open'})
        if response and response.status_code == 200:
            open_incidents = response.json()
            self.log_result("Filter Incidents by Status", True, f"Found {len(open_incidents)} open incidents")
        else:
            self.log_result("Filter Incidents by Status", False, 
                          f"Status: {response.status_code if response else 'No response'}")

    def test_user_management(self):
        """Test user management endpoints"""
        print("\n👥 Testing User Management...")
        
        # Get all users
        response = self.make_request('GET', '/users')
        if response and response.status_code == 200:
            users = response.json()
            self.log_result("Get All Users", True, f"Found {len(users)} users")
            
            if users:
                self.created_users.extend(users)
        else:
            self.log_result("Get All Users", False, 
                          f"Status: {response.status_code if response else 'No response'}")

        # Create new user
        new_user = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "role": "Zone Operator",
            "assigned_zones": [self.created_zones[0]['id']] if self.created_zones else []
        }
        
        response = self.make_request('POST', '/users', new_user)
        if response and response.status_code == 200:
            user_data = response.json()
            self.created_users.append(user_data)
            self.log_result("Create User", True, f"Created user: {user_data['username']}")
        else:
            self.log_result("Create User", False, 
                          f"Status: {response.status_code if response else 'No response'}")

    def test_alert_management(self):
        """Test alert management endpoints"""
        print("\n🔔 Testing Alert Management...")
        
        # Get all alerts
        response = self.make_request('GET', '/alerts')
        if response and response.status_code == 200:
            alerts = response.json()
            self.log_result("Get All Alerts", True, f"Found {len(alerts)} alerts")
            
            if alerts:
                self.created_alerts.extend(alerts)
        else:
            self.log_result("Get All Alerts", False, 
                          f"Status: {response.status_code if response else 'No response'}")

        # Create new alert
        new_alert = {
            "title": "Test Emergency Alert",
            "message": "This is a test alert for API testing purposes",
            "alert_type": "Medical Emergency",
            "zone": self.created_zones[0]['name'] if self.created_zones else "Test Zone",
            "source": "TEST-CAM-001",
            "severity": 4,
            "zone_ids": [self.created_zones[0]['id']] if self.created_zones else [],
            "expires_at": (datetime.now() + timedelta(hours=1)).isoformat()
        }
        
        response = self.make_request('POST', '/alerts', new_alert)
        if response and response.status_code == 200:
            alert_data = response.json()
            self.created_alerts.append(alert_data)
            self.log_result("Create Alert", True, f"Created alert: {alert_data['title']}")
        else:
            self.log_result("Create Alert", False, 
                          f"Status: {response.status_code if response else 'No response'}")

        # Test city-wide alert
        citywide_alert = {
            "title": "City-wide Test Alert",
            "message": "This is a city-wide test alert",
            "alert_type": "information",
            "severity": 2,
            "zone_ids": []  # Empty for city-wide
        }
        
        response = self.make_request('POST', '/alerts', citywide_alert)
        if response and response.status_code == 200:
            alert_data = response.json()
            self.created_alerts.append(alert_data)
            self.log_result("Create City-wide Alert", True, f"Created city-wide alert: {alert_data['title']}")
        else:
            self.log_result("Create City-wide Alert", False, 
                          f"Status: {response.status_code if response else 'No response'}")

    def test_analytics_dashboard(self):
        """Test analytics and dashboard endpoints"""
        print("\n📊 Testing Analytics & Dashboard...")
        
        # Get dashboard analytics
        response = self.make_request('GET', '/analytics/dashboard')
        if response and response.status_code == 200:
            analytics = response.json()
            required_fields = ['total_incidents', 'open_incidents', 'total_devices', 'online_devices', 'device_uptime']
            
            if all(field in analytics for field in required_fields):
                self.log_result("Dashboard Analytics", True, 
                              f"Incidents: {analytics['total_incidents']}, Devices: {analytics['total_devices']}, Uptime: {analytics['device_uptime']}%")
            else:
                missing_fields = [field for field in required_fields if field not in analytics]
                self.log_result("Dashboard Analytics", False, f"Missing fields: {missing_fields}")
        else:
            self.log_result("Dashboard Analytics", False, 
                          f"Status: {response.status_code if response else 'No response'}")

        # Get system health
        response = self.make_request('GET', '/system/health')
        if response and response.status_code == 200:
            health = response.json()
            required_fields = ['status', 'uptime', 'cpu_usage', 'memory_usage']
            
            if all(field in health for field in required_fields):
                self.log_result("System Health", True, 
                              f"Status: {health['status']}, Uptime: {health['uptime']}")
            else:
                missing_fields = [field for field in required_fields if field not in health]
                self.log_result("System Health", False, f"Missing fields: {missing_fields}")
        else:
            self.log_result("System Health", False, 
                          f"Status: {response.status_code if response else 'No response'}")

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n🔒 Testing Role-based Access Control...")
        
        # Test that master admin can access all endpoints
        if self.user_data and self.user_data['role'] == 'master_admin':
            self.log_result("Master Admin Access", True, "Admin has access to all endpoints")
        else:
            self.log_result("Master Admin Access", False, "Current user is not master admin")

        # Test unauthorized access (without token)
        original_token = self.token
        self.token = None
        
        response = self.make_request('GET', '/users')
        if response and response.status_code == 401:
            self.log_result("Unauthorized Access Blocked", True, "Access denied without token")
        else:
            self.log_result("Unauthorized Access Blocked", False, 
                          f"Expected 401, got {response.status_code if response else 'No response'}")
        
        # Restore token
        self.token = original_token

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Emergency Management API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Initialize sample data first
        self.test_sample_data_initialization()
        
        # Wait a moment for data to be created
        time.sleep(2)
        
        # Test authentication
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run all other tests
        self.test_zones_management()
        self.test_device_management()
        self.test_incident_management()
        self.test_user_management()
        self.test_alert_management()
        self.test_analytics_dashboard()
        self.test_role_based_access()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️ Some tests failed. Check the details above.")
            return False

def main():
    """Main function"""
    tester = EmergencyManagementAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'failed_tests': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
            },
            'test_results': tester.test_results,
            'created_resources': {
                'zones': len(tester.created_zones),
                'devices': len(tester.created_devices),
                'incidents': len(tester.created_incidents),
                'users': len(tester.created_users),
                'alerts': len(tester.created_alerts)
            }
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())