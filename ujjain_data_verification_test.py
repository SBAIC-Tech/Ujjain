#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

class UjjainDataVerificationTester:
    def __init__(self, base_url="https://emergency-dash-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.verification_results = []

    def log_result(self, test_name, success, details="", data=None):
        """Log verification result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - VERIFIED")
            if details:
                print(f"   📋 {details}")
        else:
            print(f"❌ {test_name} - FAILED")
            if details:
                print(f"   ⚠️ {details}")
        
        self.verification_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "data": data
        })

    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None

    def authenticate(self):
        """Authenticate with admin credentials"""
        print("🔐 Authenticating...")
        login_data = {"username": "admin1", "password": "admin123"}
        response = self.make_request('POST', '/auth/login', login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if 'access_token' in data:
                self.token = data['access_token']
                print("✅ Authentication successful")
                return True
        
        print("❌ Authentication failed")
        return False

    def verify_police_stations_data(self):
        """Verify if 31 police stations are present in the data"""
        print("\n🚔 Verifying Police Stations Data...")
        
        # Check zones for police station data
        response = self.make_request('GET', '/zones')
        if response and response.status_code == 200:
            zones = response.json()
            
            # Look for police station related zones or fields
            police_stations = []
            for zone in zones:
                if 'police' in zone.get('name', '').lower() or 'station' in zone.get('name', '').lower():
                    police_stations.append(zone)
                # Check if there's a policeStation field as mentioned in review
                if 'policeStation' in zone or 'police_station' in zone:
                    police_stations.append(zone)
            
            if len(police_stations) >= 31:
                self.log_result("Police Stations Count (31+)", True, 
                              f"Found {len(police_stations)} police station entries", police_stations)
            else:
                self.log_result("Police Stations Count (31+)", False, 
                              f"Expected 31+ police stations, found {len(police_stations)}. Current zones: {[z['name'] for z in zones]}")
        else:
            self.log_result("Police Stations Data Access", False, "Could not retrieve zones data")

    def verify_camera_infrastructure(self):
        """Verify if 1100+ cameras are present in the data"""
        print("\n📹 Verifying Camera Infrastructure...")
        
        # Check devices for camera count
        response = self.make_request('GET', '/devices')
        if response and response.status_code == 200:
            devices = response.json()
            
            # Count cameras
            cameras = [d for d in devices if 'camera' in d.get('name', '').lower() or 'cam' in d.get('device_id', '').lower()]
            
            if len(cameras) >= 1100:
                self.log_result("Camera Count (1100+)", True, 
                              f"Found {len(cameras)} cameras", {"total_cameras": len(cameras)})
            else:
                self.log_result("Camera Count (1100+)", False, 
                              f"Expected 1100+ cameras, found {len(cameras)} cameras out of {len(devices)} total devices")
            
            # Check camera types as mentioned in review
            camera_types = {}
            for device in devices:
                device_type = device.get('device_type', 'Unknown')
                camera_types[device_type] = camera_types.get(device_type, 0) + 1
            
            if camera_types:
                self.log_result("Camera Types Diversity", True, 
                              f"Camera types found: {camera_types}")
            else:
                self.log_result("Camera Types Diversity", False, "No camera type information found")
        else:
            self.log_result("Camera Infrastructure Access", False, "Could not retrieve devices data")

    def verify_temple_visitor_statistics(self):
        """Verify temple visitor statistics and related data"""
        print("\n🏛️ Verifying Temple Visitor Statistics...")
        
        # Check zones for temple-related data
        response = self.make_request('GET', '/zones')
        if response and response.status_code == 200:
            zones = response.json()
            
            temple_zones = []
            visitor_stats_found = False
            
            for zone in zones:
                # Look for temple-related zones
                if 'temple' in zone.get('name', '').lower() or zone.get('zone_type') == 'Religious':
                    temple_zones.append(zone)
                
                # Check for visitor statistics fields
                if any(field in zone for field in ['visitor_count', 'visitorCount', 'current_occupancy', 'capacity']):
                    visitor_stats_found = True
            
            if temple_zones:
                self.log_result("Temple Zones Identified", True, 
                              f"Found {len(temple_zones)} temple/religious zones: {[z['name'] for z in temple_zones]}")
            else:
                self.log_result("Temple Zones Identified", False, "No temple or religious zones found")
            
            if visitor_stats_found:
                self.log_result("Visitor Statistics Fields", True, "Found visitor/occupancy tracking fields")
            else:
                self.log_result("Visitor Statistics Fields", False, "No visitor statistics fields found")
        else:
            self.log_result("Temple Data Access", False, "Could not retrieve zones data")

    def verify_new_data_structure(self):
        """Verify the new data structure mentioned in review"""
        print("\n🔍 Verifying New Data Structure...")
        
        # Check sample data initialization response for structure
        response = self.make_request('POST', '/init/sample-data')
        if response and response.status_code == 200:
            self.log_result("Sample Data Initialization", True, "Sample data can be reinitialized")
        else:
            self.log_result("Sample Data Initialization", False, "Could not reinitialize sample data")
        
        # Check analytics endpoint for new data handling
        response = self.make_request('GET', '/analytics/dashboard')
        if response and response.status_code == 200:
            analytics = response.json()
            
            # Check if analytics properly handles the data structure
            required_fields = ['total_incidents', 'total_devices', 'device_uptime']
            missing_fields = [field for field in required_fields if field not in analytics]
            
            if not missing_fields:
                self.log_result("Analytics Data Structure", True, 
                              f"Analytics properly processes data: {analytics}")
            else:
                self.log_result("Analytics Data Structure", False, 
                              f"Missing analytics fields: {missing_fields}")
        else:
            self.log_result("Analytics Data Structure", False, "Could not retrieve analytics data")

    def verify_system_health_with_infrastructure(self):
        """Verify system health endpoint handles updated infrastructure data"""
        print("\n🏥 Verifying System Health with Infrastructure Data...")
        
        response = self.make_request('GET', '/system/health')
        if response and response.status_code == 200:
            health = response.json()
            
            # Check if system health includes device fault information
            if 'device_faults' in health:
                device_faults = health['device_faults']
                self.log_result("Device Fault Tracking", True, 
                              f"System tracks {len(device_faults)} device faults")
            else:
                self.log_result("Device Fault Tracking", False, "No device fault tracking in system health")
            
            # Check for infrastructure-related health metrics
            infrastructure_fields = ['network_status', 'database_status', 'active_connections']
            found_fields = [field for field in infrastructure_fields if field in health]
            
            if len(found_fields) >= 2:
                self.log_result("Infrastructure Health Metrics", True, 
                              f"Found infrastructure metrics: {found_fields}")
            else:
                self.log_result("Infrastructure Health Metrics", False, 
                              f"Limited infrastructure metrics: {found_fields}")
        else:
            self.log_result("System Health Access", False, "Could not retrieve system health data")

    def run_verification(self):
        """Run all verification tests"""
        print("🔍 Starting Ujjain Data Verification Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 70)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed - stopping verification")
            return False
        
        # Run all verification tests
        self.verify_police_stations_data()
        self.verify_camera_infrastructure()
        self.verify_temple_visitor_statistics()
        self.verify_new_data_structure()
        self.verify_system_health_with_infrastructure()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 UJJAIN DATA VERIFICATION SUMMARY")
        print("=" * 70)
        print(f"Total Verifications: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Detailed findings
        print("\n📋 DETAILED FINDINGS:")
        for result in self.verification_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main function"""
    tester = UjjainDataVerificationTester()
    success = tester.run_verification()
    
    # Save verification results
    with open('/app/ujjain_verification_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_verifications': tester.tests_run,
                'passed_verifications': tester.tests_passed,
                'failed_verifications': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
            },
            'verification_results': tester.verification_results,
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())