#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class ComprehensiveBackendTester:
    def __init__(self, base_url="https://emergency-dash-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_failures = []
        self.test_results = []

    def log_result(self, test_name, success, details="", is_critical=False):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
            if is_critical:
                self.critical_failures.append(f"{test_name}: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "critical": is_critical
        })

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            return response
        except Exception as e:
            return None

    def test_authentication_endpoints(self):
        """Test authentication endpoints comprehensively"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test login
        login_data = {"username": "admin1", "password": "admin123"}
        response = self.make_request('POST', '/auth/login', login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'access_token' in data and 'user' in data:
                self.token = data['access_token']
                self.log_result("Admin Login with JWT Token", True)
            else:
                self.log_result("Admin Login with JWT Token", False, "Missing token or user data", True)
        else:
            self.log_result("Admin Login with JWT Token", False, f"Status: {response.status_code if response else 'No response'}", True)
            return False

        # Test invalid credentials
        invalid_login = {"username": "invalid", "password": "wrong"}
        response = self.make_request('POST', '/auth/login', invalid_login)
        if response and response.status_code == 401:
            self.log_result("Invalid Login Rejection (401)", True)
        else:
            self.log_result("Invalid Login Rejection (401)", False, f"Expected 401, got {response.status_code if response else 'No response'}")

        return True

    def test_sample_data_initialization(self):
        """Test sample data initialization endpoint"""
        print("\n🔧 Testing Sample Data Initialization...")
        
        response = self.make_request('POST', '/init/sample-data')
        if response and response.status_code == 200:
            result = response.json()
            if 'message' in result and 'successfully' in result['message']:
                self.log_result("Sample Data Initialization", True)
            else:
                self.log_result("Sample Data Initialization", False, "Unexpected response format", True)
        else:
            self.log_result("Sample Data Initialization", False, f"Status: {response.status_code if response else 'No response'}", True)

    def test_analytics_endpoint(self):
        """Test analytics endpoint with current data"""
        print("\n📊 Testing Analytics Endpoint...")
        
        response = self.make_request('GET', '/analytics/dashboard')
        if response and response.status_code == 200:
            analytics = response.json()
            required_fields = ['total_incidents', 'open_incidents', 'total_devices', 'online_devices', 'device_uptime']
            
            missing_fields = [field for field in required_fields if field not in analytics]
            if not missing_fields:
                self.log_result("Dashboard Analytics Data Structure", True)
                
                # Verify data makes sense
                if analytics['total_devices'] > 0 and analytics['device_uptime'] >= 0:
                    self.log_result("Analytics Data Validity", True)
                else:
                    self.log_result("Analytics Data Validity", False, "Invalid data values")
            else:
                self.log_result("Dashboard Analytics Data Structure", False, f"Missing fields: {missing_fields}", True)
        else:
            self.log_result("Dashboard Analytics Data Structure", False, f"Status: {response.status_code if response else 'No response'}", True)

        # Test additional analytics endpoints
        endpoints = [
            ('/analytics/zone-density', 'Zone Density Analytics'),
            ('/analytics/incident-types', 'Incident Types Analytics'),
            ('/analytics/device-health', 'Device Health Analytics')
        ]
        
        for endpoint, name in endpoints:
            response = self.make_request('GET', endpoint)
            if response and response.status_code == 200:
                self.log_result(name, True)
            else:
                self.log_result(name, False, f"Status: {response.status_code if response else 'No response'}")

    def test_system_health_endpoint(self):
        """Test system health endpoint"""
        print("\n🏥 Testing System Health Endpoint...")
        
        response = self.make_request('GET', '/system/health')
        if response and response.status_code == 200:
            health = response.json()
            required_fields = ['status', 'uptime', 'cpu_usage', 'memory_usage', 'database_status']
            
            missing_fields = [field for field in required_fields if field not in health]
            if not missing_fields:
                self.log_result("System Health Data Structure", True)
                
                # Check if device faults are tracked
                if 'device_faults' in health:
                    self.log_result("Device Fault Tracking", True)
                else:
                    self.log_result("Device Fault Tracking", False, "No device fault information")
            else:
                self.log_result("System Health Data Structure", False, f"Missing fields: {missing_fields}", True)
        else:
            self.log_result("System Health Data Structure", False, f"Status: {response.status_code if response else 'No response'}", True)

    def test_crud_operations(self):
        """Test all CRUD operations"""
        print("\n🔄 Testing CRUD Operations...")
        
        # Test Users CRUD
        response = self.make_request('GET', '/users')
        if response and response.status_code == 200:
            users = response.json()
            self.log_result("Users - Read Operation", True)
            
            # Test user creation
            new_user = {
                "username": "testuser_crud",
                "email": "testcrud@example.com",
                "password": "testpass123",
                "role": "Zone Operator",
                "assigned_zones": []
            }
            response = self.make_request('POST', '/users', new_user)
            if response and response.status_code == 200:
                self.log_result("Users - Create Operation", True)
            else:
                self.log_result("Users - Create Operation", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_result("Users - Read Operation", False, f"Status: {response.status_code if response else 'No response'}", True)

        # Test Zones CRUD
        response = self.make_request('GET', '/zones')
        if response and response.status_code == 200:
            zones = response.json()
            self.log_result("Zones - Read Operation", True)
            
            # Test zone creation
            new_zone = {
                "name": "CRUD Test Zone",
                "zone_type": "Commercial",
                "camera_count": 25,
                "density": 500,
                "area_code": "CRUD1",
                "description": "Zone for CRUD testing",
                "capacity": 2000
            }
            response = self.make_request('POST', '/zones', new_zone)
            if response and response.status_code == 200:
                self.log_result("Zones - Create Operation", True)
            else:
                self.log_result("Zones - Create Operation", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_result("Zones - Read Operation", False, f"Status: {response.status_code if response else 'No response'}", True)

        # Test Devices CRUD
        response = self.make_request('GET', '/devices')
        if response and response.status_code == 200:
            devices = response.json()
            self.log_result("Devices - Read Operation", True)
        else:
            self.log_result("Devices - Read Operation", False, f"Status: {response.status_code if response else 'No response'}", True)

        # Test Incidents CRUD
        response = self.make_request('GET', '/incidents')
        if response and response.status_code == 200:
            incidents = response.json()
            self.log_result("Incidents - Read Operation", True)
        else:
            self.log_result("Incidents - Read Operation", False, f"Status: {response.status_code if response else 'No response'}", True)

        # Test Alerts CRUD
        response = self.make_request('GET', '/alerts')
        if response and response.status_code == 200:
            alerts = response.json()
            self.log_result("Alerts - Read Operation", True)
        else:
            self.log_result("Alerts - Read Operation", False, f"Status: {response.status_code if response else 'No response'}", True)

    def run_comprehensive_test(self):
        """Run comprehensive backend test"""
        print("🚀 Starting Comprehensive Backend Testing")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run all tests
        if not self.test_authentication_endpoints():
            print("❌ Authentication failed - stopping tests")
            return False
        
        self.test_sample_data_initialization()
        self.test_analytics_endpoint()
        self.test_system_health_endpoint()
        self.test_crud_operations()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        if self.critical_failures:
            print(f"\n⚠️ CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"  • {failure}")
        
        return len(self.critical_failures) == 0

def main():
    """Main function"""
    tester = ComprehensiveBackendTester()
    success = tester.run_comprehensive_test()
    
    # Save results
    with open('/app/comprehensive_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'failed_tests': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
                'critical_failures': len(tester.critical_failures)
            },
            'test_results': tester.test_results,
            'critical_failures': tester.critical_failures,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())