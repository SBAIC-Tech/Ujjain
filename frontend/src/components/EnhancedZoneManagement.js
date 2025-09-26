import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { 
  MapPin, 
  Users,
  RefreshCw,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  Camera,
  Activity,
  TrendingUp,
  Building2,
  Calendar,
  User
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

const EnhancedZoneManagement = ({ userRole }) => {
  const [zones, setZones] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const zoneTypeColors = {
    'Religious': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
    'Procession/Bathing': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'Transit': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'Accommodation': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
    'Parking': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
    'Commercial': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [zonesData, incidentsData, devicesData] = await Promise.all([
        apiCall('/zones'),
        apiCall('/incidents'),
        apiCall('/devices')
      ]);
      
      setZones(zonesData);
      setIncidents(incidentsData);
      setDevices(devicesData);
    } catch (error) {
      toast.error("Failed to fetch zone data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getZoneStats = (zone) => {
    const zoneIncidents = incidents.filter(i => i.zone_id === zone.id);
    const zoneDevices = devices.filter(d => d.zone_id === zone.id);
    const openIncidents = zoneIncidents.filter(i => i.status !== 'Resolved');
    const onlineDevices = zoneDevices.filter(d => d.status === 'Online');
    
    return {
      totalDevices: zoneDevices.length,
      onlineDevices: onlineDevices.length,
      totalIncidents: zoneIncidents.length,
      openIncidents: openIncidents.length,
      deviceUptime: zoneDevices.length > 0 ? Math.round((onlineDevices.length / zoneDevices.length) * 100) : 0,
      occupancyRate: Math.round((zone.density / zone.capacity) * 100)
    };
  };

  const getZoneHealthStatus = (zone) => {
    const stats = getZoneStats(zone);
    const { openIncidents, deviceUptime, occupancyRate } = stats;
    
    if (openIncidents > 1 || deviceUptime < 70 || occupancyRate > 90) {
      return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100', border: 'border-red-300', label: 'Critical' };
    }
    
    if (openIncidents > 0 || deviceUptime < 90 || occupancyRate > 70) {
      return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100', border: 'border-yellow-300', label: 'Warning' };
    }
    
    return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-100', border: 'border-green-300', label: 'Good' };
  };

  const filteredZones = zones.filter(zone => 
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.area_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.zone_type.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Zone Management</h2>
          <p className="text-slate-600">Monitor and manage city zones with real-time analytics</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Zones</p>
                <p className="text-3xl font-bold text-blue-900">{zones.length}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Capacity</p>
                <p className="text-3xl font-bold text-green-900">
                  {zones.reduce((sum, zone) => sum + zone.capacity, 0).toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Current Occupancy</p>
                <p className="text-3xl font-bold text-purple-900">
                  {zones.reduce((sum, zone) => sum + zone.density, 0).toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Active Incidents</p>
                <p className="text-3xl font-bold text-orange-900">
                  {incidents.filter(i => i.status !== 'Resolved').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search zones by name, code, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredZones.map((zone) => {
          const stats = getZoneStats(zone);
          const health = getZoneHealthStatus(zone);
          const typeConfig = zoneTypeColors[zone.zone_type] || zoneTypeColors['Commercial'];
          
          return (
            <Card 
              key={zone.id} 
              className={`hover:shadow-lg transition-all cursor-pointer ${health.border} ${health.bgColor}`}
              onClick={() => {
                setSelectedZone(zone);
                setShowDetailsDialog(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{zone.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {zone.area_code}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={`${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}>
                        {zone.zone_type}
                      </Badge>
                      <Badge variant="outline" className={`${health.bgColor} ${health.color} ${health.border}`}>
                        {health.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-600">Occupancy</span>
                    </div>
                    <p className="font-bold text-lg">
                      {Math.round((zone.density / zone.capacity) * 100)}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {zone.density.toLocaleString()} / {zone.capacity.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="bg-white p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-green-600" />
                      <span className="text-slate-600">Cameras</span>
                    </div>
                    <p className="font-bold text-lg">{zone.camera_count}</p>
                    <p className="text-xs text-slate-500">
                      {stats.deviceUptime}% online
                    </p>
                  </div>
                </div>

                {/* Density Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Crowd Density</span>
                    <span className="font-medium">{zone.density.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        stats.occupancyRate >= 90 ? 'bg-red-500' :
                        stats.occupancyRate >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Incidents & Status */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600">Incidents:</span>
                    <span className={`ml-2 font-medium ${stats.openIncidents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.openIncidents > 0 ? `${stats.openIncidents} Open` : 'All Clear'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Devices:</span>
                    <span className={`ml-2 font-medium ${stats.deviceUptime < 90 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {stats.onlineDevices}/{stats.totalDevices}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedZone(zone);
                      setShowDetailsDialog(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
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
            <p className="text-slate-500">No zones match your search criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Zone Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Zone Details - {selectedZone?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedZone && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Zone Code</Label>
                  <p className="text-xl font-bold text-slate-900">{selectedZone.area_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Zone Type</Label>
                  <p className="text-slate-900">{selectedZone.zone_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Health Status</Label>
                  <div className="mt-1">
                    {(() => {
                      const health = getZoneHealthStatus(selectedZone);
                      return (
                        <Badge variant="outline" className={`${health.bgColor} ${health.color} ${health.border}`}>
                          {health.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              {(() => {
                const stats = getZoneStats(selectedZone);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-2xl font-bold text-blue-900">{selectedZone.capacity.toLocaleString()}</p>
                      <p className="text-sm text-blue-700">Max Capacity</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-2xl font-bold text-purple-900">{selectedZone.density.toLocaleString()}</p>
                      <p className="text-sm text-purple-700">Current Density</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-900">{selectedZone.camera_count}</p>
                      <p className="text-sm text-green-700">Total Cameras</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-2xl font-bold text-orange-900">{stats.openIncidents}</p>
                      <p className="text-sm text-orange-700">Open Incidents</p>
                    </div>
                  </div>
                );
              })()}

              {/* Occupancy Progress */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium text-slate-600">Occupancy Rate</Label>
                  <span className="text-sm font-medium">{Math.round((selectedZone.density / selectedZone.capacity) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all ${
                      (selectedZone.density / selectedZone.capacity) >= 0.9 ? 'bg-red-500' :
                      (selectedZone.density / selectedZone.capacity) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((selectedZone.density / selectedZone.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Recent Incidents */}
              <div>
                <Label className="text-sm font-medium text-slate-600">Recent Incidents</Label>
                <div className="mt-2 space-y-2">
                  {incidents.filter(i => i.zone_id === selectedZone.id).slice(0, 3).map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                      <div>
                        <p className="font-medium text-slate-900">{incident.incident_id}</p>
                        <p className="text-sm text-slate-600">{incident.title}</p>
                      </div>
                      <Badge variant={incident.status === 'Resolved' ? 'default' : 'destructive'}>
                        {incident.status}
                      </Badge>
                    </div>
                  ))}
                  {incidents.filter(i => i.zone_id === selectedZone.id).length === 0 && (
                    <div className="text-center py-4 text-slate-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      No incidents in this zone
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Description</Label>
                  <p className="text-slate-900 mt-1">{selectedZone.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Created</Label>
                  <p className="text-slate-900 mt-1">{new Date(selectedZone.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {userRole === 'Admin' && (
                  <Button variant="outline">
                    <Building2 className="w-4 h-4 mr-2" />
                    Manage Zone
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

export default EnhancedZoneManagement;