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
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Edit,
  RefreshCw,
  Filter,
  Search,
  ArrowUpDown
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

const IncidentManagement = ({ userRole }) => {
  const [incidents, setIncidents] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filters, setFilters] = useState({
    zone_id: '',
    status: '',
    search: ''
  });

  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    incident_type: '',
    zone_id: '',
    severity: 3,
    location: ''
  });

  const incidentTypes = [
    { value: 'crowd_alert', label: 'Crowd Alert' },
    { value: 'sos_signal', label: 'SOS Signal' },
    { value: 'fire_emergency', label: 'Fire Emergency' },
    { value: 'medical_emergency', label: 'Medical Emergency' },
    { value: 'security_threat', label: 'Security Threat' },
    { value: 'device_malfunction', label: 'Device Malfunction' }
  ];

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'escalated', label: 'Escalated' }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incidentsData, zonesData] = await Promise.all([
        apiCall(`/incidents?${new URLSearchParams(filters).toString()}`),
        apiCall('/zones')
      ]);
      setIncidents(incidentsData);
      setZones(zonesData);
    } catch (error) {
      toast.error("Failed to fetch incidents data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/incidents', {
        method: 'POST',
        body: JSON.stringify(newIncident)
      });
      
      toast.success("Incident created successfully");
      setShowCreateDialog(false);
      setNewIncident({
        title: '',
        description: '',
        incident_type: '',
        zone_id: '',
        severity: 3,
        location: ''
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create incident");
      console.error(error);
    }
  };

  const handleUpdateIncident = async (incidentId, updateData) => {
    try {
      await apiCall(`/incidents/${incidentId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      toast.success("Incident updated successfully");
      fetchData();
      setShowDetailsDialog(false);
    } catch (error) {
      toast.error("Failed to update incident");
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { variant: "destructive", icon: AlertCircle },
      in_progress: { variant: "default", icon: Clock },
      resolved: { variant: "default", icon: CheckCircle, className: "bg-green-600" },
      escalated: { variant: "secondary", icon: AlertTriangle }
    };
    
    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getSeverityColor = (severity) => {
    if (severity >= 4) return "text-red-600 font-bold";
    if (severity >= 3) return "text-orange-600 font-semibold";
    return "text-yellow-600 font-medium";
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = !filters.search || 
      incident.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      incident.location.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesSearch;
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
            {userRole === 'master_admin' ? 'All-Zone Incident Center' : 'Zone Incident Center'}
          </h2>
          <p className="text-slate-600">Manage and track emergency incidents</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-incident-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Incident</DialogTitle>
                <DialogDescription>
                  Report a new emergency incident that requires attention
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateIncident} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Incident Title</Label>
                    <Input
                      id="title"
                      value={newIncident.title}
                      onChange={(e) => setNewIncident(prev => ({...prev, title: e.target.value}))}
                      placeholder="Brief incident title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incident_type">Incident Type</Label>
                    <Select 
                      value={newIncident.incident_type} 
                      onValueChange={(value) => setNewIncident(prev => ({...prev, incident_type: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zone_id">Zone</Label>
                    <Select 
                      value={newIncident.zone_id} 
                      onValueChange={(value) => setNewIncident(prev => ({...prev, zone_id: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name} ({zone.area_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity (1-5)</Label>
                    <Select 
                      value={newIncident.severity.toString()} 
                      onValueChange={(value) => setNewIncident(prev => ({...prev, severity: parseInt(value)}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            Level {level} {level >= 4 ? '(Critical)' : level >= 3 ? '(High)' : '(Normal)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newIncident.location}
                    onChange={(e) => setNewIncident(prev => ({...prev, location: e.target.value}))}
                    placeholder="Specific location within zone"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newIncident.description}
                    onChange={(e) => setNewIncident(prev => ({...prev, description: e.target.value}))}
                    placeholder="Detailed description of the incident"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="submit-incident-btn">
                    Create Incident
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                  placeholder="Search incidents..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select 
                value={filters.zone_id} 
                onValueChange={(value) => setFilters(prev => ({...prev, zone_id: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-zones" value="">All zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
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
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="empty" value="">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ zone_id: '', status: '', search: '' })}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents ({filteredIncidents.length})</CardTitle>
          <CardDescription>
            {filters.status ? `Showing ${filters.status} incidents` : 'Showing all incidents'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIncidents.length > 0 ? (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  data-testid={`incident-${incident.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{incident.title}</h3>
                        {getStatusBadge(incident.status)}
                        <Badge variant="outline" className={getSeverityColor(incident.severity)}>
                          Severity {incident.severity}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-slate-600">
                        <p><strong>Type:</strong> {incident.incident_type.replace('_', ' ').toUpperCase()}</p>
                        <p><strong>Location:</strong> {incident.location}</p>
                        <p><strong>Zone:</strong> {zones.find(z => z.id === incident.zone_id)?.name || 'Unknown'}</p>
                        <p><strong>Reported:</strong> {new Date(incident.created_at).toLocaleString()}</p>
                        {incident.assigned_to && (
                          <p><strong>Assigned to:</strong> {incident.assigned_to}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIncident(incident);
                          setShowDetailsDialog(true);
                        }}
                        data-testid={`view-incident-${incident.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      {incident.status !== 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateIncident(incident.id, { status: 'resolved' })}
                          data-testid={`resolve-incident-${incident.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No incidents found</h3>
              <p className="text-slate-500 mb-4">
                {Object.values(filters).some(f => f) ? 
                  'No incidents match the current filters.' : 
                  'No incidents have been reported yet.'
                }
              </p>
              {userRole !== 'viewer' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Incident
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incident Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
            <DialogDescription>
              View and manage incident information
            </DialogDescription>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Title</Label>
                  <p className="text-slate-900">{selectedIncident.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedIncident.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Type</Label>
                  <p className="text-slate-900">{selectedIncident.incident_type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Severity</Label>
                  <p className={getSeverityColor(selectedIncident.severity)}>
                    Level {selectedIncident.severity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Location</Label>
                  <p className="text-slate-900">{selectedIncident.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Zone</Label>
                  <p className="text-slate-900">
                    {zones.find(z => z.id === selectedIncident.zone_id)?.name || 'Unknown'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-600">Description</Label>
                <p className="text-slate-900 mt-1">{selectedIncident.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Created</Label>
                  <p className="text-slate-900">{new Date(selectedIncident.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Last Updated</Label>
                  <p className="text-slate-900">{new Date(selectedIncident.updated_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedIncident.notes && selectedIncident.notes.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Notes</Label>
                  <div className="mt-2 space-y-2">
                    {selectedIncident.notes.map((note, index) => (
                      <div key={index} className="bg-slate-50 p-3 rounded border-l-4 border-blue-500">
                        <p className="text-slate-900">{note.text}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(note.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {selectedIncident.status !== 'resolved' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => handleUpdateIncident(selectedIncident.id, { status: 'in_progress' })}
                    >
                      Mark In Progress
                    </Button>
                    <Button 
                      onClick={() => handleUpdateIncident(selectedIncident.id, { status: 'resolved' })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark Resolved
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentManagement;