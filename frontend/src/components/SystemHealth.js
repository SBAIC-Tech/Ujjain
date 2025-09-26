import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { 
  RefreshCw,
  Monitor,
  Wifi,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Camera,
  WifiOff,
  Wrench,
  Calendar
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

const SystemHealth = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState(null);
  const [deviceFaults, setDeviceFaults] = useState([]);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const [healthData, devicesData] = await Promise.all([
        apiCall('/system/health'),
        apiCall('/devices')
      ]);
      
      setSystemHealth(healthData);
      setDeviceFaults(devicesData.filter(d => d.status === 'Offline' || d.health !== 'Good'));
      
    } catch (error) {
      toast.error("Failed to fetch system health data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestartDevice = async (deviceId) => {
    try {
      await apiCall(`/devices/${deviceId}/reboot`, { method: 'PUT' });
      toast.success(`Device ${deviceId} restart initiated`);
      setTimeout(fetchSystemHealth, 2000); // Refresh after 2 seconds
    } catch (error) {
      toast.error("Failed to restart device");
    }
  };

  const getHealthStatus = (value, thresholds) => {
    const numValue = parseInt(value);
    if (numValue >= thresholds.critical) return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
    if (numValue >= thresholds.warning) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getUptimeColor = (uptime) => {
    const percentage = parseFloat(uptime);
    if (percentage >= 99) return 'text-green-600';
    if (percentage >= 95) return 'text-yellow-600';
    return 'text-red-600';
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
          <h2 className="text-3xl font-bold text-slate-900">System Health & Monitoring</h2>
          <p className="text-slate-600">Real-time system performance and device status</p>
        </div>
        <Button onClick={fetchSystemHealth} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Status Overview */}
      <Card className={systemHealth?.status === 'healthy' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {systemHealth?.status === 'healthy' ? 
              <CheckCircle className="w-6 h-6 text-green-600" /> : 
              <AlertTriangle className="w-6 h-6 text-red-600" />
            }
            System Status: {systemHealth?.status === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
          </CardTitle>
          <CardDescription>
            Last updated: {new Date().toLocaleString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">System Uptime</p>
                <p className={`text-3xl font-bold ${getUptimeColor(systemHealth?.uptime)}`}>
                  {systemHealth?.uptime}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">CPU Usage</p>
                <p className={`text-3xl font-bold ${getHealthStatus(systemHealth?.cpu_usage, {warning: 70, critical: 90}).color}`}>
                  {systemHealth?.cpu_usage}
                </p>
              </div>
              <Cpu className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Memory Usage</p>
                <p className={`text-3xl font-bold ${getHealthStatus(systemHealth?.memory_usage, {warning: 70, critical: 85}).color}`}>
                  {systemHealth?.memory_usage}
                </p>
              </div>
              <MemoryStick className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Connections</p>
                <p className="text-3xl font-bold text-slate-900">{systemHealth?.active_connections}</p>
              </div>
              <Network className="w-8 h-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network & Database Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Overall Status</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {systemHealth?.network_status}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Temple District</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Ram Ghat & Riverfront</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Market District</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Transport Hub</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">Online</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database & Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Database Status</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {systemHealth?.database_status}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">API Server</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Authentication</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">File Storage</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">Available</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Last Backup</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {systemHealth?.last_backup ? new Date(systemHealth.last_backup).toLocaleDateString() : 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Health Issues */}
      {deviceFaults && deviceFaults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Device Health Issues ({deviceFaults.length})
            </CardTitle>
            <CardDescription>
              Devices requiring attention or maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceFaults.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      {device.status === 'Offline' ? 
                        <WifiOff className="w-5 h-5 text-red-600" /> : 
                        <Camera className="w-5 h-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{device.device_id}</h4>
                      <p className="text-sm text-slate-600">{device.zone_name} - {device.location}</p>
                      <p className="text-sm text-red-700">
                        {device.status === 'Offline' ? 'Device Offline' : `Health: ${device.health}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-slate-600">
                      <p>Last checked:</p>
                      <p>{new Date(device.last_checked).toLocaleString()}</p>
                    </div>
                    
                    {userRole !== 'Viewer' && device.status === 'Offline' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestartDevice(device.device_id)}
                        className="text-orange-700 border-orange-300 hover:bg-orange-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Restart
                      </Button>
                    )}
                    
                    {userRole !== 'Viewer' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-700 border-blue-300 hover:bg-blue-50"
                      >
                        <Wrench className="w-4 h-4 mr-1" />
                        Maintenance
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Maintenance Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Recent Maintenance Activities
          </CardTitle>
          <CardDescription>
            Latest system maintenance and device actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-slate-900">CAM203 Rebooted</p>
                  <p className="text-sm text-slate-600">Device restored to online status</p>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {new Date(Date.now() - 10 * 60000).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-slate-900">CAM221 Health Check</p>
                  <p className="text-sm text-slate-600">Diagnostic scan completed successfully</p>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {new Date(Date.now() - 30 * 60000).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border-l-4 border-orange-500 bg-orange-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-slate-900">System Backup Completed</p>
                  <p className="text-sm text-slate-600">Daily backup finished successfully</p>
                </div>
              </div>
              <div className="text-sm text-slate-500">
                {new Date(Date.now() - 6 * 60 * 60000).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900">Response Times</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">API Average</span>
                  <span className="font-medium text-green-600">< 100ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Database Query</span>
                  <span className="font-medium text-green-600">< 50ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Page Load</span>
                  <span className="font-medium text-green-600">< 2s</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-slate-900">Resource Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Disk Usage</span>
                  <span className="font-medium text-blue-600">45%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Network I/O</span>
                  <span className="font-medium text-blue-600">Normal</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Load Average</span>
                  <span className="font-medium text-green-600">Low</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-slate-900">Availability</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Last 24h</span>
                  <span className="font-medium text-green-600">99.98%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Last 7 days</span>
                  <span className="font-medium text-green-600">99.95%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Last 30 days</span>
                  <span className="font-medium text-green-600">99.87%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealth;