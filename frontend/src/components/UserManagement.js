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
  MapPin
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

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: '',
    assigned_zones: []
  });

  const roleOptions = [
    { value: 'master_admin', label: 'Master Admin', icon: Crown, color: 'text-purple-600', description: 'Full system access' },
    { value: 'zone_manager', label: 'Zone Manager', icon: Shield, color: 'text-blue-600', description: 'Zone-level management' },
    { value: 'responder', label: 'Responder', icon: UserCheck, color: 'text-green-600', description: 'Incident response team' },
    { value: 'viewer', label: 'Viewer', icon: Eye, color: 'text-slate-600', description: 'Read-only access' }
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
      
      toast.success("User created successfully");
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
      <Badge variant="outline" className={roleConfig.color}>
        <Icon className="w-3 h-3 mr-1" />
        {roleConfig.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-600" : ""}>
        {isActive ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
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
          <h2 className="text-2xl font-bold text-slate-900">User & Role Management</h2>
          <p className="text-slate-600">Manage system users and their permissions</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-user-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create User
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

                {(newUser.role === 'zone_manager' || newUser.role === 'responder') && (
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
                  <Button type="submit" data-testid="submit-user-btn">
                    Create User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {roleOptions.map((role) => {
          const count = users.filter(u => u.role === role.value).length;
          const Icon = role.icon;
          
          return (
            <Card key={role.value}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{role.label}s</p>
                    <p className={`text-2xl font-bold ${role.color}`}>{count}</p>
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
        <CardContent className="p-4">
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
                  <SelectItem value="">All roles</SelectItem>
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
                  setRoleFilter('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage system users and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  data-testid={`user-${user.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{user.username}</h3>
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.is_active)}
                      </div>
                      
                      <div className="space-y-1 text-sm text-slate-600">
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                        {user.last_login && (
                          <p><strong>Last Login:</strong> {new Date(user.last_login).toLocaleString()}</p>
                        )}
                        {user.assigned_zones.length > 0 && (
                          <div className="flex items-center gap-1">
                            <strong>Zones:</strong>
                            <div className="flex gap-1 flex-wrap">
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
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetailsDialog(true);
                        }}
                        data-testid={`view-user-${user.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`edit-user-${user.id}`}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm || roleFilter ? 
                  'No users match the current filters.' : 
                  'No users have been created yet.'
                }
              </p>
              {!searchTerm && !roleFilter && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First User
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View user information and permissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* User Header */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{selectedUser.username}</h3>
                  <p className="text-slate-600">{selectedUser.email}</p>
                </div>
                <div className="flex gap-2">
                  {getRoleBadge(selectedUser.role)}
                  {getStatusBadge(selectedUser.is_active)}
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
                  <Label className="text-sm font-medium text-slate-600">Status</Label>
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
                      'Never'
                    }
                  </p>
                </div>
              </div>

              {/* Assigned Zones */}
              {selectedUser.assigned_zones.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-slate-600">Assigned Zones</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUser.assigned_zones.map(zoneId => {
                      const zone = zones.find(z => z.id === zoneId);
                      return zone ? (
                        <Badge key={zoneId} variant="outline">
                          <MapPin className="w-3 h-3 mr-1" />
                          {zone.name} ({zone.area_code})
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Role Permissions */}
              <div>
                <Label className="text-sm font-medium text-slate-600">Permissions</Label>
                <div className="mt-2 space-y-1 text-sm">
                  {selectedUser.role === 'master_admin' && (
                    <div className="space-y-1">
                      <p>✅ Full system administration</p>
                      <p>✅ Manage all zones and users</p>
                      <p>✅ View all incidents and devices</p>
                      <p>✅ System configuration</p>
                    </div>
                  )}
                  {selectedUser.role === 'zone_manager' && (
                    <div className="space-y-1">
                      <p>✅ Manage assigned zones</p>
                      <p>✅ Create and assign incidents</p>
                      <p>✅ Monitor zone devices</p>
                      <p>✅ Manage local team</p>
                    </div>
                  )}
                  {selectedUser.role === 'responder' && (
                    <div className="space-y-1">
                      <p>✅ Respond to incidents</p>
                      <p>✅ Update incident status</p>
                      <p>✅ View assigned zone data</p>
                      <p>❌ User management</p>
                    </div>
                  )}
                  {selectedUser.role === 'viewer' && (
                    <div className="space-y-1">
                      <p>✅ View assigned zone data</p>
                      <p>✅ View incidents (read-only)</p>
                      <p>❌ Create or modify data</p>
                      <p>❌ User management</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;