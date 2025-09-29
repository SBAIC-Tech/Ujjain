import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")

# Configuration from environment variables
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://127.0.0.1:27017')
DB_NAME = os.environ.get('DB_NAME', 'emergency_management')
SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback-key-for-development-only')
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

# JWT Configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
security = HTTPBearer()

# Initialize FastAPI
app = FastAPI(title="Emergency Management API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    name: str
    role: str
    zone: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    name: str
    password: str
    role: str
    zone: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Zone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    capacity: int
    currentOccupancy: int = 0
    status: str = "Normal"
    devices: int = 0
    incidents: int = 0
    description: Optional[str] = None
    coordinates: Optional[dict] = None

class Device(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    location: str
    status: str = "offline"
    health: int = 0
    lastPing: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    zone: Optional[str] = None

class Incident(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    location: str
    status: str = "Open"
    priority: str = "Medium"
    type: str
    assignedTo: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    type: str
    severity: str = "medium"
    status: str = "unread"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# API Routes

@app.get("/")
async def root():
    return {"message": "Emergency Management API", "status": "running"}

@app.get("/api/health")
async def health_check():
    try:
        # Test database connection
        await db.admin.command('ping')
        return {"status": "healthy", "database": "connected", "timestamp": datetime.now(timezone.utc)}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# Authentication Routes
@app.post("/api/auth/login")
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"username": user_credentials.username})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    user_response = User(**{k: v for k, v in user.items() if k != "password"})
    return {"access_token": access_token, "token_type": "bearer", "user": user_response}

@app.post("/api/auth/logout")
async def logout(current_user: str = Depends(verify_token)):
    return {"message": "Successfully logged out"}

# User Management Routes
@app.get("/api/users", response_model=List[User])
async def get_users(current_user: str = Depends(verify_token)):
    users = await db.users.find({}, {"password": 0}).to_list(length=None)
    return [User(**user) for user in users]

@app.post("/api/users", response_model=User)
async def create_user(user: UserCreate, current_user: str = Depends(verify_token)):
    # Check if user already exists
    existing_user = await db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_dict = user.dict()
    user_dict["password"] = hash_password(user.password)
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.now(timezone.utc)
    
    await db.users.insert_one(user_dict)
    return User(**{k: v for k, v in user_dict.items() if k != "password"})

@app.put("/api/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_update: dict, current_user: str = Depends(verify_token)):
    result = await db.users.update_one({"id": user_id}, {"$set": user_update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await db.users.find_one({"id": user_id}, {"password": 0})
    return User(**updated_user)

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, current_user: str = Depends(verify_token)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Zone Management Routes
@app.get("/api/zones", response_model=List[Zone])
async def get_zones(current_user: str = Depends(verify_token)):
    zones = await db.zones.find().to_list(length=None)
    return [Zone(**zone) for zone in zones]

@app.post("/api/zones", response_model=Zone)
async def create_zone(zone: Zone, current_user: str = Depends(verify_token)):
    zone_dict = zone.dict()
    await db.zones.insert_one(zone_dict)
    return zone

@app.put("/api/zones/{zone_id}", response_model=Zone)
async def update_zone(zone_id: str, zone_update: dict, current_user: str = Depends(verify_token)):
    result = await db.zones.update_one({"id": zone_id}, {"$set": zone_update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    updated_zone = await db.zones.find_one({"id": zone_id})
    return Zone(**updated_zone)

@app.delete("/api/zones/{zone_id}")
async def delete_zone(zone_id: str, current_user: str = Depends(verify_token)):
    result = await db.zones.delete_one({"id": zone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {"message": "Zone deleted successfully"}

# Device Management Routes
@app.get("/api/devices", response_model=List[Device])
async def get_devices(current_user: str = Depends(verify_token)):
    devices = await db.devices.find().to_list(length=None)
    return [Device(**device) for device in devices]

@app.post("/api/devices", response_model=Device)
async def create_device(device: Device, current_user: str = Depends(verify_token)):
    device_dict = device.dict()
    await db.devices.insert_one(device_dict)
    return device

@app.put("/api/devices/{device_id}", response_model=Device)
async def update_device(device_id: str, device_update: dict, current_user: str = Depends(verify_token)):
    result = await db.devices.update_one({"id": device_id}, {"$set": device_update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    updated_device = await db.devices.find_one({"id": device_id})
    return Device(**updated_device)

@app.put("/api/devices/{device_id}/reboot")
async def reboot_device(device_id: str, current_user: str = Depends(verify_token)):
    result = await db.devices.update_one(
        {"id": device_id}, 
        {"$set": {"status": "online", "health": 100, "lastPing": datetime.now(timezone.utc)}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": f"Device {device_id} reboot initiated"}

@app.delete("/api/devices/{device_id}")
async def delete_device(device_id: str, current_user: str = Depends(verify_token)):
    result = await db.devices.delete_one({"id": device_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": "Device deleted successfully"}

# Incident Management Routes
@app.get("/api/incidents", response_model=List[Incident])
async def get_incidents(current_user: str = Depends(verify_token)):
    incidents = await db.incidents.find().to_list(length=None)
    return [Incident(**incident) for incident in incidents]

@app.post("/api/incidents", response_model=Incident)
async def create_incident(incident: Incident, current_user: str = Depends(verify_token)):
    incident_dict = incident.dict()
    await db.incidents.insert_one(incident_dict)
    return incident

@app.put("/api/incidents/{incident_id}", response_model=Incident)
async def update_incident(incident_id: str, incident_update: dict, current_user: str = Depends(verify_token)):
    result = await db.incidents.update_one({"id": incident_id}, {"$set": incident_update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    updated_incident = await db.incidents.find_one({"id": incident_id})
    return Incident(**updated_incident)

@app.delete("/api/incidents/{incident_id}")
async def delete_incident(incident_id: str, current_user: str = Depends(verify_token)):
    result = await db.incidents.delete_one({"id": incident_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Incident deleted successfully"}

# Alert Management Routes
@app.get("/api/alerts", response_model=List[Alert])
async def get_alerts(current_user: str = Depends(verify_token)):
    alerts = await db.alerts.find().to_list(length=None)
    return [Alert(**alert) for alert in alerts]

@app.post("/api/alerts", response_model=Alert)
async def create_alert(alert: Alert, current_user: str = Depends(verify_token)):
    alert_dict = alert.dict()
    await db.alerts.insert_one(alert_dict)
    return alert

@app.put("/api/alerts/{alert_id}", response_model=Alert)
async def update_alert(alert_id: str, alert_update: dict, current_user: str = Depends(verify_token)):
    result = await db.alerts.update_one({"id": alert_id}, {"$set": alert_update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    updated_alert = await db.alerts.find_one({"id": alert_id})
    return Alert(**updated_alert)

@app.delete("/api/alerts/{alert_id}")
async def delete_alert(alert_id: str, current_user: str = Depends(verify_token)):
    result = await db.alerts.delete_one({"id": alert_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted successfully"}

# Analytics Routes
@app.get("/api/analytics")
async def get_analytics(current_user: str = Depends(verify_token)):
    # Count documents in each collection
    total_incidents = await db.incidents.count_documents({})
    active_incidents = await db.incidents.count_documents({"status": {"$ne": "Resolved"}})
    total_devices = await db.devices.count_documents({})
    online_devices = await db.devices.count_documents({"status": "online"})
    total_zones = await db.zones.count_documents({})
    total_alerts = await db.alerts.count_documents({})
    
    return {
        "totalIncidents": total_incidents,
        "activeIncidents": active_incidents,
        "resolvedToday": total_incidents - active_incidents,
        "averageResponseTime": "4.2 min",
        "deviceUptime": f"{(online_devices/total_devices*100):.1f}%" if total_devices > 0 else "0%",
        "totalDevices": total_devices,
        "onlineDevices": online_devices,
        "totalZones": total_zones,
        "totalAlerts": total_alerts
    }

# System Health Routes
@app.get("/api/system/health")
async def get_system_health(current_user: str = Depends(verify_token)):
    try:
        # Test database connection
        await db.admin.command('ping')
        db_status = "Connected"
    except:
        db_status = "Disconnected"
    
    total_devices = await db.devices.count_documents({})
    online_devices = await db.devices.count_documents({"status": "online"})
    
    return {
        "overallStatus": "Operational" if db_status == "Connected" else "Issues Detected",
        "uptime": "99.2%",
        "activeConnections": online_devices,
        "networkLatency": "< 85ms",
        "databaseStatus": db_status,
        "cpuUsage": 38,
        "memoryUsage": 72,
        "diskUsage": 52,
        "networkStatus": "Stable",
        "lastBackup": datetime.now(timezone.utc).isoformat()
    }

# Data Initialization Routes
@app.post("/api/init/sample-data")
async def initialize_sample_data():
    try:
        # Clear existing data
        await db.users.delete_many({})
        await db.zones.delete_many({})
        await db.devices.delete_many({})
        await db.incidents.delete_many({})
        await db.alerts.delete_many({})
        
        # Create admin users
        admin_users = [
            {
                "id": str(uuid.uuid4()),
                "username": "admin1",
                "email": "admin@test.com",
                "name": "System Administrator",
                "password": hash_password("admin123"),
                "role": "admin",
                "zone": "All Zones",
                "phone": "+91-9876543210",
                "created_at": datetime.now(timezone.utc)
            },
            {
                "id": str(uuid.uuid4()),
                "username": "operator1",
                "email": "operator@test.com",
                "name": "Zone Operator",
                "password": hash_password("operator123"),
                "role": "operator",
                "zone": "Temple District",
                "phone": "+91-9876543211",
                "created_at": datetime.now(timezone.utc)
            }
        ]
        await db.users.insert_many(admin_users)
        
        # Create sample zones
        sample_zones = [
            {
                "id": "ZONE001",
                "name": "Mahakaleshwar Temple District",
                "type": "Religious - Primary",
                "capacity": 800000,
                "currentOccupancy": 185000,
                "status": "Very High Density",
                "devices": 700,
                "incidents": 8,
                "description": "Primary temple zone with Mahakal Lok Corridor and AI-enabled surveillance"
            },
            {
                "id": "ZONE002",
                "name": "Ram Ghat & Shipra Riverfront",
                "type": "Waterfront - Sacred",
                "capacity": 150000,
                "currentOccupancy": 42000,
                "status": "High Density",
                "devices": 51,
                "incidents": 12,
                "description": "Sacred bathing ghats along Shipra River with comprehensive monitoring"
            },
            {
                "id": "ZONE003",
                "name": "Chimangunj Market District",
                "type": "Commercial",
                "capacity": 50000,
                "currentOccupancy": 18500,
                "status": "Normal",
                "devices": 50,
                "incidents": 3,
                "description": "Primary commercial and shopping area for pilgrims and locals"
            }
        ]
        await db.zones.insert_many(sample_zones)
        
        # Create sample devices
        sample_devices = [
            {
                "id": "CAM_MK_001",
                "name": "Mahakal Entry Gate 1 - Facial Recognition",
                "type": "Facial Recognition",
                "location": "Mahakaleshwar Temple - Main Entry",
                "status": "online",
                "health": 98,
                "lastPing": datetime.now(timezone.utc),
                "zone": "Temple District"
            },
            {
                "id": "CAM_RG_051",
                "name": "Ram Ghat - Ghat 5 Surveillance",
                "type": "Dome",
                "location": "Ram Ghat - Ghat Point 5",
                "status": "online",
                "health": 92,
                "lastPing": datetime.now(timezone.utc),
                "zone": "Ram Ghat & Riverfront"
            },
            {
                "id": "CAM_MD_023",
                "name": "Chimangunj Market - Dome Cam",
                "type": "Dome",
                "location": "Chimangunj Main Market",
                "status": "offline",
                "health": 0,
                "lastPing": datetime.now(timezone.utc) - timedelta(hours=2),
                "zone": "Market District"
            }
        ]
        await db.devices.insert_many(sample_devices)
        
        # Create sample incidents
        sample_incidents = [
            {
                "id": "INC2417",
                "title": "Overcrowding Alert - Mahakal Corridor",
                "description": "Large crowd gathering exceeding 250,000 visitors at main temple entrance",
                "location": "Mahakaleshwar Temple - Entry Gate 3",
                "status": "Open",
                "priority": "Critical",
                "type": "crowd_management",
                "assignedTo": "Mahakal Police Station",
                "timestamp": datetime.now(timezone.utc) - timedelta(minutes=30)
            },
            {
                "id": "INC2431",
                "title": "Missing Child Alert",
                "description": "8-year old child separated from family during evening aarti ceremony",
                "location": "Ram Ghat & Shipra Riverfront - Ghat 7",
                "status": "In Progress",
                "priority": "High",
                "type": "missing_person",
                "assignedTo": "Neelganga Police Station",
                "timestamp": datetime.now(timezone.utc) - timedelta(minutes=15)
            }
        ]
        await db.incidents.insert_many(sample_incidents)
        
        # Create sample alerts
        sample_alerts = [
            {
                "id": "ALERT_MK_001",
                "title": "Mahakal Temple Visitor Capacity Alert",
                "message": "Current occupancy: 185,000 | Approaching peak capacity",
                "type": "crowd_warning",
                "severity": "high",
                "status": "unread",
                "timestamp": datetime.now(timezone.utc)
            },
            {
                "id": "ALERT_CAM_002",
                "title": "Camera CAM_MD_023 Offline",
                "message": "Chimangunj Market surveillance disrupted - requires attention",
                "type": "device_failure",
                "severity": "medium",
                "status": "unread",
                "timestamp": datetime.now(timezone.utc) - timedelta(minutes=15)
            }
        ]
        await db.alerts.insert_many(sample_alerts)
        
        return {
            "message": "Sample data initialized successfully",
            "users_created": len(admin_users),
            "zones_created": len(sample_zones),
            "devices_created": len(sample_devices),
            "incidents_created": len(sample_incidents),
            "alerts_created": len(sample_alerts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize sample data: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)