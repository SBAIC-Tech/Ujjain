import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { 
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
  Settings,
  CheckCircle,
  Clock,
  Zap,
  RotateCcw
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

const EnhancedDeviceManagement = ({ userRole }) => {
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState({
    zone: 'all',
    type: 'all',
    status: 'all',
    health: 'all',
    search: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    good: 0,
    warning: 0,
    fault: 0
  });

  const deviceTypeIcons = {
    'Fixed': Camera,
    'PTZ': Monitor
  };

  const healthColors = {
    'Good': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'Warning': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    'Fault': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
  };

  const statusColors = {
    'Online': { bg: 'bg-green-500', text: 'text-white' },
    'Offline': { bg: 'bg-red-500', text: 'text-white' }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.zone && filters.zone !== 'all') queryParams.set('zone_id', filters.zone);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/devices?${queryString}` : '/devices';
      
      const [devicesData, zonesData] = await Promise.all([
        apiCall(endpoint),
        apiCall('/zones')
      ]);
      
      setDevices(devicesData);
      setZones(zonesData);
      
      // Calculate stats
      setStats({
        total: devicesData.length,
        online: devicesData.filter(d => d.status === 'Online').length,
        offline: devicesData.filter(d => d.status === 'Offline').length,
        good: devicesData.filter(d => d.health === 'Good').length,
        warning: devicesData.filter(d => d.health === 'Warning').length,
        fault: devicesData.filter(d => d.health === 'Fault').length
      });
      
    } catch (error) {
      toast.error("Failed to fetch device data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRebootDevice = async (deviceId) => {
    try {
      await apiCall(`/devices/${deviceId}/reboot`, { method: 'PUT' });
      toast.success(`Device ${deviceId} rebooted successfully`);
      fetchData();
    } catch (error) {
      toast.error("Failed to reboot device");
    }
  };

  const getStatusBadge = (status) => {
    const config = statusColors[status] || statusColors['Offline'];
    const Icon = status === 'Online' ? Wifi : WifiOff;
    
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getHealthBadge = (health) => {
    const config = healthColors[health] || healthColors['Fault'];
    
    return (
      <Badge variant="outline" className={`${config.bg} ${config.text} ${config.border}`}>
        {health}
      </Badge>
    );
  };

  const getDeviceIcon = (deviceType) => {
    const IconComponent = deviceTypeIcons[deviceType] || Camera;
    return <IconComponent className="w-5 h-5" />;
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = !filters.search || 
      device.device_id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      device.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      device.zone_name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === 'all' || device.device_type === filters.type;
    const matchesStatus = filters.status === 'all' || device.status === filters.status;
    const matchesHealth = filters.health === 'all' || device.health === filters.health;
    
    return matchesSearch && matchesType && matchesStatus && matchesHealth;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Devices & Cameras</h2>
          <p className="text-slate-600">Monitor device health and manage surveillance infrastructure</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-sm text-blue-700">Total Devices</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900">{stats.online}</p>
              <p className="text-sm text-green-700">Online</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-900">{stats.offline}</p>
              <p className="text-sm text-red-700">Offline</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900">{stats.good}</p>
              <p className="text-sm text-green-700">Good Health</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-900">{stats.warning}</p>
              <p className="text-sm text-yellow-700">Warnings</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-900">{stats.fault}</p>
              <p className="text-sm text-red-700">Faults</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Devices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                value={filters.zone} 
                onValueChange={(value) => setFilters(prev => ({...prev, zone: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-zones" value="all">All zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({...prev, type: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-types" value="all">All types</SelectItem>
                  <SelectItem value="Fixed">Fixed Camera</SelectItem>
                  <SelectItem value="PTZ">PTZ Camera</SelectItem>
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
                  <SelectItem key="all-status" value="all">All statuses</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Health</Label>
              <Select 
                value={filters.health} 
                onValueChange={(value) => setFilters(prev => ({...prev, health: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-health" value="all">All health</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="Fault">Fault</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ zone: 'all', type: 'all', status: 'all', health: 'all', search: '' })}
                className="w-full"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map((device) => (
          <Card 
            key={device.id} 
            className={`hover:shadow-lg transition-shadow cursor-pointer ${
              device.health === 'Fault' ? 'border-red-300 bg-red-50' :
              device.health === 'Warning' ? 'border-yellow-300 bg-yellow-50' : ''
            }`}
            onClick={() => {
              setSelectedDevice(device);
              setShowDetailsDialog(true);
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {getDeviceIcon(device.device_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{device.device_id}</CardTitle>
                    <CardDescription>{device.name}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(device.status)}
                  {getHealthBadge(device.health)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-600">Zone:</span>
                  <p className="font-medium">{device.zone_name}</p>
                </div>
                <div>
                  <span className="text-slate-600">Type:</span>
                  <p className="font-medium">{device.device_type}</p>
                </div>
                <div>
                  <span className="text-slate-600">Location:</span>
                  <p className="font-medium">{device.location}</p>
                </div>
                <div>
                  <span className="text-slate-600">Last Event:</span>
                  <p className="font-medium">{device.last_event || 'None'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600">
                <p>Last checked: {new Date(device.last_checked).toLocaleString()}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDevice(device);
                    setShowDetailsDialog(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                
                {device.status === 'Offline' && userRole !== 'Viewer' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRebootDevice(device.device_id);
                    }}
                    className="flex-1 text-orange-700 border-orange-300 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reboot
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
            <Camera className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No devices found</h3>
            <p className="text-slate-500">No devices match the current filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Device Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Device Details - {selectedDevice?.device_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDevice && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="p-3 bg-white rounded-lg">
                  {getDeviceIcon(selectedDevice.device_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{selectedDevice.name}</h3>
                  <p className="text-slate-600">{selectedDevice.device_id}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(selectedDevice.status)}
                  {getHealthBadge(selectedDevice.health)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Device Type</Label>
                  <p className="text-slate-900">{selectedDevice.device_type} Camera</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Zone</Label>
                  <p className="text-slate-900">{selectedDevice.zone_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Location</Label>
                  <p className="text-slate-900">{selectedDevice.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Last Event</Label>
                  <p className="text-slate-900">{selectedDevice.last_event || 'No recent events'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Last Checked</Label>
                  <p className="text-slate-900">{new Date(selectedDevice.last_checked).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Installed</Label>
                  <p className="text-slate-900">{new Date(selectedDevice.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Health Status */}
              {selectedDevice.health !== 'Good' && (
                <div className={`p-3 rounded border ${healthColors[selectedDevice.health]?.bg} ${healthColors[selectedDevice.health]?.border}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Health Alert</span>
                  </div>
                  <p className="text-sm mt-1">
                    {selectedDevice.health === 'Warning' ? 
                      'Device is operational but showing warning signs. Monitoring recommended.' :
                      'Device is experiencing issues and requires immediate attention.'
                    }
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                
                {userRole !== 'Viewer' && (
                  <>
                    {selectedDevice.status === 'Offline' && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          handleRebootDevice(selectedDevice.device_id);
                          setShowDetailsDialog(false);
                        }}
                        className="text-orange-700 border-orange-300 hover:bg-orange-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reboot Device
                      </Button>
                    )}
                    
                    <Button variant="outline">
                      <Wrench className="w-4 h-4 mr-2" />
                      Schedule Maintenance
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedDeviceManagement;