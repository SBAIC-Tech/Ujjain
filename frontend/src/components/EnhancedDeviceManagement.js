import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
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
  const { colors } = useTheme();
  const { data, updateDeviceStatus } = useData();
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
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
    'CCTV': Camera,
    'Drone': Monitor,
    'Sensor': Activity,
    'SOS': AlertTriangle
  };

  // Load data instantly from context
  useEffect(() => {
    if (data) {
      setDevices(data.devices);
      setZones(data.zones);
      
      // Calculate stats from context data
      const contextStats = {
        total: data.devices.length,
        online: data.devices.filter(d => d.status === 'online').length,
        offline: data.devices.filter(d => d.status === 'offline').length,
        good: data.devices.filter(d => d.health >= 85).length,
        warning: data.devices.filter(d => d.health >= 60 && d.health < 85).length,
        fault: data.devices.filter(d => d.health < 60).length
      };
      setStats(contextStats);
    }
  }, [data]);

  const handleRebootDevice = async (deviceId) => {
    try {
      // Update context immediately
      updateDeviceStatus(deviceId, 'online');
      
      // Also call API for persistence
      await apiCall(`/devices/${deviceId}/reboot`, { method: 'PUT' });
      toast.success(`Device ${deviceId} rebooted successfully`);
    } catch (error) {
      toast.error("Failed to reboot device");
    }
  };

  const getStatusBadge = (status) => {
    const config = status === 'online' ? 
      { bg: colors.success, text: colors.white, icon: Wifi } :
      { bg: colors.danger, text: colors.white, icon: WifiOff };
    const Icon = config.icon;
    
    return (
      <Badge 
        className="border-0 font-medium"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status === 'online' ? 'Online' : 'Offline'}
      </Badge>
    );
  };

  const getHealthBadge = (health) => {
    const getHealthColor = () => {
      if (health >= 85) return { bg: colors.success, text: colors.white, label: 'Good' };
      if (health >= 60) return { bg: colors.warning, text: colors.white, label: 'Warning' };
      return { bg: colors.danger, text: colors.white, label: 'Fault' };
    };
    
    const config = getHealthColor();
    
    return (
      <Badge 
        className="border-0 font-medium"
        style={{ backgroundColor: config.bg, color: config.text }}
      >
        {config.label}
      </Badge>
    );
  };

  const getDeviceIcon = (deviceType) => {
    const IconComponent = deviceTypeIcons[deviceType] || Camera;
    return <IconComponent className="w-5 h-5" />;
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = !filters.search || 
      device.id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      device.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      device.location?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === 'all' || device.type === filters.type;
    const matchesStatus = filters.status === 'all' || device.status === filters.status;
    const matchesHealth = filters.health === 'all' || 
      (filters.health === 'good' && device.health >= 85) ||
      (filters.health === 'warning' && device.health >= 60 && device.health < 85) ||
      (filters.health === 'fault' && device.health < 60);
    
    return matchesSearch && matchesType && matchesStatus && matchesHealth;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw 
          className="w-8 h-8 animate-spin"
          style={{ color: colors.buttonPrimary }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-6 rounded-lg"
        style={{ backgroundColor: colors.backgroundAlt }}
      >
        <div>
          <h2 
            className="text-3xl font-bold transition-colors duration-300"
            style={{ color: colors.heading }}
          >
            Devices & Cameras
          </h2>
          <p 
            className="transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            Monitor device health and manage surveillance infrastructure
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          style={{ 
            borderColor: colors.buttonPrimary,
            color: colors.buttonPrimary,
            backgroundColor: 'transparent'
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="text-center">
              <p 
                className="text-2xl font-bold transition-colors duration-300"
                style={{ color: colors.heading }}
              >
                {stats.total}
              </p>
              <p 
                className="text-sm transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                Total Devices
              </p>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="text-center">
              <p 
                className="text-2xl font-bold"
                style={{ color: colors.success }}
              >
                {stats.online}
              </p>
              <p 
                className="text-sm transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                Online
              </p>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="text-center">
              <p 
                className="text-2xl font-bold"
                style={{ color: colors.danger }}
              >
                {stats.offline}
              </p>
              <p 
                className="text-sm transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                Offline
              </p>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="text-center">
              <p 
                className="text-2xl font-bold"
                style={{ color: colors.success }}
              >
                {stats.good}
              </p>
              <p 
                className="text-sm transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                Good Health
              </p>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="text-center">
              <p 
                className="text-2xl font-bold"
                style={{ color: colors.warning }}
              >
                {stats.warning}
              </p>
              <p 
                className="text-sm transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                Warnings
              </p>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="text-center">
              <p 
                className="text-2xl font-bold"
                style={{ color: colors.danger }}
              >
                {stats.fault}
              </p>
              <p 
                className="text-sm transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                Faults
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
        <CardHeader style={{ backgroundColor: colors.cardAlt }}>
          <CardTitle 
            className="text-lg flex items-center gap-2 transition-colors duration-300"
            style={{ color: colors.heading }}
          >
            <Filter className="w-5 h-5" />
            Filter Devices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Search</Label>
              <div className="relative">
                <Search 
                  className="absolute left-2 top-2.5 h-4 w-4"
                  style={{ color: colors.textMuted }}
                />
                <Input
                  placeholder="Search devices..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                  className="pl-8"
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Type</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({...prev, type: value}))}
              >
                <SelectTrigger 
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="CCTV">CCTV Camera</SelectItem>
                  <SelectItem value="Drone">Drone</SelectItem>
                  <SelectItem value="Sensor">Sensor</SelectItem>
                  <SelectItem value="SOS">SOS Point</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}
              >
                <SelectTrigger 
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Health</Label>
              <Select 
                value={filters.health} 
                onValueChange={(value) => setFilters(prev => ({...prev, health: value}))}
              >
                <SelectTrigger 
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <SelectValue placeholder="All health" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all">All health</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="fault">Fault</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ zone: 'all', type: 'all', status: 'all', health: 'all', search: '' })}
                className="w-full"
                style={{ 
                  borderColor: colors.buttonPrimary,
                  color: colors.buttonPrimary,
                  backgroundColor: 'transparent'
                }}
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
              device.health < 60 ? 'border-l-4' : ''
            }`}
            style={{ 
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              borderLeftColor: device.health < 60 ? colors.danger : 
                             device.health < 85 ? colors.warning : colors.cardBorder
            }}
            onClick={() => {
              setSelectedDevice(device);
              setShowDetailsDialog(true);
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: colors.surfaceVariant }}
                  >
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <CardTitle 
                      className="text-lg transition-colors duration-300"
                      style={{ color: colors.heading }}
                    >
                      {device.id}
                    </CardTitle>
                    <CardDescription style={{ color: colors.textSecondary }}>
                      {device.name}
                    </CardDescription>
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
                  <span style={{ color: colors.textSecondary }}>Type:</span>
                  <p 
                    className="font-medium transition-colors duration-300"
                    style={{ color: colors.text }}
                  >
                    {device.type}
                  </p>
                </div>
                <div>
                  <span style={{ color: colors.textSecondary }}>Location:</span>
                  <p 
                    className="font-medium transition-colors duration-300"
                    style={{ color: colors.text }}
                  >
                    {device.location}
                  </p>
                </div>
                <div>
                  <span style={{ color: colors.textSecondary }}>Health:</span>
                  <p 
                    className="font-medium transition-colors duration-300"
                    style={{ color: colors.text }}
                  >
                    {device.health}%
                  </p>
                </div>
                <div>
                  <span style={{ color: colors.textSecondary }}>Last Ping:</span>
                  <p 
                    className="font-medium transition-colors duration-300"
                    style={{ color: colors.text }}
                  >
                    {new Date(device.lastPing).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: 'transparent'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDevice(device);
                    setShowDetailsDialog(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                
                {device.status === 'offline' && userRole !== 'viewer' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRebootDevice(device.id);
                    }}
                    className="flex-1"
                    style={{ 
                      borderColor: colors.warning,
                      color: colors.warning,
                      backgroundColor: 'transparent'
                    }}
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
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="text-center py-12">
            <Camera 
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: colors.textMuted }}
            />
            <h3 
              className="text-lg font-medium mb-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              No devices found
            </h3>
            <p style={{ color: colors.textMuted }}>
              No devices match the current filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Device Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent 
          className="sm:max-w-[600px]"
          style={{ 
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          <DialogHeader>
            <DialogTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <Camera className="w-5 h-5" />
              Device Details - {selectedDevice?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDevice && (
            <div className="space-y-4">
              {/* Header Info */}
              <div 
                className="flex items-center gap-4 p-4 rounded-lg"
                style={{ backgroundColor: colors.surfaceVariant }}
              >
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.surface }}
                >
                  {getDeviceIcon(selectedDevice.type)}
                </div>
                <div className="flex-1">
                  <h3 
                    className="font-semibold transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    {selectedDevice.name}
                  </h3>
                  <p style={{ color: colors.textSecondary }}>
                    {selectedDevice.id}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(selectedDevice.status)}
                  {getHealthBadge(selectedDevice.health)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Device Type
                  </Label>
                  <p style={{ color: colors.text }}>
                    {selectedDevice.type}
                  </p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Location
                  </Label>
                  <p style={{ color: colors.text }}>
                    {selectedDevice.location}
                  </p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Health Status
                  </Label>
                  <p style={{ color: colors.text }}>
                    {selectedDevice.health}%
                  </p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Last Ping
                  </Label>
                  <p style={{ color: colors.text }}>
                    {new Date(selectedDevice.lastPing).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Health Status Alert */}
              {selectedDevice.health < 85 && (
                <div 
                  className="p-3 rounded border-l-4"
                  style={{ 
                    backgroundColor: selectedDevice.health < 60 ? 
                      `${colors.danger}20` : `${colors.warning}20`,
                    borderLeftColor: selectedDevice.health < 60 ? 
                      colors.danger : colors.warning
                  }}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle 
                      className="w-4 h-4"
                      style={{ 
                        color: selectedDevice.health < 60 ? 
                          colors.danger : colors.warning
                      }}
                    />
                    <span 
                      className="font-medium"
                      style={{ color: colors.text }}
                    >
                      Health Alert
                    </span>
                  </div>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: colors.textSecondary }}
                  >
                    {selectedDevice.health < 60 ? 
                      'Device is experiencing issues and requires immediate attention.' :
                      'Device is operational but showing warning signs. Monitoring recommended.'
                    }
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: colors.border }}>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetailsDialog(false)}
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: 'transparent'
                  }}
                >
                  Close
                </Button>
                
                {userRole !== 'viewer' && (
                  <>
                    {selectedDevice.status === 'offline' && (
                      <Button 
                        onClick={() => {
                          handleRebootDevice(selectedDevice.id);
                          setShowDetailsDialog(false);
                        }}
                        style={{ 
                          backgroundColor: colors.warning,
                          color: colors.white,
                          border: 'none'
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reboot Device
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline"
                      style={{ 
                        borderColor: colors.buttonPrimary,
                        color: colors.buttonPrimary,
                        backgroundColor: 'transparent'
                      }}
                    >
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