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
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { 
  Plus, 
  Bell, 
  RefreshCw,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Volume2,
  Mail,
  Smartphone,
  Megaphone,
  Filter,
  Camera,
  MapPin,
  Calendar,
  User,
  Users,
  AlertCircle
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

const EnhancedAlertsManagement = ({ userRole }) => {
  const { colors } = useTheme();
  const { data, markAlertAsRead } = useData();
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    status: 'all',
    search: ''
  });

  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    alert_type: '',
    zone: '',
    source: '',
    severity: 'medium',
    zone_ids: [],
    expires_at: null
  });

  const alertTypes = [
    { value: 'device_failure', label: 'Device Failure', icon: Camera, color: colors.danger },
    { value: 'crowd_warning', label: 'Crowd Warning', icon: Users, color: colors.warning },
    { value: 'system_info', label: 'System Info', icon: AlertCircle, color: colors.info },
    { value: 'emergency', label: 'Emergency', icon: AlertTriangle, color: colors.danger },
    { value: 'maintenance', label: 'Maintenance', icon: Clock, color: colors.textMuted }
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: colors.success },
    { value: 'medium', label: 'Medium', color: colors.warning },
    { value: 'high', label: 'High', color: colors.danger }
  ];

  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    critical: 0
  });

  // Load data instantly from context
  useEffect(() => {
    if (data) {
      setAlerts(data.alerts);
      setZones(data.zones);
      
      // Calculate stats from context data
      const contextStats = {
        total: data.alerts.length,
        unread: data.alerts.filter(a => a.status === 'unread').length,
        read: data.alerts.filter(a => a.status === 'read').length,
        critical: data.alerts.filter(a => a.severity === 'high').length
      };
      setStats(contextStats);
    }
  }, [data]);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/alerts', {
        method: 'POST',
        body: JSON.stringify(newAlert)
      });
      
      toast.success("Alert created and broadcast successfully");
      setShowCreateDialog(false);
      setNewAlert({
        title: '',
        message: '',
        alert_type: '',
        zone: '',
        source: '',
        severity: 'medium',
        zone_ids: [],
        expires_at: null
      });
    } catch (error) {
      toast.error("Failed to create alert");
      console.error(error);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      // Update context immediately
      markAlertAsRead(alertId);
      
      // Also call API for persistence
      await apiCall(`/alerts/${alertId}/status?status=read`, { method: 'PUT' });
      toast.success("Alert marked as read");
    } catch (error) {
      toast.error("Failed to update alert status");
    }
  };

  const getAlertTypeBadge = (alertType) => {
    const typeConfig = alertTypes.find(t => t.value === alertType);
    if (!typeConfig) return null;
    
    const Icon = typeConfig.icon;
    
    return (
      <Badge 
        variant="outline" 
        className="border-0 text-white font-medium"
        style={{ backgroundColor: typeConfig.color }}
      >
        <Icon className="w-3 h-3 mr-1" />
        {typeConfig.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity) => {
    const severityConfig = severityLevels.find(s => s.value === severity);
    if (!severityConfig) return null;
    
    return (
      <Badge 
        className="border-0 text-white font-medium"
        style={{ backgroundColor: severityConfig.color }}
      >
        {severityConfig.label}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    return (
      <Badge 
        className="border-0 text-white font-medium"
        style={{ 
          backgroundColor: status === 'unread' ? colors.danger : colors.success
        }}
      >
        {status === 'unread' ? <Bell className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
        {status === 'unread' ? 'Unread' : 'Read'}
      </Badge>
    );
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !filters.search || 
      alert.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      alert.message?.toLowerCase().includes(filters.search.toLowerCase()) ||
      alert.id?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === 'all' || alert.type === filters.type;
    const matchesSeverity = filters.severity === 'all' || alert.severity === filters.severity;
    const matchesStatus = filters.status === 'all' || alert.status === filters.status;
    
    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
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
            Alerts & Notifications
          </h2>
          <p 
            className="transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            Manage system alerts and broadcast notifications
          </p>
        </div>
        <div className="flex gap-3">
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
          {(userRole === 'admin' || userRole === 'operator') && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button
                  style={{ 
                    backgroundColor: colors.buttonPrimary,
                    color: colors.white,
                    border: 'none'
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="sm:max-w-[500px]"
                style={{ 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text
                }}
              >
                <DialogHeader>
                  <DialogTitle 
                    className="transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    Create New Alert
                  </DialogTitle>
                  <DialogDescription style={{ color: colors.textSecondary }}>
                    Broadcast an alert to selected zones or city-wide
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAlert} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" style={{ color: colors.text }}>Alert Title</Label>
                    <Input
                      id="title"
                      value={newAlert.title}
                      onChange={(e) => setNewAlert(prev => ({...prev, title: e.target.value}))}
                      placeholder="Brief alert title"
                      required
                      style={{ 
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alert_type" style={{ color: colors.text }}>Alert Type</Label>
                      <Select 
                        value={newAlert.alert_type} 
                        onValueChange={(value) => setNewAlert(prev => ({...prev, alert_type: value}))}
                      >
                        <SelectTrigger 
                          style={{ 
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        >
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                          {alertTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon 
                                  className="w-4 h-4"
                                  style={{ color: type.color }}
                                />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="severity" style={{ color: colors.text }}>Severity Level</Label>
                      <Select 
                        value={newAlert.severity} 
                        onValueChange={(value) => setNewAlert(prev => ({...prev, severity: value}))}
                      >
                        <SelectTrigger 
                          style={{ 
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            color: colors.text
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                          {severityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" style={{ color: colors.text }}>Alert Message</Label>
                    <Textarea
                      id="message"
                      value={newAlert.message}
                      onChange={(e) => setNewAlert(prev => ({...prev, message: e.target.value}))}
                      placeholder="Detailed alert message"
                      rows={4}
                      required
                      style={{ 
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      style={{ 
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: 'transparent'
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      style={{ 
                        backgroundColor: colors.buttonPrimary,
                        color: colors.white,
                        border: 'none'
                      }}
                    >
                      <Megaphone className="w-4 h-4 mr-2" />
                      Broadcast Alert
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Total Alerts
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {stats.total}
                </p>
              </div>
              <Bell 
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
                  Unread
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {stats.unread}
                </p>
              </div>
              <AlertTriangle 
                className="w-8 h-8"
                style={{ color: colors.danger }}
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
                  Read
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {stats.read}
                </p>
              </div>
              <CheckCircle 
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
                  Critical
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {stats.critical}
                </p>
              </div>
              <Megaphone 
                className="w-8 h-8"
                style={{ color: colors.warning }}
              />
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
            Filter Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Search</Label>
              <div className="relative">
                <Search 
                  className="absolute left-2 top-2.5 h-4 w-4"
                  style={{ color: colors.textMuted }}
                />
                <Input
                  placeholder="Search alerts..."
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
              <Label style={{ color: colors.text }}>Alert Type</Label>
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
                  {alertTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Severity</Label>
              <Select 
                value={filters.severity} 
                onValueChange={(value) => setFilters(prev => ({...prev, severity: value}))}
              >
                <SelectTrigger 
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all">All levels</SelectItem>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
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
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ type: 'all', severity: 'all', status: 'all', search: '' })}
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

      {/* Alerts List */}
      <div className="grid gap-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const typeInfo = alertTypes.find(t => t.value === alert.type);
            const TypeIcon = typeInfo?.icon || Bell;
            
            return (
              <Card 
                key={alert.id} 
                className={`hover:shadow-lg transition-all cursor-pointer border-l-4`}
                style={{ 
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderLeftColor: alert.status === 'unread' ? colors.danger : 
                                 alert.severity === 'high' ? colors.warning : colors.cardBorder
                }}
                onClick={() => {
                  setSelectedAlert(alert);
                  setShowDetailsDialog(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="p-2 rounded-full text-white"
                          style={{ backgroundColor: typeInfo?.color || colors.textMuted }}
                        >
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 
                            className="font-bold text-lg transition-colors duration-300"
                            style={{ color: colors.heading }}
                          >
                            {alert.id}
                          </h3>
                          <p 
                            className="transition-colors duration-300"
                            style={{ color: colors.textSecondary }}
                          >
                            {alert.title}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(alert.status)}
                          {getAlertTypeBadge(alert.type)}
                          {getSeverityBadge(alert.severity)}
                        </div>
                      </div>
                      
                      <p 
                        className="mb-4 text-sm transition-colors duration-300"
                        style={{ color: colors.textSecondary }}
                      >
                        {alert.message}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar 
                            className="w-4 h-4"
                            style={{ color: colors.textMuted }}
                          />
                          <span 
                            className="font-medium"
                            style={{ color: colors.text }}
                          >
                            Time:
                          </span>
                          <span 
                            className="transition-colors duration-300"
                            style={{ color: colors.textSecondary }}
                          >
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ 
                          borderColor: colors.border,
                          color: colors.text,
                          backgroundColor: 'transparent'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(alert);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      {alert.status === 'unread' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(alert.id);
                          }}
                          style={{ 
                            borderColor: colors.success,
                            color: colors.success,
                            backgroundColor: 'transparent'
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
            <CardContent className="text-center py-12">
              <Bell 
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: colors.textMuted }}
              />
              <h3 
                className="text-lg font-medium mb-2 transition-colors duration-300"
                style={{ color: colors.heading }}
              >
                No alerts found
              </h3>
              <p style={{ color: colors.textMuted }}>
                {Object.values(filters).some(f => f !== 'all' && f) ? 
                  'No alerts match the current filters.' : 
                  'No alerts have been created yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alert Details Dialog */}
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
              <Bell className="w-5 h-5" />
              Alert Details - {selectedAlert?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              {/* Header Info */}
              <div 
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: colors.surfaceVariant }}
              >
                <div>
                  <h3 
                    className="text-xl font-semibold transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    {selectedAlert.title}
                  </h3>
                  <p style={{ color: colors.textSecondary }}>{selectedAlert.type}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(selectedAlert.status)}
                  {getSeverityBadge(selectedAlert.severity)}
                </div>
              </div>

              {/* Message */}
              <div>
                <Label 
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Message
                </Label>
                <p 
                  className="mt-1 p-3 rounded border"
                  style={{ 
                    color: colors.text,
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border
                  }}
                >
                  {selectedAlert.message}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Severity Level
                  </Label>
                  <p style={{ color: colors.text }}>
                    {severityLevels.find(s => s.value === selectedAlert.severity)?.label}
                  </p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Status
                  </Label>
                  <p style={{ color: colors.text }}>
                    {selectedAlert.status === 'unread' ? 'Unread' : 'Read'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Created
                  </Label>
                  <p style={{ color: colors.text }}>
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

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
                
                {selectedAlert.status === 'unread' && (
                  <Button 
                    onClick={() => {
                      handleMarkAsRead(selectedAlert.id);
                      setShowDetailsDialog(false);
                    }}
                    style={{ 
                      backgroundColor: colors.success,
                      color: colors.white,
                      border: 'none'
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Read
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

export default EnhancedAlertsManagement;