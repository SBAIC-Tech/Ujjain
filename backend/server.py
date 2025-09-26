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
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    MASTER_ADMIN = "master_admin"
    ZONE_MANAGER = "zone_manager" 
    RESPONDER = "responder"
    VIEWER = "viewer"

class IncidentType(str, Enum):
    CROWD_ALERT = "crowd_alert"
    SOS_SIGNAL = "sos_signal"
    FIRE_EMERGENCY = "fire_emergency"
    MEDICAL_EMERGENCY = "medical_emergency"
    SECURITY_THREAT = "security_threat"
    DEVICE_MALFUNCTION = "device_malfunction"

class IncidentStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class DeviceType(str, Enum):
    CAMERA = "camera"
    SOS_POLE = "sos_pole"
    CROWD_SENSOR = "crowd_sensor"
    ENVIRONMENTAL_SENSOR = "environmental_sensor"

class DeviceStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"

# Pydantic Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    role: UserRole
    assigned_zones: List[str] = []
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
    description: str
    area_code: str
    coordinates: Optional[Dict[str, Any]] = None
    capacity: int
    current_occupancy: int = 0
    zone_manager_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ZoneCreate(BaseModel):
    name: str
    description: str
    area_code: str
    capacity: int
    zone_manager_id: Optional[str] = None

class Device(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    name: str
    device_type: DeviceType
    zone_id: str
    location: str
    status: DeviceStatus = DeviceStatus.ONLINE
    last_ping: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeviceCreate(BaseModel):
    device_id: str
    name: str
    device_type: DeviceType
    zone_id: str
    location: str

class Incident(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    incident_type: IncidentType
    zone_id: str
    device_id: Optional[str] = None
    severity: int = Field(ge=1, le=5)  # 1-5 scale
    status: IncidentStatus = IncidentStatus.OPEN
    reported_by: str  # user_id
    assigned_to: Optional[str] = None  # user_id
    location: str
    coordinates: Optional[Dict[str, Any]] = None
    attachments: List[str] = []  # file URLs
    notes: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

class IncidentCreate(BaseModel):
    title: str
    description: str
    incident_type: IncidentType
    zone_id: str
    device_id: Optional[str] = None
    severity: int = Field(ge=1, le=5)
    location: str

class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    alert_type: str
    severity: int = Field(ge=1, le=5)
    zone_ids: List[str] = []  # Empty for city-wide alerts
    created_by: str  # user_id
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None

class AlertCreate(BaseModel):
    title: str
    message: str
    alert_type: str
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
    # Check if user already exists
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user = User(**user_dict)
    
    # Store user with hashed password
    user_doc = user.dict()
    user_doc["password"] = hashed_password
    await db.users.insert_one(user_doc)
    
    # Create access token
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
    
    # Update last login
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
    if current_user.role != UserRole.MASTER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view users")
    
    users = await db.users.find().to_list(length=None)
    return [User(**user) for user in users]

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MASTER_ADMIN:
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
    if current_user.role == UserRole.MASTER_ADMIN:
        zones = await db.zones.find().to_list(length=None)
    else:
        zones = await db.zones.find({"id": {"$in": current_user.assigned_zones}}).to_list(length=None)
    
    return [Zone(**zone) for zone in zones]

@api_router.post("/zones", response_model=Zone)
async def create_zone(zone_data: ZoneCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MASTER_ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to create zones")
    
    zone = Zone(**zone_data.dict())
    await db.zones.insert_one(zone.dict())
    return zone

# Device management routes
@api_router.get("/devices", response_model=List[Device])
async def get_devices(zone_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    
    if current_user.role != UserRole.MASTER_ADMIN:
        query["zone_id"] = {"$in": current_user.assigned_zones}
    
    if zone_id:
        query["zone_id"] = zone_id
    
    devices = await db.devices.find(query).to_list(length=None)
    return [Device(**device) for device in devices]

@api_router.post("/devices", response_model=Device)
async def create_device(device_data: DeviceCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(status_code=403, detail="Not authorized to create devices")
    
    # Check if user can access this zone
    if current_user.role != UserRole.MASTER_ADMIN and device_data.zone_id not in current_user.assigned_zones:
        raise HTTPException(status_code=403, detail="Not authorized to create devices in this zone")
    
    device = Device(**device_data.dict())
    await db.devices.insert_one(device.dict())
    return device

# Incident management routes
@api_router.get("/incidents", response_model=List[Incident])
async def get_incidents(zone_id: Optional[str] = None, status: Optional[IncidentStatus] = None, current_user: User = Depends(get_current_user)):
    query = {}
    
    if current_user.role != UserRole.MASTER_ADMIN:
        query["zone_id"] = {"$in": current_user.assigned_zones}
    
    if zone_id:
        query["zone_id"] = zone_id
    
    if status:
        query["status"] = status
    
    incidents = await db.incidents.find(query).sort("created_at", -1).to_list(length=None)
    return [Incident(**incident) for incident in incidents]

@api_router.post("/incidents", response_model=Incident)
async def create_incident(incident_data: IncidentCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.VIEWER:
        raise HTTPException(status_code=403, detail="Not authorized to create incidents")
    
    incident_dict = incident_data.dict()
    incident_dict["reported_by"] = current_user.id
    incident = Incident(**incident_dict)
    
    await db.incidents.insert_one(incident.dict())
    return incident

@api_router.put("/incidents/{incident_id}", response_model=Incident)
async def update_incident(incident_id: str, update_data: IncidentUpdate, current_user: User = Depends(get_current_user)):
    incident = await db.incidents.find_one({"id": incident_id})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Check authorization
    if current_user.role != UserRole.MASTER_ADMIN and incident["zone_id"] not in current_user.assigned_zones:
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
        update_dict = {"$push": {"notes": note}, "$set": update_dict}
        await db.incidents.update_one({"id": incident_id}, update_dict)
    else:
        await db.incidents.update_one({"id": incident_id}, {"$set": update_dict})
    
    updated_incident = await db.incidents.find_one({"id": incident_id})
    return Incident(**updated_incident)

# Alert management routes
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(active_only: bool = True, current_user: User = Depends(get_current_user)):
    query = {}
    if active_only:
        query["is_active"] = True
        query["$or"] = [
            {"expires_at": {"$gt": datetime.now(timezone.utc)}},
            {"expires_at": None}
        ]
    
    # Filter by zones for non-admin users
    if current_user.role != UserRole.MASTER_ADMIN:
        query["$or"] = [
            {"zone_ids": {"$size": 0}},  # City-wide alerts
            {"zone_ids": {"$in": current_user.assigned_zones}}
        ]
    
    alerts = await db.alerts.find(query).sort("created_at", -1).to_list(length=None)
    return [Alert(**alert) for alert in alerts]

@api_router.post("/alerts", response_model=Alert)
async def create_alert(alert_data: AlertCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.MASTER_ADMIN, UserRole.ZONE_MANAGER]:
        raise HTTPException(status_code=403, detail="Not authorized to create alerts")
    
    alert_dict = alert_data.dict()
    alert_dict["created_by"] = current_user.id
    alert = Alert(**alert_dict)
    
    await db.alerts.insert_one(alert.dict())
    return alert

# Analytics routes
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user)):
    zone_filter = {}
    if current_user.role != UserRole.MASTER_ADMIN:
        zone_filter = {"zone_id": {"$in": current_user.assigned_zones}}
    
    # Get statistics
    total_incidents = await db.incidents.count_documents(zone_filter)
    open_incidents = await db.incidents.count_documents({**zone_filter, "status": {"$ne": IncidentStatus.RESOLVED}})
    total_devices = await db.devices.count_documents(zone_filter)
    online_devices = await db.devices.count_documents({**zone_filter, "status": DeviceStatus.ONLINE})
    
    # Recent incidents
    recent_incidents = await db.incidents.find(zone_filter).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "total_incidents": total_incidents,
        "open_incidents": open_incidents,
        "total_devices": total_devices,
        "online_devices": online_devices,
        "device_uptime": round((online_devices / total_devices * 100) if total_devices > 0 else 0, 1),
        "recent_incidents": [Incident(**incident) for incident in recent_incidents]
    }

# System health routes
@api_router.get("/system/health")
async def get_system_health():
    # Simulate system metrics
    return {
        "status": "healthy",
        "uptime": "99.9%",
        "cpu_usage": f"{random.randint(15, 45)}%",
        "memory_usage": f"{random.randint(20, 60)}%",
        "network_status": "good",
        "database_status": "connected",
        "active_connections": random.randint(50, 150),
        "last_backup": datetime.now(timezone.utc) - timedelta(hours=6)
    }

# Initialize sample data
@api_router.post("/init/sample-data")
async def initialize_sample_data():
    # Create master admin user
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = User(
            username="admin",
            email="admin@cityhub.com",
            role=UserRole.MASTER_ADMIN,
            assigned_zones=[]
        )
        admin_doc = admin_user.dict()
        admin_doc["password"] = get_password_hash("admin123")
        await db.users.insert_one(admin_doc)
    
    # Create sample zones
    zones_exist = await db.zones.count_documents({})
    if zones_exist == 0:
        sample_zones = [
            Zone(name="Temple Zone 1", description="Main temple complex area", area_code="TZ1", capacity=5000),
            Zone(name="Temple Zone 2", description="Secondary temple area", area_code="TZ2", capacity=3000),
            Zone(name="Market Area", description="Commercial and shopping zone", area_code="MA1", capacity=2000),
            Zone(name="Ghat Zone", description="River bank and bathing area", area_code="GZ1", capacity=8000),
            Zone(name="Parking Zone", description="Vehicle parking area", area_code="PZ1", capacity=1000),
        ]
        
        for zone in sample_zones:
            await db.zones.insert_one(zone.dict())
    
    # Create sample devices
    devices_exist = await db.devices.count_documents({})
    if devices_exist == 0:
        zones = await db.zones.find().to_list(None)
        device_types = [DeviceType.CAMERA, DeviceType.SOS_POLE, DeviceType.CROWD_SENSOR]
        
        for zone in zones:
            for i, device_type in enumerate(device_types):
                device = Device(
                    device_id=f"{zone['area_code']}-{device_type.value}-{i+1}",
                    name=f"{zone['name']} {device_type.value.replace('_', ' ').title()} {i+1}",
                    device_type=device_type,
                    zone_id=zone["id"],
                    location=f"{zone['name']} - Location {i+1}",
                    status=random.choice([DeviceStatus.ONLINE, DeviceStatus.ONLINE, DeviceStatus.OFFLINE])
                )
                await db.devices.insert_one(device.dict())
    
    return {"message": "Sample data initialized successfully"}

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