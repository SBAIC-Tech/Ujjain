import React, { useState, useEffect, useContext } from 'react';
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
  const { colors } = useTheme();
  const { data, updateIncidentStatus } = useData();
  const [incidents, setIncidents] = useState([]);
  const [zones, setZones] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
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
    { value: 'crowd_management', label: 'Overcrowding', color: 'bg-red-500', icon: AlertTriangle },
    { value: 'missing_person', label: 'Missing Child', color: 'bg-orange-500', icon: User },
    { value: 'medical', label: 'Medical Emergency', color: 'bg-blue-500', icon: AlertCircle },
    { value: 'security', label: 'Security Alert', color: 'bg-purple-500', icon: AlertTriangle },
    { value: 'safety', label: 'Safety Hazard', color: 'bg-red-600', icon: AlertCircle },
    { value: 'device_fault', label: 'Device Fault', color: 'bg-gray-500', icon: Camera }
  ];

  // Load data instantly from context
  useEffect(() => {
    if (data) {
      setIncidents(data.incidents);
      setZones(data.zones);
      // Fallback to API if needed
      fetchAdditionalData();
      
      // Calculate stats from context data
      const contextStats = {
        total: data.incidents.length,
        open: data.incidents.filter(i => i.status === 'Open').length,
        inProgress: data.incidents.filter(i => i.status === 'In Progress').length,
        resolved: data.incidents.filter(i => i.status === 'Resolved').length
      };
      setStats(contextStats);
    }
  }, [data]);

  const fetchAdditionalData = async () => {
    try {
      if (userRole === 'admin') {
        const usersData = await apiCall('/users');
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to fetch additional data:', error);
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
      fetchAdditionalData();
    } catch (error) {
      toast.error("Failed to assign responder");
    }
  };

  const handleStatusChange = async (incidentId, status) => {
    try {
      // Update context data immediately
      updateIncidentStatus(incidentId, status);
      
      // Also call API for persistence
      await apiCall(`/incidents/${incidentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      
      toast.success(`Incident marked as ${status.toLowerCase()}`);
      if (status === 'Resolved') {
        setShowDetailsDialog(false);
      }
    } catch (error) {
      toast.error("Failed to update incident status");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Open': { variant: "destructive", icon: AlertCircle, color: colors.danger },
      'In Progress': { variant: "default", icon: Clock, color: colors.warning },
      'Resolved': { variant: "default", icon: CheckCircle, color: colors.success }
    };
    
    const config = statusConfig[status] || statusConfig['Open'];
    const Icon = config.icon;
    
    return (
      <Badge 
        className={`border-0 text-white font-medium`}
        style={{ backgroundColor: config.color }}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getSeverityColor = (severity) => {
    if (severity >= 4) return { borderColor: colors.danger, bgColor: colors.isDark ? colors.surfaceVariant : '#FEF2F2' };
    if (severity >= 3) return { borderColor: colors.warning, bgColor: colors.isDark ? colors.surfaceVariant : '#FFFBEB' };
    return { borderColor: colors.info, bgColor: colors.isDark ? colors.surfaceVariant : '#F0F9FF' };
  };

  const getIncidentTypeInfo = (type) => {
    return incidentTypes.find(t => t.value === type) || incidentTypes[0];
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = !filters.search || 
      incident.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      incident.id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      incident.location?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.type === 'all' || incident.type === filters.type;
    const matchesStatus = filters.status === 'all' || incident.status === filters.status;
    
    return matchesSearch && matchesType && matchesStatus;
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
            Incident Center
          </h2>
          <p 
            className="transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            Real-time incident monitoring and response coordination
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
                  Total Incidents
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {stats.total}
                </p>
              </div>
              <AlertTriangle 
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
                  Open
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {stats.open}
                </p>
              </div>
              <AlertCircle 
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
                  In Progress
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {stats.inProgress}
                </p>
              </div>
              <Clock 
                className="w-8 h-8"
                style={{ color: colors.warning }}
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
                  Resolved
                </p>
                <p 
                  className="text-3xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {stats.resolved}
                </p>
              </div>
              <CheckCircle 
                className="w-8 h-8"
                style={{ color: colors.success }}
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
            Filter Incidents
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
                  placeholder="Search incidents..."
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
              <Label style={{ color: colors.text }}>Zone</Label>
              <Select 
                value={filters.zone} 
                onValueChange={(value) => setFilters(prev => ({...prev, zone: value}))}
              >
                <SelectTrigger 
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <SelectValue placeholder="All zones" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all">All zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Type</Label>
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
                  {incidentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all">All statuses</SelectItem>
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

      {/* Incidents List */}
      <div className="grid gap-4">
        {filteredIncidents.length > 0 ? (
          filteredIncidents.map((incident) => {
            const typeInfo = getIncidentTypeInfo(incident.type);
            const TypeIcon = typeInfo.icon;
            const severityStyle = getSeverityColor(incident.priority === 'Critical' ? 5 : 
                                                 incident.priority === 'High' ? 4 : 
                                                 incident.priority === 'Medium' ? 3 : 2);
            
            return (
              <Card 
                key={incident.id} 
                className="hover:shadow-lg transition-all cursor-pointer border-l-4"
                style={{ 
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderLeftColor: severityStyle.borderColor
                }}
                onClick={() => {
                  setSelectedIncident(incident);
                  setShowDetailsDialog(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="p-2 rounded-full text-white"
                          style={{ backgroundColor: severityStyle.borderColor }}
                        >
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 
                            className="font-bold text-lg transition-colors duration-300"
                            style={{ color: colors.heading }}
                          >
                            {incident.id}
                          </h3>
                          <p 
                            className="transition-colors duration-300"
                            style={{ color: colors.textSecondary }}
                          >
                            {incident.title}
                          </p>
                        </div>
                        {getStatusBadge(incident.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin 
                            className="w-4 h-4"
                            style={{ color: colors.textMuted }}
                          />
                          <span 
                            className="font-medium"
                            style={{ color: colors.text }}
                          >
                            Location:
                          </span>
                          <span 
                            className="transition-colors duration-300"
                            style={{ color: colors.textSecondary }}
                          >
                            {incident.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User 
                            className="w-4 h-4"
                            style={{ color: colors.textMuted }}
                          />
                          <span 
                            className="font-medium"
                            style={{ color: colors.text }}
                          >
                            Assigned:
                          </span>
                          <span 
                            className="transition-colors duration-300"
                            style={{ color: colors.textSecondary }}
                          >
                            {incident.assignedTo || 'Unassigned'}
                          </span>
                        </div>
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
                            {new Date(incident.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className="font-bold"
                            style={{ 
                              borderColor: severityStyle.borderColor,
                              color: severityStyle.borderColor,
                              backgroundColor: 'transparent'
                            }}
                          >
                            {incident.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
            <CardContent className="text-center py-12">
              <AlertTriangle 
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: colors.textMuted }}
              />
              <h3 
                className="text-lg font-medium mb-2 transition-colors duration-300"
                style={{ color: colors.heading }}
              >
                No incidents found
              </h3>
              <p style={{ color: colors.textMuted }}>
                No incidents match the current filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Incident Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent 
          className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto"
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
              <AlertTriangle className="w-5 h-5" />
              Incident Details - {selectedIncident?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="space-y-6">
              {/* Header Info */}
              <div 
                className="grid grid-cols-2 gap-4 p-4 rounded-lg"
                style={{ backgroundColor: colors.surfaceVariant }}
              >
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Title
                  </Label>
                  <p 
                    className="text-lg font-semibold transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    {selectedIncident.title}
                  </p>
                </div>
                <div className="flex justify-end">
                  {getStatusBadge(selectedIncident.status)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Type
                  </Label>
                  <p style={{ color: colors.text }}>{selectedIncident.type}</p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Priority
                  </Label>
                  <p style={{ color: colors.text }}>{selectedIncident.priority}</p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Location
                  </Label>
                  <p style={{ color: colors.text }}>{selectedIncident.location}</p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Time
                  </Label>
                  <p style={{ color: colors.text }}>
                    {new Date(selectedIncident.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label 
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Description
                </Label>
                <p 
                  className="mt-2 p-3 rounded border"
                  style={{ 
                    color: colors.text,
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border
                  }}
                >
                  {selectedIncident.description}
                </p>
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
                
                {selectedIncident.status !== 'Resolved' && userRole !== 'viewer' && (
                  <>
                    {selectedIncident.status === 'Open' && (
                      <Button 
                        onClick={() => handleStatusChange(selectedIncident.id, 'In Progress')}
                        style={{ 
                          backgroundColor: colors.warning,
                          color: colors.white,
                          border: 'none'
                        }}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Mark In Progress
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => handleStatusChange(selectedIncident.id, 'Resolved')}
                      style={{ 
                        backgroundColor: colors.success,
                        color: colors.white,
                        border: 'none'
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
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

export default EnhancedIncidentCenter;