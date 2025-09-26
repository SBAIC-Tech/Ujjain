import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
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
  const { colors } = useTheme();
  const { data, updateDeviceStatus } = useData();
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [deviceFaults, setDeviceFaults] = useState([]);

  // Load data instantly from context
  useEffect(() => {
    if (data) {
      // Use system health data from context or set defaults
      setSystemHealth(data.systemHealth || {
        overallStatus: 'Operational',
        uptime: '99.8%',
        activeConnections: 1861,
        networkLatency: '< 100ms',
        databaseStatus: 'Connected',
        cpuUsage: 34,
        memoryUsage: 67,
        diskUsage: 45,
        networkStatus: 'Stable',
        lastBackup: new Date()
      });
      
      // Filter devices that need attention
      setDeviceFaults(data.devices.filter(d => 
        d.status === 'offline' || d.health < 85
      ));
      
      fetchAdditionalData();
    }
  }, [data]);

  const fetchAdditionalData = async () => {
    try {
      const [healthData] = await Promise.all([
        apiCall('/system/health')
      ]);
      setSystemHealth(healthData);
    } catch (error) {
      console.error('Failed to fetch additional system health data:', error);
    }
  };

  const handleRestartDevice = async (deviceId) => {
    try {
      // Update context immediately
      updateDeviceStatus(deviceId, 'online');
      
      // Also call API for persistence
      await apiCall(`/devices/${deviceId}/reboot`, { method: 'PUT' });
      toast.success(`Device ${deviceId} restart initiated`);
    } catch (error) {
      toast.error("Failed to restart device");
    }
  };

  const getHealthStatus = (value, thresholds) => {
    const numValue = parseInt(value);
    if (numValue >= thresholds.critical) return { status: 'critical', color: colors.danger };
    if (numValue >= thresholds.warning) return { status: 'warning', color: colors.warning };
    return { status: 'good', color: colors.success };
  };

  const getUptimeColor = (uptime) => {
    const percentage = parseFloat(uptime);
    if (percentage >= 99) return colors.success;
    if (percentage >= 95) return colors.warning;
    return colors.danger;
  };

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
            System Health & Monitoring
          </h2>
          <p 
            className="transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            Real-time system performance and device status
          </p>
        </div>
        <Button 
          onClick={fetchAdditionalData} 
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

      {/* System Status Overview */}
      <Card 
        className="border-l-4"
        style={{ 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderLeftColor: systemHealth?.overallStatus === 'Operational' ? colors.success : colors.danger
        }}
      >
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 transition-colors duration-300"
            style={{ color: colors.heading }}
          >
            {systemHealth?.overallStatus === 'Operational' ? 
              <CheckCircle 
                className="w-6 h-6"
                style={{ color: colors.success }}
              /> : 
              <AlertTriangle 
                className="w-6 h-6"
                style={{ color: colors.danger }}
              />
            }
            System Status: {systemHealth?.overallStatus === 'Operational' ? 'All Systems Operational' : 'Issues Detected'}
          </CardTitle>
          <CardDescription style={{ color: colors.textSecondary }}>
            Last updated: {new Date().toLocaleString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  System Uptime
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: getUptimeColor(systemHealth?.uptime) }}
                >
                  {systemHealth?.uptime}
                </p>
              </div>
              <Activity 
                className="w-8 h-8"
                style={{ color: colors.info }}
              />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  CPU Usage
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ 
                    color: getHealthStatus(systemHealth?.cpuUsage, {warning: 70, critical: 90}).color
                  }}
                >
                  {systemHealth?.cpuUsage}%
                </p>
              </div>
              <Cpu 
                className="w-8 h-8"
                style={{ color: colors.success }}
              />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Memory Usage
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ 
                    color: getHealthStatus(systemHealth?.memoryUsage, {warning: 70, critical: 85}).color
                  }}
                >
                  {systemHealth?.memoryUsage}%
                </p>
              </div>
              <MemoryStick 
                className="w-8 h-8"
                style={{ color: colors.buttonPrimary }}
              />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Active Connections
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {systemHealth?.activeConnections}
                </p>
              </div>
              <Network 
                className="w-8 h-8"
                style={{ color: colors.warning }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network & Database Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardHeader style={{ backgroundColor: colors.cardAlt }}>
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <Wifi className="w-5 h-5" />
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span style={{ color: colors.textSecondary }}>Overall Status</span>
              <Badge 
                className="text-white font-medium"
                style={{ backgroundColor: colors.success, border: 'none' }}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {systemHealth?.networkStatus}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  Temple District
                </span>
                <Badge 
                  variant="outline" 
                  className="text-white font-medium"
                  style={{ backgroundColor: colors.success, border: 'none' }}
                >
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  Ram Ghat & Riverfront
                </span>
                <Badge 
                  variant="outline" 
                  className="text-white font-medium"
                  style={{ backgroundColor: colors.success, border: 'none' }}
                >
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  Market District
                </span>
                <Badge 
                  variant="outline" 
                  className="text-white font-medium"
                  style={{ backgroundColor: colors.success, border: 'none' }}
                >
                  Online
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardHeader style={{ backgroundColor: colors.cardAlt }}>
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <Database className="w-5 h-5" />
              Database & Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span style={{ color: colors.textSecondary }}>Database Status</span>
              <Badge 
                className="text-white font-medium"
                style={{ backgroundColor: colors.success, border: 'none' }}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {systemHealth?.databaseStatus}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  API Server
                </span>
                <Badge 
                  variant="outline" 
                  className="text-white font-medium"
                  style={{ backgroundColor: colors.success, border: 'none' }}
                >
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  Authentication
                </span>
                <Badge 
                  variant="outline" 
                  className="text-white font-medium"
                  style={{ backgroundColor: colors.success, border: 'none' }}
                >
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  Last Backup
                </span>
                <Badge 
                  variant="outline" 
                  className="text-white font-medium"
                  style={{ backgroundColor: colors.info, border: 'none' }}
                >
                  {systemHealth?.lastBackup ? new Date(systemHealth.lastBackup).toLocaleDateString() : 'Today'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Health Issues */}
      {deviceFaults && deviceFaults.length > 0 && (
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardHeader style={{ backgroundColor: colors.cardAlt }}>
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <AlertTriangle 
                className="w-5 h-5"
                style={{ color: colors.danger }}
              />
              Device Health Issues ({deviceFaults.length})
            </CardTitle>
            <CardDescription style={{ color: colors.textSecondary }}>
              Devices requiring attention or maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {deviceFaults.map((device) => (
                <div 
                  key={device.id} 
                  className="flex items-center justify-between p-4 rounded-lg border-l-4"
                  style={{ 
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.cardBorder,
                    borderLeftColor: colors.danger
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${colors.danger}20` }}
                    >
                      {device.status === 'offline' ? 
                        <WifiOff 
                          className="w-5 h-5"
                          style={{ color: colors.danger }}
                        /> : 
                        <Camera 
                          className="w-5 h-5"
                          style={{ color: colors.danger }}
                        />
                      }
                    </div>
                    <div>
                      <h4 
                        className="font-semibold transition-colors duration-300"
                        style={{ color: colors.heading }}
                      >
                        {device.id}
                      </h4>
                      <p 
                        className="text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        {device.location}
                      </p>
                      <p 
                        className="text-sm"
                        style={{ color: colors.danger }}
                      >
                        {device.status === 'offline' ? 'Device Offline' : `Health: ${device.health}%`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div 
                      className="text-right text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      <p>Last ping:</p>
                      <p>{new Date(device.lastPing).toLocaleString()}</p>
                    </div>
                    
                    {userRole !== 'viewer' && device.status === 'offline' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestartDevice(device.id)}
                        style={{ 
                          borderColor: colors.warning,
                          color: colors.warning,
                          backgroundColor: 'transparent'
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Restart
                      </Button>
                    )}
                    
                    {userRole !== 'viewer' && (
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ 
                          borderColor: colors.info,
                          color: colors.info,
                          backgroundColor: 'transparent'
                        }}
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
      <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
        <CardHeader style={{ backgroundColor: colors.cardAlt }}>
          <CardTitle 
            className="flex items-center gap-2 transition-colors duration-300"
            style={{ color: colors.heading }}
          >
            <Wrench className="w-5 h-5" />
            Recent Maintenance Activities
          </CardTitle>
          <CardDescription style={{ color: colors.textSecondary }}>
            Latest system maintenance and device actions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div 
              className="flex items-center justify-between p-3 rounded border-l-4"
              style={{ 
                backgroundColor: `${colors.success}20`,
                borderLeftColor: colors.success
              }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle 
                  className="w-5 h-5"
                  style={{ color: colors.success }}
                />
                <div>
                  <p 
                    className="font-medium transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    CAM203 Rebooted
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Device restored to online status
                  </p>
                </div>
              </div>
              <div 
                className="text-sm"
                style={{ color: colors.textMuted }}
              >
                {new Date(Date.now() - 10 * 60000).toLocaleString()}
              </div>
            </div>

            <div 
              className="flex items-center justify-between p-3 rounded border-l-4"
              style={{ 
                backgroundColor: `${colors.info}20`,
                borderLeftColor: colors.info
              }}
            >
              <div className="flex items-center gap-3">
                <Clock 
                  className="w-5 h-5"
                  style={{ color: colors.info }}
                />
                <div>
                  <p 
                    className="font-medium transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    System Health Check
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Diagnostic scan completed successfully
                  </p>
                </div>
              </div>
              <div 
                className="text-sm"
                style={{ color: colors.textMuted }}
              >
                {new Date(Date.now() - 30 * 60000).toLocaleString()}
              </div>
            </div>

            <div 
              className="flex items-center justify-between p-3 rounded border-l-4"
              style={{ 
                backgroundColor: `${colors.warning}20`,
                borderLeftColor: colors.warning
              }}
            >
              <div className="flex items-center gap-3">
                <Database 
                  className="w-5 h-5"
                  style={{ color: colors.warning }}
                />
                <div>
                  <p 
                    className="font-medium transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    System Backup Completed
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    Daily backup finished successfully
                  </p>
                </div>
              </div>
              <div 
                className="text-sm"
                style={{ color: colors.textMuted }}
              >
                {new Date(Date.now() - 6 * 60 * 60000).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Performance Metrics */}
      <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
        <CardHeader style={{ backgroundColor: colors.cardAlt }}>
          <CardTitle 
            className="flex items-center gap-2 transition-colors duration-300"
            style={{ color: colors.heading }}
          >
            <Monitor className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 
                className="font-medium transition-colors duration-300"
                style={{ color: colors.heading }}
              >
                Response Times
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>API Average</span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.success }}
                  >
                    &lt; 100ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>Database Query</span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.success }}
                  >
                    &lt; 50ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>Page Load</span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.success }}
                  >
                    &lt; 2s
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 
                className="font-medium transition-colors duration-300"
                style={{ color: colors.heading }}
              >
                Resource Usage
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>Disk Usage</span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.info }}
                  >
                    {systemHealth?.diskUsage}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>Network I/O</span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.info }}
                  >
                    Normal
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>Load Average</span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.success }}
                  >
                    Low
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 
                className="font-medium transition-colors duration-300"
                style={{ color: colors.heading }}
              >
                Availability
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>Last 24h</span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.success }}
                  >
                    99.98%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>Last 7 days</span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.success }}
                  >
                    99.95%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textSecondary }}>Last 30 days</span>
                  <span 
                    className="font-medium"
                    style={{ color: colors.success }}
                  >
                    99.87%
                  </span>
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