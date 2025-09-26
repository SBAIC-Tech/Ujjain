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
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
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
    severity: 3,
    zone_ids: [],
    expires_at: null
  });

  const alertTypes = [
    { value: 'Overcrowding', label: 'Overcrowding', icon: User, color: 'bg-red-500', textColor: 'text-red-700' },
    { value: 'Missing Child', label: 'Missing Child', icon: User, color: 'bg-orange-500', textColor: 'text-orange-700' },
    { value: 'Medical Emergency', label: 'Medical Emergency', icon: AlertTriangle, color: 'bg-blue-500', textColor: 'text-blue-700' },
    { value: 'Flood Risk', label: 'Flood Risk', icon: AlertTriangle, color: 'bg-purple-500', textColor: 'text-purple-700' },
    { value: 'Fight/Aggression', label: 'Fight/Aggression', icon: AlertCircle, color: 'bg-red-600', textColor: 'text-red-700' },
    { value: 'Device Fault', label: 'Device Fault', icon: Camera, color: 'bg-gray-500', textColor: 'text-gray-700' }
  ];

  const severityLevels = [
    { value: 1, label: 'Low', color: 'bg-green-100 text-green-800 border-green-300' },
    { value: 2, label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { value: 3, label: 'High', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    { value: 4, label: 'Critical', color: 'bg-red-100 text-red-800 border-red-300' },
    { value: 5, label: 'Emergency', color: 'bg-red-200 text-red-900 border-red-400 font-bold' }
  ];

  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    critical: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsData, zonesData] = await Promise.all([
        apiCall('/alerts'),
        apiCall('/zones')
      ]);
      
      setAlerts(alertsData);
      setZones(zonesData);
      
      // Calculate stats
      setStats({
        total: alertsData.length,
        unread: alertsData.filter(a => a.status === 'Unread').length,
        read: alertsData.filter(a => a.status === 'Read').length,
        critical: alertsData.filter(a => a.severity >= 4).length
      });
      
    } catch (error) {
      toast.error("Failed to fetch alerts data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
        severity: 3,
        zone_ids: [],
        expires_at: null
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create alert");
      console.error(error);
    }
  };

  const handleMarkAsRead = async (alertId) => {
    try {
      await apiCall(`/alerts/${alertId}/status?status=Read`, { method: 'PUT' });
      toast.success("Alert marked as read");
      fetchData();
    } catch (error) {
      toast.error("Failed to update alert status");
    }
  };

  const getAlertTypeBadge = (alertType) => {
    const typeConfig = alertTypes.find(t => t.value === alertType);
    if (!typeConfig) return null;
    
    const Icon = typeConfig.icon;
    
    return (
      <Badge variant="outline" className={`${typeConfig.textColor} border-current`}>
        <Icon className="w-3 h-3 mr-1" />
        {typeConfig.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity) => {
    const severityConfig = severityLevels.find(s => s.value === severity);
    if (!severityConfig) return null;
    
    return (
      <Badge className={severityConfig.color}>
        Level {severity} - {severityConfig.label}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    return (
      <Badge variant={status === 'Unread' ? 'destructive' : 'default'} 
             className={status === 'Read' ? 'bg-green-600' : ''}>
        {status === 'Unread' ? <Bell className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
        {status}
      </Badge>
    );
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !filters.search || 
      alert.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      alert.message?.toLowerCase().includes(filters.search.toLowerCase()) ||
      alert.alert_id?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === 'all' || alert.alert_type === filters.type;
    const matchesSeverity = filters.severity === 'all' || alert.severity.toString() === filters.severity;
    const matchesStatus = filters.status === 'all' || alert.status === filters.status;
    
    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
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
          <h2 className="text-3xl font-bold text-slate-900">Alerts & Notifications</h2>
          <p className="text-slate-600">Manage system alerts and broadcast notifications</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {(userRole === 'Admin' || userRole === 'Zone Operator') && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Alert</DialogTitle>
                  <DialogDescription>
                    Broadcast an alert to selected zones or city-wide
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAlert} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Alert Title</Label>
                    <Input
                      id="title"
                      value={newAlert.title}
                      onChange={(e) => setNewAlert(prev => ({...prev, title: e.target.value}))}
                      placeholder="Brief alert title"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alert_type">Alert Type</Label>
                      <Select 
                        value={newAlert.alert_type} 
                        onValueChange={(value) => setNewAlert(prev => ({...prev, alert_type: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select alert type" />
                        </SelectTrigger>
                        <SelectContent>
                          {alertTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className={`w-4 h-4 ${type.textColor}`} />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity Level</Label>
                      <Select 
                        value={newAlert.severity.toString()} 
                        onValueChange={(value) => setNewAlert(prev => ({...prev, severity: parseInt(value)}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {severityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value.toString()}>
                              Level {level.value} - {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zone">Zone</Label>
                      <Select 
                        value={newAlert.zone} 
                        onValueChange={(value) => setNewAlert(prev => ({...prev, zone: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.name}>
                              {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Input
                        id="source"
                        value={newAlert.source}
                        onChange={(e) => setNewAlert(prev => ({...prev, source: e.target.value}))}
                        placeholder="e.g., CAM105, SOS021"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Alert Message</Label>
                    <Textarea
                      id="message"
                      value={newAlert.message}
                      onChange={(e) => setNewAlert(prev => ({...prev, message: e.target.value}))}
                      placeholder="Detailed alert message"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
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
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Alerts</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Unread</p>
                <p className="text-3xl font-bold text-red-900">{stats.unread}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Read</p>
                <p className="text-3xl font-bold text-green-900">{stats.read}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Critical</p>
                <p className="text-3xl font-bold text-purple-900">{stats.critical}</p>
              </div>
              <Megaphone className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search alerts..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Alert Type</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({...prev, type: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-types" value="all">All types</SelectItem>
                  {alertTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select 
                value={filters.severity} 
                onValueChange={(value) => setFilters(prev => ({...prev, severity: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-levels" value="all">All levels</SelectItem>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      Level {level.value}
                    </SelectItem>
                  ))}
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
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-status" value="all">All status</SelectItem>
                  <SelectItem value="Unread">Unread</SelectItem>
                  <SelectItem value="Read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ type: 'all', severity: 'all', status: 'all', search: '' })}
                className="w-full"
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
            const typeInfo = alertTypes.find(t => t.value === alert.alert_type);
            const TypeIcon = typeInfo?.icon || Bell;
            
            return (
              <Card 
                key={alert.id} 
                className={`hover:shadow-lg transition-all cursor-pointer ${
                  alert.status === 'Unread' ? 'border-l-4 border-red-500 bg-red-50' : 
                  alert.severity >= 4 ? 'border-l-4 border-orange-500 bg-orange-50' : ''
                }`}
                onClick={() => {
                  setSelectedAlert(alert);
                  setShowDetailsDialog(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-full ${typeInfo?.color || 'bg-gray-500'} text-white`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{alert.alert_id}</h3>
                          <p className="text-slate-600">{alert.title}</p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(alert.status)}
                          {getAlertTypeBadge(alert.alert_type)}
                          {getSeverityBadge(alert.severity)}
                        </div>
                      </div>
                      
                      <p className="text-slate-700 mb-4 text-sm">{alert.message}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Zone:</span>
                          <span className="text-slate-700">{alert.zone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Source:</span>
                          <span className="text-slate-700">{alert.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Time:</span>
                          <span className="text-slate-700">
                            {new Date(alert.time).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Created by:</span>
                          <span className="text-slate-700">{alert.created_by}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(alert);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      {alert.status === 'Unread' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(alert.alert_id);
                          }}
                          className="text-green-700 border-green-300 hover:bg-green-50"
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
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No alerts found</h3>
              <p className="text-slate-500 mb-4">
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Alert Details - {selectedAlert?.alert_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{selectedAlert.title}</h3>
                  <p className="text-slate-600">{selectedAlert.alert_type}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(selectedAlert.status)}
                  {getSeverityBadge(selectedAlert.severity)}
                </div>
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm font-medium text-slate-600">Message</Label>
                <p className="text-slate-900 mt-1 p-3 bg-slate-50 rounded border">{selectedAlert.message}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Zone</Label>
                  <p className="text-slate-900">{selectedAlert.zone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Source</Label>
                  <p className="text-slate-900">{selectedAlert.source}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Severity Level</Label>
                  <p className="text-slate-900">
                    Level {selectedAlert.severity} - {severityLevels.find(s => s.value === selectedAlert.severity)?.label}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <p className="text-slate-900">{selectedAlert.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Created</Label>
                  <p className="text-slate-900">{new Date(selectedAlert.time).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Created By</Label>
                  <p className="text-slate-900">{selectedAlert.created_by}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                
                {selectedAlert.status === 'Unread' && (
                  <Button 
                    onClick={() => {
                      handleMarkAsRead(selectedAlert.alert_id);
                      setShowDetailsDialog(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
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