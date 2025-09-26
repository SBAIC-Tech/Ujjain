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
  Filter
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

const AlertsManagement = ({ userRole }) => {
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState({
    alert_type: '',
    severity: '',
    search: ''
  });

  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    alert_type: '',
    severity: 3,
    zone_ids: [],
    expires_at: null
  });

  const alertTypes = [
    { value: 'emergency', label: 'Emergency Alert', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'warning', label: 'Warning', icon: Volume2, color: 'text-orange-600' },
    { value: 'information', label: 'Information', icon: Bell, color: 'text-blue-600' },
    { value: 'maintenance', label: 'Maintenance', icon: Clock, color: 'text-yellow-600' },
    { value: 'evacuation', label: 'Evacuation', icon: Megaphone, color: 'text-red-700' }
  ];

  const severityLevels = [
    { value: 1, label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 2, label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' },
    { value: 3, label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 4, label: 'Critical', color: 'bg-red-100 text-red-800' },
    { value: 5, label: 'Emergency', color: 'bg-red-200 text-red-900 font-bold' }
  ];

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

  const getAlertTypeBadge = (alertType) => {
    const typeConfig = alertTypes.find(t => t.value === alertType);
    if (!typeConfig) return null;
    
    const Icon = typeConfig.icon;
    
    return (
      <Badge variant="outline" className={typeConfig.color}>
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

  const getStatusBadge = (alert) => {
    const now = new Date();
    const isExpired = alert.expires_at && new Date(alert.expires_at) < now;
    
    if (!alert.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-600">Active</Badge>;
  };

  const isAlertActive = (alert) => {
    const now = new Date();
    const isExpired = alert.expires_at && new Date(alert.expires_at) < now;
    return alert.is_active && !isExpired;
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !filters.search || 
      alert.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      alert.message.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = !filters.alert_type || alert.alert_type === filters.alert_type;
    const matchesSeverity = !filters.severity || alert.severity.toString() === filters.severity;
    
    return matchesSearch && matchesType && matchesSeverity;
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {userRole === 'master_admin' ? 'Alerts & Notifications' : 'Zone Alerts & Notifications'}
          </h2>
          <p className="text-slate-600">Broadcast alerts and manage notifications</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {(userRole === 'master_admin' || userRole === 'zone_manager') && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="create-alert-btn">
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
                                <type.icon className={`w-4 h-4 ${type.color}`} />
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

                  <div className="space-y-2">
                    <Label>Target Zones</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="citywide"
                          name="zone_selection"
                          checked={newAlert.zone_ids.length === 0}
                          onChange={() => setNewAlert(prev => ({...prev, zone_ids: []}))}
                        />
                        <Label htmlFor="citywide" className="font-normal">City-wide alert (all zones)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="specific_zones"
                          name="zone_selection"
                          checked={newAlert.zone_ids.length > 0}
                          onChange={() => {
                            if (newAlert.zone_ids.length === 0) {
                              setNewAlert(prev => ({...prev, zone_ids: [zones[0]?.id || '']}));
                            }
                          }}
                        />
                        <Label htmlFor="specific_zones" className="font-normal">Specific zones</Label>
                      </div>
                    </div>
                    
                    {newAlert.zone_ids.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                        {zones.map((zone) => (
                          <label key={zone.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newAlert.zone_ids.includes(zone.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewAlert(prev => ({
                                    ...prev,
                                    zone_ids: [...prev.zone_ids, zone.id]
                                  }));
                                } else {
                                  setNewAlert(prev => ({
                                    ...prev,
                                    zone_ids: prev.zone_ids.filter(id => id !== zone.id)
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{zone.name} ({zone.area_code})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expires_at">Expiry Time (Optional)</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={newAlert.expires_at || ''}
                      onChange={(e) => setNewAlert(prev => ({...prev, expires_at: e.target.value || null}))}
                    />
                    <p className="text-xs text-slate-500">
                      Leave empty for alerts that don't expire automatically
                    </p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="submit-alert-btn">
                      Broadcast Alert
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Alerts</p>
                <p className="text-2xl font-bold text-slate-900">{alerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Alerts</p>
                <p className="text-2xl font-bold text-green-600">
                  {alerts.filter(isAlertActive).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.severity >= 4 && isAlertActive(a)).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">City-wide</p>
                <p className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.zone_ids.length === 0 && isAlertActive(a)).length}
                </p>
              </div>
              <Megaphone className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                value={filters.alert_type} 
                onValueChange={(value) => setFilters(prev => ({...prev, alert_type: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
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
                  <SelectItem value="">All levels</SelectItem>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      Level {level.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ alert_type: '', severity: '', search: '' })}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts ({filteredAlerts.length})</CardTitle>
          <CardDescription>
            Active and historical alert notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-4 hover:bg-slate-50 transition-colors ${
                    isAlertActive(alert) && alert.severity >= 4 ? 'border-red-200 bg-red-50' : ''
                  }`}
                  data-testid={`alert-${alert.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                        {getStatusBadge(alert)}
                        {getAlertTypeBadge(alert.alert_type)}
                        {getSeverityBadge(alert.severity)}
                      </div>
                      
                      <p className="text-slate-700 mb-3">{alert.message}</p>
                      
                      <div className="space-y-1 text-sm text-slate-600">
                        <p><strong>Scope:</strong> {
                          alert.zone_ids.length === 0 ? 
                            'City-wide' : 
                            `Zones: ${alert.zone_ids.map(zoneId => zones.find(z => z.id === zoneId)?.area_code).filter(Boolean).join(', ')}`
                        }</p>
                        <p><strong>Created:</strong> {new Date(alert.created_at).toLocaleString()}</p>
                        {alert.expires_at && (
                          <p><strong>Expires:</strong> {new Date(alert.expires_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setShowDetailsDialog(true);
                        }}
                        data-testid={`view-alert-${alert.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No alerts found</h3>
              <p className="text-slate-500 mb-4">
                {Object.values(filters).some(f => f) ? 
                  'No alerts match the current filters.' : 
                  'No alerts have been created yet.'
                }
              </p>
              {(userRole === 'master_admin' || userRole === 'zone_manager') && !Object.values(filters).some(f => f) && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Alert
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              View alert information and broadcast details
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              {/* Alert Header */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{selectedAlert.title}</h3>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(selectedAlert)}
                    {getAlertTypeBadge(selectedAlert.alert_type)}
                    {getSeverityBadge(selectedAlert.severity)}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Message</Label>
                <p className="text-slate-900 mt-1 p-3 bg-slate-50 rounded">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Alert Type</Label>
                  <p className="text-slate-900">{alertTypes.find(t => t.value === selectedAlert.alert_type)?.label}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Severity Level</Label>
                  <p className="text-slate-900">
                    Level {selectedAlert.severity} - {severityLevels.find(s => s.value === selectedAlert.severity)?.label}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Target Zones</Label>
                <p className="text-slate-900">
                  {selectedAlert.zone_ids.length === 0 ? 
                    'City-wide (all zones)' : 
                    selectedAlert.zone_ids.map(zoneId => {
                      const zone = zones.find(z => z.id === zoneId);
                      return zone ? `${zone.name} (${zone.area_code})` : 'Unknown Zone';
                    }).join(', ')
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Created</Label>
                  <p className="text-slate-900">{new Date(selectedAlert.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Expires</Label>
                  <p className="text-slate-900">
                    {selectedAlert.expires_at ? 
                      new Date(selectedAlert.expires_at).toLocaleString() : 
                      'No expiration'
                    }
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {(userRole === 'master_admin' || userRole === 'zone_manager') && isAlertActive(selectedAlert) && (
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    Deactivate Alert
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

export default AlertsManagement;