import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Users, 
  RefreshCw,
  Search,
  Eye,
  Edit,
  Shield,
  UserCheck,
  UserX,
  Crown,
  MapPin,
  Clock,
  User,
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

const EnhancedUserManagement = ({ userRole }) => {
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
    assigned_zones: []
  });

  const roleOptions = [
    { 
      value: 'Admin', 
      label: 'Master Admin', 
      icon: Crown, 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-100', 
      borderColor: 'border-purple-300',
      description: 'Full system access and administration' 
    },
    { 
      value: 'Zone Operator', 
      label: 'Zone Operator', 
      icon: Shield, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-100', 
      borderColor: 'border-blue-300',
      description: 'Zone-level management and operations' 
    },
    { 
      value: 'Responder', 
      label: 'Responder', 
      icon: UserCheck, 
      color: 'text-green-600', 
      bgColor: 'bg-green-100', 
      borderColor: 'border-green-300',
      description: 'Incident response team member' 
    },
    { 
      value: 'Viewer', 
      label: 'Viewer', 
      icon: Eye, 
      color: 'text-slate-600', 
      bgColor: 'bg-slate-100', 
      borderColor: 'border-slate-300',
      description: 'Read-only access to assigned zones' 
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, zonesData] = await Promise.all([
        apiCall('/users'),
        apiCall('/zones')
      ]);
      setUsers(usersData);
      setZones(zonesData);
    } catch (error) {
      toast.error("Failed to fetch users data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      
      toast.success(`User ${newUser.username} created successfully`);
      setShowCreateDialog(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: '',
        assigned_zones: []
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create user");
      console.error(error);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = roleOptions.find(r => r.value === role);
    if (!roleConfig) return null;
    
    const Icon = roleConfig.icon;
    
    return (
      <Badge variant="outline" className={`${roleConfig.bgColor} ${roleConfig.color} ${roleConfig.borderColor}`}>
        <Icon className="w-3 h-3 mr-1" />
        {roleConfig.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive, lastLogin) => {
    const isOnline = lastLogin && (new Date() - new Date(lastLogin)) < 30 * 60 * 1000; // 30 minutes
    
    if (!isActive) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
          <UserX className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className={isOnline ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-800 border-gray-300"}>
        {isOnline ? <UserCheck className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
        {isOnline ? "Online" : "Offline"}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleStats = () => {
    return roleOptions.map(role => ({
      ...role,
      count: users.filter(u => u.role === role.value).length
    }));
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
          <h2 className="text-3xl font-bold text-slate-900">User & Role Management</h2>
          <p className="text-slate-600">Manage system users and their access permissions</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {userRole === 'Admin' && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system with appropriate role and permissions
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser(prev => ({...prev, username: e.target.value}))}
                        placeholder="Enter username"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({...prev, email: e.target.value}))}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({...prev, password: e.target.value}))}
                      placeholder="Enter password"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(value) => setNewUser(prev => ({...prev, role: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <role.icon className={`w-4 h-4 ${role.color}`} />
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-xs text-slate-500">{role.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(newUser.role === 'Zone Operator' || newUser.role === 'Responder') && (
                    <div className="space-y-2">
                      <Label>Assigned Zones</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                        {zones.map((zone) => (
                          <label key={zone.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newUser.assigned_zones.includes(zone.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewUser(prev => ({
                                    ...prev,
                                    assigned_zones: [...prev.assigned_zones, zone.id]
                                  }));
                                } else {
                                  setNewUser(prev => ({
                                    ...prev,
                                    assigned_zones: prev.assigned_zones.filter(id => id !== zone.id)
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{zone.name} ({zone.area_code})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Create User
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {getRoleStats().map((role) => {
          const Icon = role.icon;
          
          return (
            <Card key={role.value} className={`${role.bgColor} ${role.borderColor}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${role.color}`}>{role.label}s</p>
                    <p className={`text-3xl font-bold ${role.color}`}>{role.count}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${role.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Filter by Role</Label>
              <Select 
                value={roleFilter} 
                onValueChange={(value) => setRoleFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all-roles" value="all">All roles</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                }}
                className="w-full"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const roleConfig = roleOptions.find(r => r.value === user.role);
            
            return (
              <Card 
                key={user.id} 
                className={`hover:shadow-lg transition-shadow cursor-pointer ${roleConfig?.bgColor} ${roleConfig?.borderColor}`}
                onClick={() => {
                  setSelectedUser(user);
                  setShowDetailsDialog(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white rounded-lg">
                          <User className="w-6 h-6 text-slate-700" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-slate-900">{user.username}</h3>
                          <p className="text-slate-600">{user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.is_active, user.last_login)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Role:</span>
                          <p className="font-medium">{roleConfig?.label}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Status:</span>
                          <p className="font-medium">{user.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Created:</span>
                          <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Last Login:</span>
                          <p className="font-medium">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>

                      {user.assigned_zones && user.assigned_zones.length > 0 && (
                        <div className="mt-3">
                          <span className="text-slate-600 text-sm">Assigned Zones:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.assigned_zones.map(zoneId => {
                              const zone = zones.find(z => z.id === zoneId);
                              return zone ? (
                                <Badge key={zoneId} variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {zone.area_code}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(user);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      {userRole === 'Admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
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
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || roleFilter !== 'all' ? 
                  'No users match the current filters.' : 
                  'No users have been created yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Details - {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="p-3 bg-white rounded-lg">
                  <User className="w-8 h-8 text-slate-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">{selectedUser.username}</h3>
                  <p className="text-slate-600">{selectedUser.email}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {getRoleBadge(selectedUser.role)}
                  {getStatusBadge(selectedUser.is_active, selectedUser.last_login)}
                </div>
              </div>

              {/* Role Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Role</Label>
                  <p className="text-slate-900">
                    {roleOptions.find(r => r.value === selectedUser.role)?.label}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Account Status</Label>
                  <p className="text-slate-900">{selectedUser.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Created</Label>
                  <p className="text-slate-900">{new Date(selectedUser.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Last Login</Label>
                  <p className="text-slate-900">
                    {selectedUser.last_login ? 
                      new Date(selectedUser.last_login).toLocaleString() : 
                      'Never logged in'
                    }
                  </p>
                </div>
              </div>

              {/* Assigned Zones */}
              {selectedUser.assigned_zones && selectedUser.assigned_zones.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Assigned Zones</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {selectedUser.assigned_zones.map(zoneId => {
                      const zone = zones.find(z => z.id === zoneId);
                      return zone ? (
                        <div key={zoneId} className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">{zone.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {zone.area_code}
                          </Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Role Permissions */}
              <div>
                <Label className="text-sm font-medium text-slate-600">Permissions & Access</Label>
                <div className="mt-2 space-y-2 text-sm">
                  {selectedUser.role === 'Admin' && (
                    <div className="space-y-1">
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Full system administration</p>
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Manage all zones and users</p>
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> View all incidents and devices</p>
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> System configuration and analytics</p>
                    </div>
                  )}
                  {selectedUser.role === 'Zone Operator' && (
                    <div className="space-y-1">
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Manage assigned zones</p>
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Create and assign incidents</p>
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Monitor zone devices</p>
                      <p className="flex items-center gap-2"><UserX className="w-4 h-4 text-red-600" /> Limited to assigned zones only</p>
                    </div>
                  )}
                  {selectedUser.role === 'Responder' && (
                    <div className="space-y-1">
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Respond to incidents</p>
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Update incident status</p>
                      <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> View assigned zone data</p>
                      <p className="flex items-center gap-2"><UserX className="w-4 h-4 text-red-600" /> No user management access</p>
                    </div>
                  )}
                  {selectedUser.role === 'Viewer' && (
                    <div className="space-y-1">
                      <p className="flex items-center gap-2"><Eye className="w-4 h-4 text-blue-600" /> View assigned zone data</p>
                      <p className="flex items-center gap-2"><Eye className="w-4 h-4 text-blue-600" /> View incidents (read-only)</p>
                      <p className="flex items-center gap-2"><UserX className="w-4 h-4 text-red-600" /> No modification permissions</p>
                      <p className="flex items-center gap-2"><UserX className="w-4 h-4 text-red-600" /> No administrative access</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                {userRole === 'Admin' && (
                  <Button variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit User
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

export default EnhancedUserManagement;