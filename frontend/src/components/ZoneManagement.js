import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { 
  Plus, 
  MapPin, 
  Users,
  RefreshCw,
  Search,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  Camera,
  Activity
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

const ZoneManagement = ({ userRole }) => {
  const [zones, setZones] = useState([]);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    area_code: '',
    capacity: '',
    zone_manager_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises = [
        apiCall('/zones'),
        apiCall('/devices'),
        apiCall('/incidents')
      ];
      
      // Only fetch users if master admin
      if (userRole === 'master_admin') {
        promises.push(apiCall('/users'));
      }

      const results = await Promise.all(promises);
      setZones(results[0]);
      setDevices(results[1]);
      setIncidents(results[2]);
      
      if (userRole === 'master_admin' && results[3]) {
        setUsers(results[3]);
      }
    } catch (error) {
      toast.error("Failed to fetch zones data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    try {
      const zoneData = {
        ...newZone,
        capacity: parseInt(newZone.capacity)
      };
      
      await apiCall('/zones', {
        method: 'POST',
        body: JSON.stringify(zoneData)
      });
      
      toast.success("Zone created successfully");
      setShowCreateDialog(false);
      setNewZone({
        name: '',
        description: '',
        area_code: '',
        capacity: '',
        zone_manager_id: ''
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create zone");
      console.error(error);
    }
  };

  const getZoneStats = (zoneId) => {
    const zoneDevices = devices.filter(d => d.zone_id === zoneId);
    const zoneIncidents = incidents.filter(i => i.zone_id === zoneId);
    const openIncidents = zoneIncidents.filter(i => i.status !== 'resolved');
    const onlineDevices = zoneDevices.filter(d => d.status === 'online');
    
    return {
      totalDevices: zoneDevices.length,
      onlineDevices: onlineDevices.length,
      totalIncidents: zoneIncidents.length,
      openIncidents: openIncidents.length,
      deviceUptime: zoneDevices.length > 0 ? Math.round((onlineDevices.length / zoneDevices.length) * 100) : 0
    };
  };

  const getZoneHealthStatus = (stats) => {
    const { openIncidents, deviceUptime } = stats;
    
    if (openIncidents > 2 || deviceUptime < 50) {
      return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical' };
    }
    
    if (openIncidents > 0 || deviceUptime < 80) {
      return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Warning' };
    }
    
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100', label: 'Good' };
  };

  const filteredZones = zones.filter(zone => 
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.area_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-2xl font-bold text-slate-900">Zone Management</h2>
          <p className="text-slate-600">Monitor and manage city zones</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {userRole === 'master_admin' && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="create-zone-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Zone
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Zone</DialogTitle>
                  <DialogDescription>
                    Add a new zone to the city management system
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateZone} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Zone Name</Label>
                      <Input
                        id="name"
                        value={newZone.name}
                        onChange={(e) => setNewZone(prev => ({...prev, name: e.target.value}))}
                        placeholder="e.g., Temple Zone 1"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area_code">Area Code</Label>
                      <Input
                        id="area_code"
                        value={newZone.area_code}
                        onChange={(e) => setNewZone(prev => ({...prev, area_code: e.target.value.toUpperCase()}))}
                        placeholder="e.g., TZ1"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newZone.description}
                      onChange={(e) => setNewZone(prev => ({...prev, description: e.target.value}))}
                      placeholder="Describe the zone and its purpose"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={newZone.capacity}
                        onChange={(e) => setNewZone(prev => ({...prev, capacity: e.target.value}))}
                        placeholder="Maximum occupancy"
                        required
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zone_manager_id">Zone Manager</Label>
                      <Select 
                        value={newZone.zone_manager_id} 
                        onValueChange={(value) => setNewZone(prev => ({...prev, zone_manager_id: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="no-manager" value="">No manager assigned</SelectItem>
                          {users.filter(u => u.role === 'zone_manager').map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.username} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="submit-zone-btn">
                      Create Zone
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Zone Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Zones</p>
                <p className="text-2xl font-bold text-slate-900">{zones.length}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Capacity</p>
                <p className="text-2xl font-bold text-slate-900">
                  {zones.reduce((sum, zone) => sum + zone.capacity, 0).toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Devices</p>
                <p className="text-2xl font-bold text-slate-900">{devices.length}</p>
              </div>
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Incidents</p>
                <p className="text-2xl font-bold text-red-600">
                  {incidents.filter(i => i.status !== 'resolved').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search zones by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredZones.map((zone) => {
          const stats = getZoneStats(zone.id);
          const health = getZoneHealthStatus(stats);
          const manager = users.find(u => u.id === zone.zone_manager_id);
          
          return (
            <Card key={zone.id} className="hover:shadow-lg transition-shadow" data-testid={`zone-${zone.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{zone.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mt-1">
                        {zone.area_code}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={`${health.color} ${health.bgColor}`}>
                    {health.label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">{zone.description}</p>
                
                {/* Zone Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Capacity:</span>
                    <span className="font-medium">{zone.capacity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Occupancy:</span>
                    <span className="font-medium">{zone.current_occupancy || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Devices:</span>
                    <span className="font-medium">{stats.totalDevices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Online:</span>
                    <span className="font-medium text-green-600">{stats.onlineDevices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Incidents:</span>
                    <span className="font-medium">{stats.totalIncidents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Open:</span>
                    <span className={`font-medium ${stats.openIncidents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.openIncidents}
                    </span>
                  </div>
                </div>

                {/* Device Uptime Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Device Uptime</span>
                    <span className="font-medium">{stats.deviceUptime}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stats.deviceUptime >= 80 ? 'bg-green-600' : 
                        stats.deviceUptime >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${stats.deviceUptime}%` }}
                    />
                  </div>
                </div>

                {/* Manager Info */}
                {manager && (
                  <div className="text-sm">
                    <span className="text-slate-600">Manager: </span>
                    <span className="font-medium">{manager.username}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedZone(zone);
                      setShowDetailsDialog(true);
                    }}
                    className="flex-1"
                    data-testid={`view-zone-${zone.id}`}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  {userRole === 'master_admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      data-testid={`settings-zone-${zone.id}`}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Settings
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredZones.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No zones found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm ? 
                'No zones match your search criteria.' : 
                'No zones have been created yet.'
              }
            </p>
            {userRole === 'master_admin' && !searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Zone
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Zone Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Zone Details</DialogTitle>
            <DialogDescription>
              Comprehensive zone information and statistics
            </DialogDescription>
          </DialogHeader>
          
          {selectedZone && (
            <div className="space-y-6">
              {/* Zone Header */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{selectedZone.name}</h3>
                  <p className="text-slate-600">{selectedZone.description}</p>
                </div>
                <Badge variant="outline" className="text-lg">
                  {selectedZone.area_code}
                </Badge>
              </div>

              {/* Zone Stats */}
              {(() => {
                const stats = getZoneStats(selectedZone.id);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedZone.capacity.toLocaleString()}</p>
                      <p className="text-sm text-slate-600">Capacity</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.totalDevices}</p>
                      <p className="text-sm text-slate-600">Devices</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{stats.totalIncidents}</p>
                      <p className="text-sm text-slate-600">Total Incidents</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{stats.openIncidents}</p>
                      <p className="text-sm text-slate-600">Open Incidents</p>
                    </div>
                  </div>
                );
              })()}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Zone Manager</Label>
                  <p className="text-slate-900">
                    {users.find(u => u.id === selectedZone.zone_manager_id)?.username || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Created</Label>
                  <p className="text-slate-900">{new Date(selectedZone.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {userRole === 'master_admin' && (
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Zone
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

export default ZoneManagement;