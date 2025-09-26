from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
from enum import Enum
import asyncio
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
security = HTTPBearer()
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    ADMIN = "Admin"
    ZONE_OPERATOR = "Zone Operator"
    RESPONDER = "Responder"
    VIEWER = "Viewer"

class IncidentType(str, Enum):
    OVERCROWDING = "Overcrowding"
    MISSING_CHILD = "Missing Child"
    MEDICAL_EMERGENCY = "Medical Emergency"
    FLOOD_RISK = "Flood Risk"
    FIGHT_AGGRESSION = "Fight/Aggression"
    DEVICE_FAULT = "Device Fault"

class IncidentStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"

class DeviceType(str, Enum):
    FIXED = "Fixed"
    PTZ = "PTZ"

class DeviceStatus(str, Enum):
    ONLINE = "Online"
    OFFLINE = "Offline"

class DeviceHealth(str, Enum):
    GOOD = "Good"
    WARNING = "Warning"
    FAULT = "Fault"

class ZoneType(str, Enum):
    RELIGIOUS = "Religious"
    PROCESSION_BATHING = "Procession/Bathing"
    TRANSIT = "Transit"
    ACCOMMODATION = "Accommodation"
    PARKING = "Parking"
    COMMERCIAL = "Commercial"

class AlertStatus(str, Enum):
    UNREAD = "Unread"
    READ = "Read"

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    role: UserRole
    assigned_zones: List[str] = []
    status: str = "Active"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole
    assigned_zones: List[str] = []

class UserLogin(BaseModel):
    username: str
    password: str

class Zone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    zone_type: ZoneType
    camera_count: int
    incidents: List[str] = []
    density: int
    area_code: str
    description: str
    capacity: int
    current_occupancy: int = 0
    zone_manager_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ZoneCreate(BaseModel):
    name: str
    zone_type: ZoneType
    camera_count: int
    density: int
    area_code: str
    description: str
    capacity: int

class Device(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    name: str
    device_type: DeviceType
    zone_id: str
    zone_name: str
    location: str
    status: DeviceStatus = DeviceStatus.ONLINE
    health: DeviceHealth = DeviceHealth.GOOD
    last_ping: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_checked: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_event: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeviceCreate(BaseModel):
    device_id: str
    name: str
    device_type: DeviceType
    zone_id: str
    zone_name: str
    location: str

class Incident(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    incident_id: str
    title: str
    description: str
    incident_type: IncidentType
    zone: str
    zone_id: str
    source: str
    severity: int = Field(ge=1, le=5)
    status: IncidentStatus = IncidentStatus.OPEN
    reported_by: str
    assigned_to: Optional[str] = None
    location: str
    coordinates: Optional[Dict[str, Any]] = None
    attachments: List[str] = []
    notes: List[Dict[str, Any]] = []
    time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

class IncidentCreate(BaseModel):
    title: str
    description: str
    incident_type: IncidentType
    zone: str
    zone_id: str
    source: str
    severity: int = Field(ge=1, le=5)
    location: str

class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_id: str
    title: str
    message: str
    alert_type: str
    zone: str
    source: str
    severity: int = Field(ge=1, le=5)
    zone_ids: List[str] = []
    created_by: str
    status: AlertStatus = AlertStatus.UNREAD
    is_active: bool = True
    time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None

class AlertCreate(BaseModel):
    title: str
    message: str
    alert_type: str
    zone: str
    source: str
    severity: int = Field(ge=1, le=5)
    zone_ids: List[str] = []
    expires_at: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = await db.users.find_one({"username": username})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    return User(**user)

# Auth routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user = User(**user_dict)
    
    user_doc = user.dict()
    user_doc["password"] = hashed_password
    await db.users.insert_one(user_doc)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"username": user_credentials.username})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    await db.users.update_one(
        {"_id": user["_id"]}, 
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    user_obj = User(**user)
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

# User management routes
@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to view users")
    
    users = await db.users.find().to_list(length=None)
    return [User(**user) for user in users]

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to create users")
    
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user = User(**user_dict)
    
    user_doc = user.dict()
    user_doc["password"] = hashed_password
    await db.users.insert_one(user_doc)
    
    return user

# Zone management routes
@api_router.get("/zones", response_model=List[Zone])
async def get_zones(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        zones = await db.zones.find().to_list(length=None)
    else:
        zones = await db.zones.find({"id": {"$in": current_user.assigned_zones}}).to_list(length=None)
    
    return [Zone(**zone) for zone in zones]

@api_router.post("/zones", response_model=Zone)
async def create_zone(zone_data: ZoneCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to create zones")
    
    zone = Zone(**zone_data.dict())
    await db.zones.insert_one(zone.dict())
    return zone

# Device management routes
@api_router.get("/devices", response_model=List[Device])
async def get_devices(zone_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    
    if current_user.role not in [UserRole.ADMIN]:
        query["zone_id"] = {"$in": current_user.assigned_zones}
    
    if zone_id and zone_id != "all":
        query["zone_id"] = zone_id
    
    devices = await db.devices.find(query).to_list(length=None)
    return [Device(**device) for device in devices]

@api_router.post("/devices", response_model=Device)
async def create_device(device_data: DeviceCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(status_code=403, detail="Not authorized to create devices")
    
    if current_user.role not in [UserRole.ADMIN] and device_data.zone_id not in current_user.assigned_zones:
        raise HTTPException(status_code=403, detail="Not authorized to create devices in this zone")
    
    device = Device(**device_data.dict())
    await db.devices.insert_one(device.dict())
    return device

@api_router.put("/devices/{device_id}/reboot")
async def reboot_device(device_id: str, current_user: User = Depends(get_current_user)):
    device = await db.devices.find_one({"device_id": device_id})
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Simulate reboot process
    await db.devices.update_one(
        {"device_id": device_id}, 
        {"$set": {
            "status": DeviceStatus.ONLINE,
            "health": DeviceHealth.GOOD,
            "last_checked": datetime.now(timezone.utc)
        }}
    )
    
    return {"message": f"Device {device_id} rebooted successfully"}

# Incident management routes
@api_router.get("/incidents", response_model=List[Incident])
async def get_incidents(zone_id: Optional[str] = None, status: Optional[IncidentStatus] = None, current_user: User = Depends(get_current_user)):
    query = {}
    
    if current_user.role not in [UserRole.ADMIN]:
        query["zone_id"] = {"$in": current_user.assigned_zones}
    
    if zone_id and zone_id != "all":
        query["zone_id"] = zone_id
    
    if status and status != "all":
        query["status"] = status
    
    incidents = await db.incidents.find(query).sort("created_at", -1).to_list(length=None)
    return [Incident(**incident) for incident in incidents]

@api_router.post("/incidents", response_model=Incident)
async def create_incident(incident_data: IncidentCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(status_code=403, detail="Not authorized to create incidents")
    
    incident_dict = incident_data.dict()
    incident_dict["reported_by"] = current_user.id
    incident_dict["incident_id"] = f"INC{random.randint(1000, 9999)}"
    incident = Incident(**incident_dict)
    
    await db.incidents.insert_one(incident.dict())
    return incident

@api_router.put("/incidents/{incident_id}", response_model=Incident)
async def update_incident(incident_id: str, update_data: IncidentUpdate, current_user: User = Depends(get_current_user)):
    incident = await db.incidents.find_one({"incident_id": incident_id})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    if current_user.role not in [UserRole.ADMIN] and incident["zone_id"] not in current_user.assigned_zones:
        raise HTTPException(status_code=403, detail="Not authorized to update this incident")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    if update_data.status == IncidentStatus.RESOLVED:
        update_dict["resolved_at"] = datetime.now(timezone.utc)
    
    if update_data.notes:
        note = {
            "text": update_data.notes,
            "user_id": current_user.id,
            "timestamp": datetime.now(timezone.utc)
        }
        await db.incidents.update_one(
            {"incident_id": incident_id}, 
            {"$push": {"notes": note}, "$set": update_dict}
        )
    else:
        await db.incidents.update_one({"incident_id": incident_id}, {"$set": update_dict})
    
    updated_incident = await db.incidents.find_one({"incident_id": incident_id})
    return Incident(**updated_incident)

# Alert management routes
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(active_only: bool = True, current_user: User = Depends(get_current_user)):
    query = {}
    if active_only:
        query["is_active"] = True
    
    if current_user.role not in [UserRole.ADMIN]:
        query["$or"] = [
            {"zone_ids": {"$size": 0}},
            {"zone_ids": {"$in": current_user.assigned_zones}}
        ]
    
    alerts = await db.alerts.find(query).sort("created_at", -1).to_list(length=None)
    return [Alert(**alert) for alert in alerts]

@api_router.post("/alerts", response_model=Alert)
async def create_alert(alert_data: AlertCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.ZONE_OPERATOR]:
        raise HTTPException(status_code=403, detail="Not authorized to create alerts")
    
    alert_dict = alert_data.dict()
    alert_dict["created_by"] = current_user.id
    alert_dict["alert_id"] = f"AL{random.randint(1000, 9999)}"
    alert = Alert(**alert_dict)
    
    await db.alerts.insert_one(alert.dict())
    return alert

@api_router.put("/alerts/{alert_id}/status")
async def update_alert_status(alert_id: str, status: AlertStatus, current_user: User = Depends(get_current_user)):
    await db.alerts.update_one(
        {"alert_id": alert_id}, 
        {"$set": {"status": status}}
    )
    return {"message": f"Alert {alert_id} marked as {status}"}

# Analytics routes
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user)):
    zone_filter = {}
    if current_user.role not in [UserRole.ADMIN]:
        zone_filter = {"zone_id": {"$in": current_user.assigned_zones}}
    
    total_incidents = await db.incidents.count_documents(zone_filter)
    open_incidents = await db.incidents.count_documents({**zone_filter, "status": {"$ne": IncidentStatus.RESOLVED}})
    total_devices = await db.devices.count_documents(zone_filter)
    online_devices = await db.devices.count_documents({**zone_filter, "status": DeviceStatus.ONLINE})
    
    recent_incidents = await db.incidents.find(zone_filter).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "total_incidents": total_incidents,
        "open_incidents": open_incidents,
        "total_devices": total_devices,
        "online_devices": online_devices,
        "device_uptime": round((online_devices / total_devices * 100) if total_devices > 0 else 0, 1),
        "recent_incidents": [Incident(**incident) for incident in recent_incidents]
    }

@api_router.get("/analytics/zone-density")
async def get_zone_density():
    zones = await db.zones.find().to_list(None)
    return {zone["name"]: zone["density"] for zone in zones}

@api_router.get("/analytics/incident-types")
async def get_incident_type_breakdown():
    pipeline = [
        {"$group": {"_id": "$incident_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    results = await db.incidents.aggregate(pipeline).to_list(None)
    return {result["_id"]: result["count"] for result in results}

@api_router.get("/analytics/device-health")
async def get_device_health_stats():
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
    ]
    results = await db.devices.aggregate(pipeline).to_list(None)
    total = sum(result["count"] for result in results)
    
    return {
        result["_id"]: round((result["count"] / total * 100), 1) if total > 0 else 0 
        for result in results
    }

# System health routes
@api_router.get("/system/health")
async def get_system_health():
    device_faults = await db.devices.find({
        "$or": [
            {"status": DeviceStatus.OFFLINE},
            {"health": DeviceHealth.FAULT},
            {"health": DeviceHealth.WARNING}
        ]
    }).to_list(None)
    
    return {
        "status": "healthy",
        "uptime": "98.5%",
        "cpu_usage": f"{random.randint(15, 45)}%",
        "memory_usage": f"{random.randint(20, 60)}%",
        "network_status": "Stable across all zones",
        "database_status": "connected",
        "active_connections": random.randint(50, 150),
        "device_faults": [Device(**fault) for fault in device_faults],
        "last_backup": datetime.now(timezone.utc) - timedelta(hours=6)
    }

# Initialize sample data with realistic Ujjain MahaKumbh data
@api_router.post("/init/sample-data")
async def initialize_sample_data():
    # Clear existing data
    await db.users.delete_many({})
    await db.zones.delete_many({})
    await db.devices.delete_many({})
    await db.incidents.delete_many({})
    await db.alerts.delete_many({})
    
    # Create realistic users
    users_data = [
        {"username": "admin1", "email": "admin1@cityhub.com", "role": UserRole.ADMIN, "assigned_zones": [], "last_login": datetime(2025, 10, 23, 9, 12)},
        {"username": "ops2", "email": "ops2@cityhub.com", "role": UserRole.ZONE_OPERATOR, "assigned_zones": ["zone2"], "last_login": datetime(2025, 10, 23, 10, 34)},
        {"username": "ops3", "email": "ops3@cityhub.com", "role": UserRole.ZONE_OPERATOR, "assigned_zones": ["zone4"], "last_login": datetime(2025, 10, 23, 10, 38)},
        {"username": "medic7", "email": "medic7@cityhub.com", "role": UserRole.RESPONDER, "assigned_zones": ["zone6"], "last_login": datetime(2025, 10, 23, 11, 10)},
        {"username": "police3", "email": "police3@cityhub.com", "role": UserRole.RESPONDER, "assigned_zones": ["zone6"], "last_login": datetime(2025, 10, 23, 10, 9)}
    ]
    
    for user_data in users_data:
        user_data["password"] = get_password_hash("admin123")  # Set default password
        user = User(**user_data)
        user_doc = user.dict()
        user_doc["password"] = user_data["password"]
        await db.users.insert_one(user_doc)
    
    # Create zones with realistic Ujjain data
    zones_data = [
        {"id": "zone1", "name": "Temple District", "zone_type": ZoneType.RELIGIOUS, "camera_count": 720, "incidents": ["INC001"], "density": 9200, "area_code": "TD1", "description": "Main temple complex area", "capacity": 50000},
        {"id": "zone2", "name": "Ram Ghat & Riverfront", "zone_type": ZoneType.PROCESSION_BATHING, "camera_count": 900, "incidents": ["INC002"], "density": 15400, "area_code": "RG1", "description": "River bank and bathing area", "capacity": 80000},
        {"id": "zone3", "name": "Transport Hub", "zone_type": ZoneType.TRANSIT, "camera_count": 480, "incidents": [], "density": 4100, "area_code": "TH1", "description": "Main transport terminal", "capacity": 20000},
        {"id": "zone4", "name": "North Satellite", "zone_type": ZoneType.ACCOMMODATION, "camera_count": 310, "incidents": ["INC004"], "density": 2700, "area_code": "NS1", "description": "North accommodation area", "capacity": 15000},
        {"id": "zone5", "name": "South Satellite", "zone_type": ZoneType.PARKING, "camera_count": 320, "incidents": [], "density": 1900, "area_code": "SS1", "description": "Vehicle parking area", "capacity": 10000},
        {"id": "zone6", "name": "Market District", "zone_type": ZoneType.COMMERCIAL, "camera_count": 270, "incidents": ["INC003", "INC005"], "density": 6800, "area_code": "MD1", "description": "Commercial and shopping zone", "capacity": 30000}
    ]
    
    for zone_data in zones_data:
        zone = Zone(**zone_data)
        await db.zones.insert_one(zone.dict())
    
    # Create devices
    devices_data = [
        {"device_id": "CAM105", "name": "Temple Main Gate Camera", "device_type": DeviceType.FIXED, "zone_id": "zone1", "zone_name": "Temple District", "location": "Main Gate", "status": DeviceStatus.ONLINE, "health": DeviceHealth.GOOD, "last_checked": datetime(2025, 10, 23, 10, 32), "last_event": "INC001"},
        {"device_id": "CAM410", "name": "Market Center Camera", "device_type": DeviceType.PTZ, "zone_id": "zone6", "zone_name": "Market District", "location": "Market Center", "status": DeviceStatus.ONLINE, "health": DeviceHealth.GOOD, "last_checked": datetime(2025, 10, 23, 10, 12), "last_event": "INC005"},
        {"device_id": "CAM203", "name": "Ghat Monitoring Camera", "device_type": DeviceType.FIXED, "zone_id": "zone2", "zone_name": "Ram Ghat & Riverfront", "location": "Main Ghat", "status": DeviceStatus.OFFLINE, "health": DeviceHealth.FAULT, "last_checked": datetime(2025, 10, 23, 9, 17), "last_event": None},
        {"device_id": "CAM221", "name": "North Satellite Camera", "device_type": DeviceType.FIXED, "zone_id": "zone4", "zone_name": "North Satellite", "location": "Tent Area", "status": DeviceStatus.ONLINE, "health": DeviceHealth.WARNING, "last_checked": datetime(2025, 10, 23, 10, 2), "last_event": "INC004"},
        {"device_id": "CAM132", "name": "Temple Secondary Camera", "device_type": DeviceType.FIXED, "zone_id": "zone1", "zone_name": "Temple District", "location": "Side Entrance", "status": DeviceStatus.ONLINE, "health": DeviceHealth.GOOD, "last_checked": datetime(2025, 10, 23, 8, 54), "last_event": None}
    ]
    
    for device_data in devices_data:
        device = Device(**device_data)
        await db.devices.insert_one(device.dict())
    
    # Create incidents
    incidents_data = [
        {"incident_id": "INC001", "title": "Temple Gate Overcrowding", "description": "Temple entry queue exceeded safe density; gate auto-locked.", "incident_type": IncidentType.OVERCROWDING, "zone": "Temple District", "zone_id": "zone1", "source": "CAM105", "status": IncidentStatus.OPEN, "assigned_to": "ops2", "location": "Main Gate", "severity": 4, "reported_by": "admin1", "time": datetime(2025, 10, 23, 10, 33)},
        {"incident_id": "INC002", "title": "Missing Child Alert", "description": "SOS alert from parent; child photo received.", "incident_type": IncidentType.MISSING_CHILD, "zone": "Ram Ghat & Riverfront", "zone_id": "zone2", "source": "SOS021", "status": IncidentStatus.IN_PROGRESS, "assigned_to": "medic7", "location": "Ghat Area", "severity": 3, "reported_by": "ops2", "time": datetime(2025, 10, 23, 11, 0)},
        {"incident_id": "INC003", "title": "Medical Emergency", "description": "First-aid team dispatched to market; incident closed.", "incident_type": IncidentType.MEDICAL_EMERGENCY, "zone": "Market District", "zone_id": "zone6", "source": "CAM410", "status": IncidentStatus.RESOLVED, "assigned_to": "medic7", "location": "Market Center", "severity": 2, "reported_by": "ops3", "time": datetime(2025, 10, 23, 9, 48), "resolved_at": datetime(2025, 10, 23, 10, 15)},
        {"incident_id": "INC004", "title": "Flood Risk Warning", "description": "Shipra water levels rising near accommodation tents.", "incident_type": IncidentType.FLOOD_RISK, "zone": "North Satellite", "zone_id": "zone4", "source": "CAM221", "status": IncidentStatus.OPEN, "assigned_to": "ops3", "location": "Tent Area", "severity": 5, "reported_by": "admin1", "time": datetime(2025, 10, 23, 8, 27)},
        {"incident_id": "INC005", "title": "Fight Dispersed", "description": "Physical altercation dispersed by security team.", "incident_type": IncidentType.FIGHT_AGGRESSION, "zone": "Market District", "zone_id": "zone6", "source": "CAM410", "status": IncidentStatus.RESOLVED, "assigned_to": "police3", "location": "Market Center", "severity": 3, "reported_by": "ops2", "time": datetime(2025, 10, 23, 10, 9), "resolved_at": datetime(2025, 10, 23, 10, 25)}
    ]
    
    for incident_data in incidents_data:
        incident = Incident(**incident_data)
        await db.incidents.insert_one(incident.dict())
    
    # Create alerts
    alerts_data = [
        {"alert_id": "AL001", "title": "Overcrowding Alert", "message": "Temple District reaching capacity", "alert_type": IncidentType.OVERCROWDING, "zone": "Temple District", "source": "CAM105", "severity": 4, "status": AlertStatus.UNREAD, "created_by": "admin1", "time": datetime(2025, 10, 23, 10, 34)},
        {"alert_id": "AL002", "title": "Medical Emergency", "message": "Medical team dispatched to Market District", "alert_type": IncidentType.MEDICAL_EMERGENCY, "zone": "Market District", "source": "CAM410", "severity": 2, "status": AlertStatus.READ, "created_by": "medic7", "time": datetime(2025, 10, 23, 9, 49)},
        {"alert_id": "AL003", "title": "Flood Risk", "message": "Rising water levels detected", "alert_type": IncidentType.FLOOD_RISK, "zone": "North Satellite", "source": "CAM221", "severity": 5, "status": AlertStatus.UNREAD, "created_by": "ops3", "time": datetime(2025, 10, 23, 8, 30)},
        {"alert_id": "AL004", "title": "Device Fault", "message": "Camera offline in Ghat area", "alert_type": IncidentType.DEVICE_FAULT, "zone": "Ram Ghat & Riverfront", "source": "CAM203", "severity": 3, "status": AlertStatus.UNREAD, "created_by": "admin1", "time": datetime(2025, 10, 23, 9, 17)}
    ]
    
    for alert_data in alerts_data:
        alert = Alert(**alert_data)
        await db.alerts.insert_one(alert.dict())
    
    return {"message": "Realistic sample data initialized successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()