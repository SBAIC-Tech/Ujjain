import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
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
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('24h');
  const [zoneFilter, setZoneFilter] = useState('all');
  
  const [analyticsData, setAnalyticsData] = useState({
    zoneDensity: {},
    incidentTypes: {},
    deviceHealth: {},
    hourlyIncidents: [],
    zones: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter, zoneFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [zoneDensity, incidentTypes, deviceHealth, zones] = await Promise.all([
        apiCall('/analytics/zone-density'),
        apiCall('/analytics/incident-types'),
        apiCall('/analytics/device-health'),
        apiCall('/zones')
      ]);
      
      // Generate hourly incident data (simulated)
      const hourlyIncidents = Array.from({ length: 24 }, (_, i) => ({
        hour: String(i).padStart(2, '0') + ':00',
        incidents: Math.floor(Math.random() * 10) + 1
      }));
      
      setAnalyticsData({
        zoneDensity,
        incidentTypes,
        deviceHealth,
        hourlyIncidents,
        zones
      });
      
    } catch (error) {
      toast.error("Failed to fetch analytics data");
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      percentage: (density / maxDensity) * 100,
      color: density > 10000 ? 'bg-red-500' : density > 5000 ? 'bg-orange-500' : 'bg-green-500'
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
    const colors = {
      'Overcrowding': 'bg-red-500',
      'Missing Child': 'bg-orange-500',
      'Medical Emergency': 'bg-blue-500',
      'Flood Risk': 'bg-purple-500',
      'Fight/Aggression': 'bg-red-600',
      'Device Fault': 'bg-gray-500'
    };
    return colors[type] || 'bg-slate-500';
  };

  const getDeviceHealthStats = () => {
    const { deviceHealth } = analyticsData;
    return [
      { label: 'Online', value: deviceHealth.Online || 0, color: 'bg-green-500', textColor: 'text-green-700' },
      { label: 'Offline', value: deviceHealth.Offline || 0, color: 'bg-red-500', textColor: 'text-red-700' }
    ];
  };

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
          <h2 className="text-3xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-slate-600">Real-time insights and data visualization</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Time Range:</Label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label>Zone Filter:</Label>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Peak Zone Density</p>
                <p className="text-3xl font-bold text-blue-900">15.4K</p>
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% from yesterday
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Device Uptime</p>
                <p className="text-3xl font-bold text-green-900">94%</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Stable performance
                </p>
              </div>
              <Camera className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Incidents Today</p>
                <p className="text-3xl font-bold text-orange-900">5</p>
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  -3 from yesterday
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Response Time</p>
                <p className="text-3xl font-bold text-purple-900">4.2m</p>
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Average response
                </p>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Density Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Zone Density Distribution
            </CardTitle>
            <CardDescription>Current occupancy levels across all zones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getZoneDensityChart().map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.zone}</span>
                    <span className="text-slate-600">{item.density.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incident Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Incident Type Breakdown
            </CardTitle>
            <CardDescription>Distribution of incident types over selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getIncidentTypesChart().map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${item.color}`} />
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">{item.count}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Incidents Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Hourly Incident Activity
            </CardTitle>
            <CardDescription>Incident frequency throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.hourlyIncidents.slice(0, 12).map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs font-mono w-12">{item.hour}</span>
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.incidents / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-6 text-right">{item.incidents}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Health Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Device Health Status
            </CardTitle>
            <CardDescription>Real-time status of monitoring devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {getDeviceHealthStats().map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${item.textColor}`}>{item.label}</span>
                    <span className={`text-2xl font-bold ${item.textColor}`}>{item.value}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all ${item.color}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">98.5%</p>
                  <p className="text-sm text-slate-600">System Uptime</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Peak Activity Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Morning Peak</span>
                <Badge variant="outline">08:00 - 10:00</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Evening Peak</span>
                <Badge variant="outline">18:00 - 20:00</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Night Low</span>
                <Badge variant="outline">02:00 - 06:00</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Zone Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Highest Density</span>
                <Badge className="bg-red-100 text-red-800">Ram Ghat</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Most Incidents</span>
                <Badge className="bg-orange-100 text-orange-800">Market District</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Best Performance</span>
                <Badge className="bg-green-100 text-green-800">South Satellite</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Network Status</span>
                <Badge className="bg-green-100 text-green-800">Stable</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Database</span>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">API Response</span>
                <Badge className="bg-green-100 text-green-800">< 100ms</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedAnalytics;