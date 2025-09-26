import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Camera, 
  Activity,
  RefreshCw,
  Filter,
  Search,
  Monitor,
  Wifi,
  WifiOff,
  AlertTriangle,
  Wrench,
  MapPin,
  Eye,
  Settings
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

const DeviceManagement = ({ userRole }) => {
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState({
    zone_id: '',
    device_type: '',
    status: '',
    search: ''
  });

  const [newDevice, setNewDevice] = useState({
    device_id: '',
    name: '',
    device_type: '',
    zone_id: '',
    location: ''
  });

  const deviceTypes = [
    { value: 'camera', label: 'Camera', icon: Camera },
    { value: 'sos_pole', label: 'SOS Pole', icon: AlertTriangle },
    { value: 'crowd_sensor', label: 'Crowd Sensor', icon: Activity },
    { value: 'environmental_sensor', label: 'Environmental Sensor', icon: Monitor }
  ];

  const statusOptions = [
    { value: 'online', label: 'Online', icon: Wifi, color: 'text-green-600' },
    { value: 'offline', label: 'Offline', icon: WifiOff, color: 'text-red-600' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-yellow-600' },
    { value: 'error', label: 'Error', icon: AlertTriangle, color: 'text-red-600' }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devicesData, zonesData] = await Promise.all([
        apiCall(`/devices?${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))).toString()}`),
        apiCall('/zones')
      ]);
      setDevices(devicesData);
      setZones(zonesData);
    } catch (error) {
      toast.error("Failed to fetch devices data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/devices', {
        method: 'POST',
        body: JSON.stringify(newDevice)
      });
      
      toast.success("Device created successfully");
      setShowCreateDialog(false);
      setNewDevice({
        device_id: '',
        name: '',
        device_type: '',
        zone_id: '',
        location: ''
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create device");
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    if (!statusConfig) return null;
    
    const Icon = statusConfig.icon;
    
    return (
      <Badge 
        variant={status === 'online' ? 'default' : status === 'maintenance' ? 'secondary' : 'destructive'}
        className={status === 'online' ? 'bg-green-600' : ''}
      >
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getDeviceIcon = (deviceType) => {
    const typeConfig = deviceTypes.find(t => t.value === deviceType);
    const Icon = typeConfig?.icon || Monitor;
    return <Icon className="w-5 h-5" />;
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = !filters.search || 
      device.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      device.device_id.toLowerCase().includes(filters.search.toLowerCase()) ||
      device.location.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
  });

  const generateDeviceId = () => {
    const zone = zones.find(z => z.id === newDevice.zone_id);
    const typeAbbr = newDevice.device_type.toUpperCase().substring(0, 3);
    const zoneCode = zone?.area_code || 'UNK';
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${zoneCode}-${typeAbbr}-${randomNum}`;
  };

  // Auto-generate device ID when zone and type are selected
  useEffect(() => {
    if (newDevice.zone_id && newDevice.device_type) {
      setNewDevice(prev => ({...prev, device_id: generateDeviceId()}));
    }
  }, [newDevice.zone_id, newDevice.device_type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {userRole === 'master_admin' ? 'All Devices & Cameras' : 'Zone Devices & Cameras'}
          </h2>
          <p className="text-slate-600">Monitor and manage security devices</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {userRole !== 'viewer' && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="add-device-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Device</DialogTitle>
                  <DialogDescription>
                    Register a new device to the monitoring system
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDevice} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="device_type">Device Type</Label>
                      <Select 
                        value={newDevice.device_type} 
                        onValueChange={(value) => setNewDevice(prev => ({...prev, device_type: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select device type" />
                        </SelectTrigger>
                        <SelectContent>
                          {deviceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zone_id">Zone</Label>
                      <Select 
                        value={newDevice.zone_id} 
                        onValueChange={(value) => setNewDevice(prev => ({...prev, zone_id: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id}>
                              {zone.name} ({zone.area_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="device_id">Device ID</Label>
                    <Input
                      id="device_id"
                      value={newDevice.device_id}
                      onChange={(e) => setNewDevice(prev => ({...prev, device_id: e.target.value}))}
                      placeholder="Auto-generated or custom ID"
                      required
                    />
                    <p className="text-xs text-slate-500">
                      Device ID is auto-generated when zone and type are selected
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Device Name</Label>
                    <Input
                      id="name"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice(prev => ({...prev, name: e.target.value}))}
                      placeholder="Descriptive name for the device"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newDevice.location}
                      onChange={(e) => setNewDevice(prev => ({...prev, location: e.target.value}))}
                      placeholder="Specific location within zone"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="submit-device-btn">
                      Add Device
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Devices</p>
                <p className="text-2xl font-bold text-slate-900">{devices.length}</p>
              </div>
              <Monitor className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {devices.filter(d => d.status === 'online').length}
                </p>
              </div>
              <Wifi className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Offline</p>
                <p className="text-2xl font-bold text-red-600">
                  {devices.filter(d => d.status === 'offline').length}
                </p>
              </div>
              <WifiOff className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Uptime</p>
                <p className="text-2xl font-bold text-slate-900">
                  {devices.length > 0 ? Math.round((devices.filter(d => d.status === 'online').length / devices.length) * 100) : 0}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search devices..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select 
                value={filters.zone_id} 
                onValueChange={(value) => setFilters(prev => ({...prev, zone_id: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-zones" value="">All zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Device Type</Label>
              <Select 
                value={filters.device_type} 
                onValueChange={(value) => setFilters(prev => ({...prev, device_type: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-types" value="">All types</SelectItem>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-statuses" value="">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ zone_id: '', device_type: '', status: '', search: '' })}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map((device) => (
          <Card key={device.id} className="hover:shadow-lg transition-shadow" data-testid={`device-${device.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {getDeviceIcon(device.device_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <CardDescription>{device.device_id}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(device.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Type:</span>
                  <span className="font-medium">
                    {deviceTypes.find(t => t.value === device.device_type)?.label}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-600">Zone:</span>
                  <span className="font-medium">
                    {zones.find(z => z.id === device.zone_id)?.name || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-600">Location:</span>
                  <span className="font-medium">{device.location}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-600">Last Ping:</span>
                  <span className="font-medium">
                    {new Date(device.last_ping).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDevice(device);
                    setShowDetailsDialog(true);
                  }}
                  className="flex-1"
                  data-testid={`view-device-${device.id}`}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                
                {userRole !== 'viewer' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    data-testid={`settings-device-${device.id}`}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Monitor className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No devices found</h3>
            <p className="text-slate-500 mb-4">
              {Object.values(filters).some(f => f) ? 
                'No devices match the current filters.' : 
                'No devices have been registered yet.'
              }
            </p>
            {userRole !== 'viewer' && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Device
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Device Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
            <DialogDescription>
              View device information and status
            </DialogDescription>
          </DialogHeader>
          
          {selectedDevice && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="p-3 bg-white rounded-lg">
                  {getDeviceIcon(selectedDevice.device_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{selectedDevice.name}</h3>
                  <p className="text-slate-600">{selectedDevice.device_id}</p>
                </div>
                {getStatusBadge(selectedDevice.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Device Type</Label>
                  <p className="text-slate-900">
                    {deviceTypes.find(t => t.value === selectedDevice.device_type)?.label}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Zone</Label>
                  <p className="text-slate-900">
                    {zones.find(z => z.id === selectedDevice.zone_id)?.name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Location</Label>
                  <p className="text-slate-900">{selectedDevice.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDevice.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Last Ping</Label>
                  <p className="text-slate-900">{new Date(selectedDevice.last_ping).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Created</Label>
                  <p className="text-slate-900">{new Date(selectedDevice.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {userRole !== 'viewer' && (
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeviceManagement;