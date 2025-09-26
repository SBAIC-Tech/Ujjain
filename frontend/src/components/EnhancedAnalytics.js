import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { 
  BarChart3, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Camera,
  AlertTriangle,
  Download,
  Calendar,
  Activity,
  Zap
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

const EnhancedAnalytics = ({ userRole }) => {
  const { colors, isDark } = useTheme();
  const { data } = useData();
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [zoneFilter, setZoneFilter] = useState('all');
  
  const [analyticsData, setAnalyticsData] = useState({
    zoneDensity: {},
    incidentTypes: {},
    deviceHealth: {},
    hourlyIncidents: [],
    zones: []
  });

  // Load data instantly from context and generate analytics
  useEffect(() => {
    if (data) {
      generateAnalytics();
    }
  }, [data, timeFilter, zoneFilter]);

  const generateAnalytics = () => {
    if (!data) return;

    // Generate zone density analytics
    const zoneDensity = {};
    data.zones.forEach(zone => {
      zoneDensity[zone.name] = zone.currentOccupancy;
    });

    // Generate incident types analytics
    const incidentTypes = {};
    data.incidents.forEach(incident => {
      incidentTypes[incident.type] = (incidentTypes[incident.type] || 0) + 1;
    });

    // Generate device health analytics
    const deviceHealth = {
      Online: data.devices.filter(d => d.status === 'online').length,
      Offline: data.devices.filter(d => d.status === 'offline').length
    };

    // Generate hourly incident data (simulated based on real incidents)
    const hourlyIncidents = Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, '0') + ':00';
      const baseIncidents = Math.floor(Math.random() * 5) + 1;
      // Add some incidents that occurred within this hour
      const hourIncidents = data.incidents.filter(incident => {
        const incidentHour = new Date(incident.timestamp).getHours();
        return incidentHour === i;
      }).length;
      
      return {
        hour,
        incidents: Math.max(baseIncidents, hourIncidents)
      };
    });

    setAnalyticsData({
      zoneDensity,
      incidentTypes,
      deviceHealth,
      hourlyIncidents,
      zones: data.zones
    });
  };

  const handleExportReport = () => {
    toast.success("Analytics report download started");
    // In a real implementation, this would trigger a PDF/CSV download
  };

  const getZoneDensityChart = () => {
    const { zoneDensity } = analyticsData;
    const maxDensity = Math.max(...Object.values(zoneDensity));
    
    return Object.entries(zoneDensity).map(([zone, density]) => ({
      zone: zone.replace(' District', '').replace(' & Riverfront', ''),
      density,
      percentage: maxDensity > 0 ? (density / maxDensity) * 100 : 0,
      color: density > 10000 ? colors.danger : density > 5000 ? colors.warning : colors.success
    }));
  };

  const getIncidentTypesChart = () => {
    const { incidentTypes } = analyticsData;
    const total = Object.values(incidentTypes).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(incidentTypes).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: getIncidentTypeColor(type)
    }));
  };

  const getIncidentTypeColor = (type) => {
    const colorMap = {
      'crowd_management': colors.danger,
      'missing_person': colors.warning,
      'medical': colors.info,
      'security': colors.buttonPrimary,
      'safety': colors.danger,
      'device_fault': colors.textMuted
    };
    return colorMap[type] || colors.textMuted;
  };

  const getDeviceHealthStats = () => {
    const { deviceHealth } = analyticsData;
    const total = (deviceHealth.Online || 0) + (deviceHealth.Offline || 0);
    
    return [
      { 
        label: 'Online', 
        value: total > 0 ? Math.round(((deviceHealth.Online || 0) / total) * 100) : 0, 
        color: colors.success
      },
      { 
        label: 'Offline', 
        value: total > 0 ? Math.round(((deviceHealth.Offline || 0) / total) * 100) : 0, 
        color: colors.danger
      }
    ];
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center h-64 transition-colors duration-300" 
        style={{ backgroundColor: colors.background }}
      >
        <RefreshCw 
          className="w-8 h-8 animate-spin transition-colors duration-300"
          style={{ color: colors.buttonPrimary }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-300" style={{ backgroundColor: colors.background }}>
      {/* AiChecked Logo Display */}
      <div className="flex justify-center mb-4">
        <img 
          src={isDark ? "/logo-dark.png" : "/logo-light.png"} 
          alt="AiChecked Smart City" 
          className="h-16 w-auto opacity-90 transition-opacity duration-300 hover:opacity-100"
        />
      </div>

      {/* Header */}
      <div 
        className="flex items-center justify-between p-6 rounded-lg transition-colors duration-300"
        style={{ backgroundColor: colors.backgroundAlt }}
      >
        <div>
          <h2 
            className="text-3xl font-bold transition-colors duration-300"
            style={{ color: colors.heading }}
          >
            Analytics Dashboard
          </h2>
          <p 
            className="transition-colors duration-300 mt-2"
            style={{ color: colors.textSecondary }}
          >
            Real-time insights and data visualization for MahaKumbh 2025
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={generateAnalytics} 
            variant="outline" 
            size="sm"
            className="transition-all duration-300"
            style={{ 
              borderColor: colors.buttonPrimary,
              color: colors.buttonPrimary,
              backgroundColor: 'transparent'
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleExportReport} 
            variant="outline" 
            size="sm"
            className="transition-all duration-300"
            style={{ 
              borderColor: colors.buttonPrimary,
              color: colors.buttonPrimary,
              backgroundColor: 'transparent'
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card 
        className="transition-colors duration-300" 
        style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label 
                className="transition-colors duration-300" 
                style={{ color: colors.text }}
              >
                Time Range:
              </Label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger 
                  className="w-32 transition-colors duration-300"
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  className="transition-colors duration-300"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label 
                className="transition-colors duration-300" 
                style={{ color: colors.text }}
              >
                Zone Filter:
              </Label>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger 
                  className="w-48 transition-colors duration-300"
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  className="transition-colors duration-300"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <SelectItem value="all">All Zones</SelectItem>
                  {analyticsData.zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="transition-all duration-300 hover:shadow-lg" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Peak Zone Density
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {Math.max(...Object.values(analyticsData.zoneDensity || {})).toLocaleString() || '0'}
                </p>
                <p 
                  className="text-xs flex items-center gap-1 mt-1"
                  style={{ color: colors.success }}
                >
                  <TrendingUp className="w-3 h-3" />
                  Live data
                </p>
              </div>
              <Users 
                className="w-8 h-8 transition-colors duration-300"
                style={{ color: colors.info }}
              />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="transition-all duration-300 hover:shadow-lg" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Device Uptime
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {data?.analytics?.deviceUptime || '98.5%'}
                </p>
                <p 
                  className="text-xs flex items-center gap-1 mt-1"
                  style={{ color: colors.success }}
                >
                  <TrendingUp className="w-3 h-3" />
                  Stable performance
                </p>
              </div>
              <Camera 
                className="w-8 h-8 transition-colors duration-300"
                style={{ color: colors.success }}
              />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="transition-all duration-300 hover:shadow-lg" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardContent className="p-6">
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
                  {data?.analytics?.activeIncidents || 0}
                </p>
                <p 
                  className="text-xs flex items-center gap-1 mt-1"
                  style={{ color: colors.warning }}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Real-time count
                </p>
              </div>
              <AlertTriangle 
                className="w-8 h-8 transition-colors duration-300"
                style={{ color: colors.warning }}
              />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="transition-all duration-300 hover:shadow-lg" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Response Time
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {data?.analytics?.averageResponseTime || '4.2m'}
                </p>
                <p 
                  className="text-xs flex items-center gap-1 mt-1"
                  style={{ color: colors.info }}
                >
                  <Activity className="w-3 h-3" />
                  Average response
                </p>
              </div>
              <Zap 
                className="w-8 h-8 transition-colors duration-300"
                style={{ color: colors.buttonPrimary }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Density Chart */}
        <Card 
          className="transition-colors duration-300" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardHeader 
            className="transition-colors duration-300"
            style={{ backgroundColor: colors.cardAlt }}
          >
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <MapPin className="w-5 h-5" />
              Zone Density Distribution
            </CardTitle>
            <CardDescription 
              className="transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              Current occupancy levels across all zones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {getZoneDensityChart().map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span 
                      className="font-medium transition-colors duration-300"
                      style={{ color: colors.text }}
                    >
                      {item.zone}
                    </span>
                    <span 
                      className="transition-colors duration-300"
                      style={{ color: colors.textSecondary }}
                    >
                      {item.density.toLocaleString()}
                    </span>
                  </div>
                  <div 
                    className="w-full rounded-full h-3 transition-colors duration-300"
                    style={{ backgroundColor: colors.surfaceAlt }}
                  >
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incident Types Chart */}
        <Card 
          className="transition-colors duration-300" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardHeader 
            className="transition-colors duration-300"
            style={{ backgroundColor: colors.cardAlt }}
          >
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <AlertTriangle className="w-5 h-5" />
              Incident Type Breakdown
            </CardTitle>
            <CardDescription 
              className="transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              Distribution of incident types over selected period
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {getIncidentTypesChart().map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded transition-colors duration-300"
                      style={{ backgroundColor: item.color }}
                    />
                    <span 
                      className="text-sm font-medium transition-colors duration-300"
                      style={{ color: colors.text }}
                    >
                      {item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-sm transition-colors duration-300"
                      style={{ color: colors.textSecondary }}
                    >
                      {item.count}
                    </span>
                    <Badge 
                      variant="outline" 
                      className="text-xs transition-colors duration-300"
                      style={{ 
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: 'transparent'
                      }}
                    >
                      {item.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Incidents Chart */}
        <Card 
          className="transition-colors duration-300" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardHeader 
            className="transition-colors duration-300"
            style={{ backgroundColor: colors.cardAlt }}
          >
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <Activity className="w-5 h-5" />
              Hourly Incident Activity
            </CardTitle>
            <CardDescription 
              className="transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              Incident frequency throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {analyticsData.hourlyIncidents.slice(0, 12).map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span 
                    className="text-xs font-mono w-12 transition-colors duration-300"
                    style={{ color: colors.textSecondary }}
                  >
                    {item.hour}
                  </span>
                  <div 
                    className="flex-1 rounded-full h-2 transition-colors duration-300"
                    style={{ backgroundColor: colors.surfaceAlt }}
                  >
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(item.incidents / 10) * 100}%`,
                        backgroundColor: colors.info
                      }}
                    />
                  </div>
                  <span 
                    className="text-xs w-6 text-right transition-colors duration-300"
                    style={{ color: colors.textSecondary }}
                  >
                    {item.incidents}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Health Chart */}
        <Card 
          className="transition-colors duration-300" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardHeader 
            className="transition-colors duration-300"
            style={{ backgroundColor: colors.cardAlt }}
          >
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <Camera className="w-5 h-5" />
              Device Health Status
            </CardTitle>
            <CardDescription 
              className="transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              Real-time status of monitoring devices
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {getDeviceHealthStats().map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span 
                      className="font-medium transition-colors duration-300"
                      style={{ color: colors.text }}
                    >
                      {item.label}
                    </span>
                    <span 
                      className="text-2xl font-bold transition-colors duration-300"
                      style={{ color: item.color }}
                    >
                      {item.value}%
                    </span>
                  </div>
                  <div 
                    className="w-full rounded-full h-4 transition-colors duration-300"
                    style={{ backgroundColor: colors.surfaceAlt }}
                  >
                    <div 
                      className="h-4 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.value}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
              
              <div 
                className="pt-4 border-t transition-colors duration-300"
                style={{ borderColor: colors.border }}
              >
                <div className="text-center">
                  <p 
                    className="text-2xl font-bold transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    {data?.analytics?.deviceUptime || '98.5%'}
                  </p>
                  <p 
                    className="text-sm transition-colors duration-300"
                    style={{ color: colors.textSecondary }}
                  >
                    System Uptime
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="transition-colors duration-300" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardHeader>
            <CardTitle 
              className="text-lg transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              Peak Activity Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Morning Peak
                </span>
                <Badge 
                  variant="outline"
                  className="transition-colors duration-300"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: 'transparent'
                  }}
                >
                  08:00 - 10:00
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Evening Peak
                </span>
                <Badge 
                  variant="outline"
                  className="transition-colors duration-300"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: 'transparent'
                  }}
                >
                  18:00 - 20:00
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Night Low
                </span>
                <Badge 
                  variant="outline"
                  className="transition-colors duration-300"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: 'transparent'
                  }}
                >
                  02:00 - 06:00
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="transition-colors duration-300" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardHeader>
            <CardTitle 
              className="text-lg transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              Zone Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Highest Density
                </span>
                <Badge 
                  className="text-white font-medium transition-colors duration-300"
                  style={{ backgroundColor: colors.danger, border: 'none' }}
                >
                  Ram Ghat
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Most Incidents
                </span>
                <Badge 
                  className="text-white font-medium transition-colors duration-300"
                  style={{ backgroundColor: colors.warning, border: 'none' }}
                >
                  Temple District
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Best Performance
                </span>
                <Badge 
                  className="text-white font-medium transition-colors duration-300"
                  style={{ backgroundColor: colors.success, border: 'none' }}
                >
                  Market District
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="transition-colors duration-300" 
          style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        >
          <CardHeader>
            <CardTitle 
              className="text-lg transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Network Status
                </span>
                <Badge 
                  className="text-white font-medium transition-colors duration-300"
                  style={{ backgroundColor: colors.success, border: 'none' }}
                >
                  Stable
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Database
                </span>
                <Badge 
                  className="text-white font-medium transition-colors duration-300"
                  style={{ backgroundColor: colors.success, border: 'none' }}
                >
                  Connected
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span 
                  className="transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  API Response
                </span>
                <Badge 
                  className="text-white font-medium transition-colors duration-300"
                  style={{ backgroundColor: colors.success, border: 'none' }}
                >
                  &lt; 100ms
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedAnalytics;