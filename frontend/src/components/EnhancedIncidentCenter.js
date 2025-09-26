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
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Eye,
  UserPlus,
  ArrowUpCircle,
  MapPin,
  Camera,
  Phone,
  User,
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

const EnhancedIncidentCenter = ({ userRole }) => {
  const [incidents, setIncidents] = useState([]);
  const [zones, setZones] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [filters, setFilters] = useState({
    zone: 'all',
    type: 'all',
    status: 'all',
    search: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  const incidentTypes = [
    { value: 'Overcrowding', label: 'Overcrowding', color: 'bg-red-500', icon: AlertTriangle },
    { value: 'Missing Child', label: 'Missing Child', color: 'bg-orange-500', icon: User },
    { value: 'Medical Emergency', label: 'Medical Emergency', color: 'bg-blue-500', icon: AlertCircle },
    { value: 'Flood Risk', label: 'Flood Risk', color: 'bg-purple-500', icon: AlertTriangle },
    { value: 'Fight/Aggression', label: 'Fight/Aggression', color: 'bg-red-600', icon: AlertCircle },
    { value: 'Device Fault', label: 'Device Fault', color: 'bg-gray-500', icon: Camera }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.zone && filters.zone !== 'all') queryParams.set('zone_id', filters.zone);
      if (filters.status && filters.status !== 'all') queryParams.set('status', filters.status);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/incidents?${queryString}` : '/incidents';
      
      const [incidentsData, zonesData, usersData] = await Promise.all([
        apiCall(endpoint),
        apiCall('/zones'),
        userRole === 'Admin' ? apiCall('/users') : Promise.resolve([])
      ]);
      
      setIncidents(incidentsData);
      setZones(zonesData);
      setUsers(usersData);
      
      // Calculate stats
      setStats({
        total: incidentsData.length,
        open: incidentsData.filter(i => i.status === 'Open').length,
        inProgress: incidentsData.filter(i => i.status === 'In Progress').length,
        resolved: incidentsData.filter(i => i.status === 'Resolved').length
      });
      
    } catch (error) {
      toast.error("Failed to fetch incident data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignResponder = async (incidentId, userId) => {
    try {
      await apiCall(`/incidents/${incidentId}`, {
        method: 'PUT',
        body: JSON.stringify({ assigned_to: userId })
      });
      
      const user = users.find(u => u.username === userId);
      toast.success(`Incident assigned to ${user?.username || userId}`);
      setShowAssignDialog(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to assign responder");
    }
  };

  const handleStatusChange = async (incidentId, status) => {
    try {
      await apiCall(`/incidents/${incidentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      
      toast.success(`Incident marked as ${status.toLowerCase()}`);
      fetchData();
      if (status === 'Resolved') {
        setShowDetailsDialog(false);
      }
    } catch (error) {
      toast.error("Failed to update incident status");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Open': { variant: "destructive", icon: AlertCircle, color: "bg-red-500" },
      'In Progress': { variant: "default", icon: Clock, color: "bg-yellow-500" },
      'Resolved': { variant: "default", icon: CheckCircle, color: "bg-green-500" }
    };
    
    const config = statusConfig[status] || statusConfig['Open'];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={status === 'Resolved' ? config.color : ''}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getSeverityColor = (severity) => {
    if (severity >= 4) return "border-l-4 border-red-500 bg-red-50";
    if (severity >= 3) return "border-l-4 border-orange-500 bg-orange-50";
    return "border-l-4 border-yellow-500 bg-yellow-50";
  };

  const getIncidentTypeInfo = (type) => {
    return incidentTypes.find(t => t.value === type) || incidentTypes[0];
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = !filters.search || 
      incident.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      incident.incident_id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      incident.zone?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === 'all' || incident.incident_type === filters.type;
    
    return matchesSearch && matchesType;
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
          <h2 className="text-3xl font-bold text-slate-900">Incident Center</h2>
          <p className="text-slate-600">Real-time incident monitoring and response coordination</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Incidents</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Open</p>
                <p className="text-3xl font-bold text-red-900">{stats.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">In Progress</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Resolved</p>
                <p className="text-3xl font-bold text-green-900">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                value={filters.zone} 
                onValueChange={(value) => setFilters(prev => ({...prev, zone: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-zones" value="all">All zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({...prev, type: value}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-types" value="all">All types</SelectItem>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
                  <SelectItem key="all-status" value="all">All statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => setFilters({ zone: 'all', type: 'all', status: 'all', search: '' })}
                className="w-full"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <div className="grid gap-4">
        {filteredIncidents.length > 0 ? (
          filteredIncidents.map((incident) => {
            const typeInfo = getIncidentTypeInfo(incident.incident_type);
            const TypeIcon = typeInfo.icon;
            
            return (
              <Card 
                key={incident.id} 
                className={`hover:shadow-lg transition-all cursor-pointer ${getSeverityColor(incident.severity)}`}
                onClick={() => {
                  setSelectedIncident(incident);
                  setShowDetailsDialog(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-full ${typeInfo.color} text-white`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900">{incident.incident_id}</h3>
                          <p className="text-slate-600">{incident.title}</p>
                        </div>
                        {getStatusBadge(incident.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Zone:</span>
                          <span className="text-slate-700">{incident.zone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Source:</span>
                          <span className="text-slate-700">{incident.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Time:</span>
                          <span className="text-slate-700">
                            {new Date(incident.time).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Assigned:</span>
                          <span className="text-slate-700">{incident.assigned_to || 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Badge 
                        variant="outline" 
                        className={`font-bold ${
                          incident.severity >= 4 ? 'text-red-700 border-red-300' : 
                          incident.severity >= 3 ? 'text-orange-700 border-orange-300' : 'text-yellow-700 border-yellow-300'
                        }`}
                      >
                        Severity {incident.severity}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No incidents found</h3>
              <p className="text-slate-500">No incidents match the current filters.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Incident Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Incident Details - {selectedIncident?.incident_id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Title</Label>
                  <p className="text-lg font-semibold text-slate-900">{selectedIncident.title}</p>
                </div>
                <div className="flex justify-end">
                  {getStatusBadge(selectedIncident.status)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Type</Label>
                  <p className="text-slate-900">{selectedIncident.incident_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Severity</Label>
                  <p className="text-slate-900">Level {selectedIncident.severity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Zone</Label>
                  <p className="text-slate-900">{selectedIncident.zone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Source</Label>
                  <p className="text-slate-900">{selectedIncident.source}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Location</Label>
                  <p className="text-slate-900">{selectedIncident.location}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Time</Label>
                  <p className="text-slate-900">{new Date(selectedIncident.time).toLocaleString()}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-medium text-slate-600">Description</Label>
                <p className="text-slate-900 mt-2 p-3 bg-slate-50 rounded border">{selectedIncident.description}</p>
              </div>

              {/* Assignment */}
              <div>
                <Label className="text-sm font-medium text-slate-600">Current Assignment</Label>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-slate-900">{selectedIncident.assigned_to || 'Unassigned'}</p>
                  {userRole === 'Admin' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAssignDialog(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Change Assignment
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                
                {selectedIncident.status !== 'Resolved' && userRole !== 'Viewer' && (
                  <>
                    {selectedIncident.status === 'Open' && (
                      <Button 
                        variant="outline"
                        onClick={() => handleStatusChange(selectedIncident.incident_id, 'In Progress')}
                        className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Mark In Progress
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => handleStatusChange(selectedIncident.incident_id, 'Resolved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Resolved
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Escalate
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Responder</DialogTitle>
            <DialogDescription>
              Select a responder to assign to incident {selectedIncident?.incident_id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-3">
              {users.filter(u => u.role === 'Responder' || u.role === 'Zone Operator').map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleAssignResponder(selectedIncident?.incident_id, user.username)}
                >
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-slate-600">{user.role}</p>
                  </div>
                  <Badge variant="outline">{user.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedIncidentCenter;