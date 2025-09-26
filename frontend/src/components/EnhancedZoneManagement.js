import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
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
  const { colors } = useTheme();
  const { data } = useData();
  const [zones, setZones] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const zoneTypeColors = {
    'Religious': { bg: `${colors.buttonPrimary}20`, text: colors.buttonPrimary, border: `${colors.buttonPrimary}40` },
    'Waterfront': { bg: `${colors.info}20`, text: colors.info, border: `${colors.info}40` },
    'Commercial': { bg: `${colors.warning}20`, text: colors.warning, border: `${colors.warning}40` },
    'Transit': { bg: `${colors.success}20`, text: colors.success, border: `${colors.success}40` },
    'Accommodation': { bg: `${colors.textSecondary}20`, text: colors.textSecondary, border: `${colors.textSecondary}40` },
    'Parking': { bg: `${colors.textMuted}20`, text: colors.textMuted, border: `${colors.textMuted}40` }
  };

  // Load data instantly from context
  useEffect(() => {
    if (data) {
      setZones(data.zones);
      setIncidents(data.incidents);
      setDevices(data.devices);
    }
  }, [data]);

  const getZoneStats = (zone) => {
    const zoneIncidents = incidents.filter(i => i.location?.includes(zone.name));
    const zoneDevices = devices.filter(d => d.location?.includes(zone.name));
    const openIncidents = zoneIncidents.filter(i => i.status !== 'Resolved');
    const onlineDevices = zoneDevices.filter(d => d.status === 'online');
    
    return {
      totalDevices: zoneDevices.length,
      onlineDevices: onlineDevices.length,
      totalIncidents: zoneIncidents.length,
      openIncidents: openIncidents.length,
      deviceUptime: zoneDevices.length > 0 ? Math.round((onlineDevices.length / zoneDevices.length) * 100) : 0,
      occupancyRate: Math.round((zone.currentOccupancy / zone.capacity) * 100)
    };
  };

  const getZoneHealthStatus = (zone) => {
    const stats = getZoneStats(zone);
    const { openIncidents, deviceUptime, occupancyRate } = stats;
    
    if (openIncidents > 1 || deviceUptime < 70 || occupancyRate > 90) {
      return { status: 'critical', color: colors.danger, bgColor: `${colors.danger}20`, border: `${colors.danger}40`, label: 'Critical' };
    }
    
    if (openIncidents > 0 || deviceUptime < 90 || occupancyRate > 70) {
      return { status: 'warning', color: colors.warning, bgColor: `${colors.warning}20`, border: `${colors.warning}40`, label: 'Warning' };
    }
    
    return { status: 'good', color: colors.success, bgColor: `${colors.success}20`, border: `${colors.success}40`, label: 'Good' };
  };

  const filteredZones = zones.filter(zone => 
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Zone Management
          </h2>
          <p 
            className="transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            Monitor and manage city zones with real-time analytics
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Total Zones
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {zones.length}
                </p>
              </div>
              <MapPin 
                className="w-8 h-8"
                style={{ color: colors.info }}
              />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Total Capacity
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {zones.reduce((sum, zone) => sum + zone.capacity, 0).toLocaleString()}
                </p>
              </div>
              <Users 
                className="w-8 h-8"
                style={{ color: colors.success }}
              />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Current Occupancy
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {zones.reduce((sum, zone) => sum + zone.currentOccupancy, 0).toLocaleString()}
                </p>
              </div>
              <Activity 
                className="w-8 h-8"
                style={{ color: colors.buttonPrimary }}
              />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Active Incidents
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {incidents.filter(i => i.status !== 'Resolved').length}
                </p>
              </div>
              <AlertTriangle 
                className="w-8 h-8"
                style={{ color: colors.warning }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search 
              className="absolute left-2 top-2.5 h-4 w-4"
              style={{ color: colors.textMuted }}
            />
            <Input
              placeholder="Search zones by name, code, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredZones.map((zone) => {
          const stats = getZoneStats(zone);
          const health = getZoneHealthStatus(zone);
          const typeConfig = zoneTypeColors[zone.type] || zoneTypeColors['Commercial'];
          
          return (
            <Card 
              key={zone.id} 
              className="hover:shadow-lg transition-all cursor-pointer border-l-4"
              style={{ 
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderLeftColor: health.color
              }}
              onClick={() => {
                setSelectedZone(zone);
                setShowDetailsDialog(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle 
                        className="text-xl transition-colors duration-300"
                        style={{ color: colors.heading }}
                      >
                        {zone.name}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: colors.border,
                          color: colors.text,
                          backgroundColor: 'transparent'
                        }}
                      >
                        {zone.id}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant="outline" 
                        style={{ 
                          backgroundColor: typeConfig.bg,
                          color: typeConfig.text,
                          borderColor: typeConfig.border
                        }}
                      >
                        {zone.type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        style={{ 
                          backgroundColor: health.bgColor,
                          color: health.color,
                          borderColor: health.border
                        }}
                      >
                        {health.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div 
                    className="p-2 rounded border"
                    style={{ 
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.border
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Users 
                        className="w-4 h-4"
                        style={{ color: colors.info }}
                      />
                      <span style={{ color: colors.textSecondary }}>Occupancy</span>
                    </div>
                    <p 
                      className="font-bold text-lg transition-colors duration-300"
                      style={{ color: colors.heading }}
                    >
                      {stats.occupancyRate}%
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: colors.textMuted }}
                    >
                      {zone.currentOccupancy?.toLocaleString()} / {zone.capacity?.toLocaleString()}
                    </p>
                  </div>
                  
                  <div 
                    className="p-2 rounded border"
                    style={{ 
                      backgroundColor: colors.surfaceVariant,
                      borderColor: colors.border
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Camera 
                        className="w-4 h-4"
                        style={{ color: colors.success }}
                      />
                      <span style={{ color: colors.textSecondary }}>Devices</span>
                    </div>
                    <p 
                      className="font-bold text-lg transition-colors duration-300"
                      style={{ color: colors.heading }}
                    >
                      {zone.devices}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: colors.textMuted }}
                    >
                      {stats.deviceUptime}% online
                    </p>
                  </div>
                </div>

                {/* Density Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.textSecondary }}>Crowd Density</span>
                    <span 
                      className="font-medium transition-colors duration-300"
                      style={{ color: colors.text }}
                    >
                      {zone.currentOccupancy?.toLocaleString()}
                    </span>
                  </div>
                  <div 
                    className="w-full rounded-full h-3"
                    style={{ backgroundColor: colors.surfaceAlt }}
                  >
                    <div 
                      className="h-3 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(stats.occupancyRate, 100)}%`,
                        backgroundColor: stats.occupancyRate >= 90 ? colors.danger :
                                       stats.occupancyRate >= 70 ? colors.warning : colors.success
                      }}
                    />
                  </div>
                </div>

                {/* Incidents & Status */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span style={{ color: colors.textSecondary }}>Incidents:</span>
                    <span 
                      className="ml-2 font-medium"
                      style={{ 
                        color: stats.openIncidents > 0 ? colors.danger : colors.success
                      }}
                    >
                      {stats.openIncidents > 0 ? `${stats.openIncidents} Open` : 'All Clear'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: colors.textSecondary }}>Devices:</span>
                    <span 
                      className="ml-2 font-medium"
                      style={{ 
                        color: stats.deviceUptime < 90 ? colors.warning : colors.success
                      }}
                    >
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
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: 'transparent'
                    }}
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
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="text-center py-12">
            <MapPin 
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: colors.textMuted }}
            />
            <h3 
              className="text-lg font-medium mb-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              No zones found
            </h3>
            <p style={{ color: colors.textMuted }}>
              No zones match your search criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Zone Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent 
          className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto"
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
              <MapPin className="w-5 h-5" />
              Zone Details - {selectedZone?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedZone && (
            <div className="space-y-6">
              {/* Header Info */}
              <div 
                className="grid grid-cols-3 gap-4 p-4 rounded-lg"
                style={{ backgroundColor: colors.surfaceVariant }}
              >
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Zone Code
                  </Label>
                  <p 
                    className="text-xl font-bold transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    {selectedZone.id}
                  </p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Zone Type
                  </Label>
                  <p style={{ color: colors.text }}>{selectedZone.type}</p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Health Status
                  </Label>
                  <div className="mt-1">
                    {(() => {
                      const health = getZoneHealthStatus(selectedZone);
                      return (
                        <Badge 
                          variant="outline" 
                          style={{ 
                            backgroundColor: health.bgColor,
                            color: health.color,
                            borderColor: health.border
                          }}
                        >
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
                    <div 
                      className="text-center p-4 rounded-lg border"
                      style={{ 
                        backgroundColor: `${colors.info}20`,
                        borderColor: `${colors.info}40`
                      }}
                    >
                      <p 
                        className="text-2xl font-bold"
                        style={{ color: colors.info }}
                      >
                        {selectedZone.capacity?.toLocaleString()}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: colors.info }}
                      >
                        Max Capacity
                      </p>
                    </div>
                    <div 
                      className="text-center p-4 rounded-lg border"
                      style={{ 
                        backgroundColor: `${colors.buttonPrimary}20`,
                        borderColor: `${colors.buttonPrimary}40`
                      }}
                    >
                      <p 
                        className="text-2xl font-bold"
                        style={{ color: colors.buttonPrimary }}
                      >
                        {selectedZone.currentOccupancy?.toLocaleString()}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: colors.buttonPrimary }}
                      >
                        Current Density
                      </p>
                    </div>
                    <div 
                      className="text-center p-4 rounded-lg border"
                      style={{ 
                        backgroundColor: `${colors.success}20`,
                        borderColor: `${colors.success}40`
                      }}
                    >
                      <p 
                        className="text-2xl font-bold"
                        style={{ color: colors.success }}
                      >
                        {selectedZone.devices}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: colors.success }}
                      >
                        Total Devices
                      </p>
                    </div>
                    <div 
                      className="text-center p-4 rounded-lg border"
                      style={{ 
                        backgroundColor: `${colors.warning}20`,
                        borderColor: `${colors.warning}40`
                      }}
                    >
                      <p 
                        className="text-2xl font-bold"
                        style={{ color: colors.warning }}
                      >
                        {stats.openIncidents}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: colors.warning }}
                      >
                        Open Incidents
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Occupancy Progress */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Occupancy Rate
                  </Label>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: colors.text }}
                  >
                    {Math.round((selectedZone.currentOccupancy / selectedZone.capacity) * 100)}%
                  </span>
                </div>
                <div 
                  className="w-full rounded-full h-4"
                  style={{ backgroundColor: colors.surfaceAlt }}
                >
                  <div 
                    className="h-4 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((selectedZone.currentOccupancy / selectedZone.capacity) * 100, 100)}%`,
                      backgroundColor: (selectedZone.currentOccupancy / selectedZone.capacity) >= 0.9 ? colors.danger :
                                     (selectedZone.currentOccupancy / selectedZone.capacity) >= 0.7 ? colors.warning : colors.success
                    }}
                  />
                </div>
              </div>

              {/* Recent Incidents */}
              <div>
                <Label 
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Recent Incidents
                </Label>
                <div className="mt-2 space-y-2">
                  {incidents.filter(i => i.location?.includes(selectedZone.name)).slice(0, 3).map((incident) => (
                    <div 
                      key={incident.id} 
                      className="flex items-center justify-between p-3 rounded border"
                      style={{ 
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.border
                      }}
                    >
                      <div>
                        <p 
                          className="font-medium transition-colors duration-300"
                          style={{ color: colors.heading }}
                        >
                          {incident.id}
                        </p>
                        <p 
                          className="text-sm"
                          style={{ color: colors.textSecondary }}
                        >
                          {incident.title}
                        </p>
                      </div>
                      <Badge 
                        className={`border-0 text-white font-medium`}
                        style={{ 
                          backgroundColor: incident.status === 'Resolved' ? colors.success : colors.danger
                        }}
                      >
                        {incident.status}
                      </Badge>
                    </div>
                  ))}
                  {incidents.filter(i => i.location?.includes(selectedZone.name)).length === 0 && (
                    <div 
                      className="text-center py-4"
                      style={{ color: colors.textMuted }}
                    >
                      <CheckCircle 
                        className="w-8 h-8 mx-auto mb-2"
                        style={{ color: colors.success }}
                      />
                      No incidents in this zone
                    </div>
                  )}
                </div>
              </div>

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
                {userRole === 'admin' && (
                  <Button 
                    variant="outline"
                    style={{ 
                      borderColor: colors.buttonPrimary,
                      color: colors.buttonPrimary,
                      backgroundColor: 'transparent'
                    }}
                  >
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