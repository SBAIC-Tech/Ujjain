import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
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
  Filter,
  CheckCircle
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
  const { colors } = useTheme();
  const { data } = useData();
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
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
      value: 'admin', 
      label: 'Master Admin', 
      icon: Crown, 
      description: 'Full system access and administration' 
    },
    { 
      value: 'operator', 
      label: 'Zone Operator', 
      icon: Shield, 
      description: 'Zone-level management and operations' 
    },
    { 
      value: 'responder', 
      label: 'Responder', 
      icon: UserCheck, 
      description: 'Incident response team member' 
    },
    { 
      value: 'viewer', 
      label: 'Viewer', 
      icon: Eye, 
      description: 'Read-only access to assigned zones' 
    }
  ];

  // Sample users data to show immediately
  const sampleUsers = [
    {
      id: 'user1',
      username: 'admin1',
      email: 'admin1@cityhub.com',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      last_login: new Date(),
      assigned_zones: []
    },
    {
      id: 'user2',
      username: 'operator1',
      email: 'operator1@cityhub.com',
      role: 'operator',
      is_active: true,
      created_at: new Date(Date.now() - 86400000),
      last_login: new Date(Date.now() - 3600000),
      assigned_zones: ['ZONE001', 'ZONE002']
    },
    {
      id: 'user3',
      username: 'responder1',
      email: 'responder1@cityhub.com',
      role: 'responder',
      is_active: true,
      created_at: new Date(Date.now() - 172800000),
      last_login: new Date(Date.now() - 7200000),
      assigned_zones: ['ZONE001']
    }
  ];

  // Load data instantly from context or use sample data
  useEffect(() => {
    if (data) {
      setZones(data.zones);
      // If we have user data from context, use it, otherwise use sample data
      setUsers(sampleUsers);
      fetchAdditionalData();
    } else {
      setUsers(sampleUsers);
      setZones([]);
    }
  }, [data]);

  const fetchAdditionalData = async () => {
    try {
      if (userRole === 'admin') {
        const [usersData, zonesData] = await Promise.all([
          apiCall('/users'),
          apiCall('/zones')
        ]);
        setUsers(usersData);
        setZones(zonesData);
      }
    } catch (error) {
      console.error('Failed to fetch additional data:', error);
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
      fetchAdditionalData();
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
      <Badge 
        variant="outline" 
        className="border-0 text-white font-medium"
        style={{ backgroundColor: colors.buttonPrimary }}
      >
        <Icon className="w-3 h-3 mr-1" />
        {roleConfig.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive, lastLogin) => {
    const isOnline = lastLogin && (new Date() - new Date(lastLogin)) < 30 * 60 * 1000; // 30 minutes
    
    if (!isActive) {
      return (
        <Badge 
          variant="secondary" 
          className="border-0 text-white font-medium"
          style={{ backgroundColor: colors.danger }}
        >
          <UserX className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }
    
    return (
      <Badge 
        variant="outline" 
        className="border-0 text-white font-medium"
        style={{ backgroundColor: isOnline ? colors.success : colors.textMuted }}
      >
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
            User & Role Management
          </h2>
          <p 
            className="transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            Manage system users and their access permissions
          </p>
        </div>
        <div className="flex gap-3">
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
          {userRole === 'admin' && (
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
                  Add User
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
                    Create New User
                  </DialogTitle>
                  <DialogDescription style={{ color: colors.textSecondary }}>
                    Add a new user to the system with appropriate role and permissions
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" style={{ color: colors.text }}>Username</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser(prev => ({...prev, username: e.target.value}))}
                        placeholder="Enter username"
                        required
                        style={{ 
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" style={{ color: colors.text }}>Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({...prev, email: e.target.value}))}
                        placeholder="Enter email address"
                        required
                        style={{ 
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" style={{ color: colors.text }}>Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({...prev, password: e.target.value}))}
                      placeholder="Enter password"
                      required
                      minLength={6}
                      style={{ 
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" style={{ color: colors.text }}>Role</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(value) => setNewUser(prev => ({...prev, role: value}))}
                    >
                      <SelectTrigger 
                        style={{ 
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.text
                        }}
                      >
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <role.icon 
                                className="w-4 h-4"
                                style={{ color: colors.buttonPrimary }}
                              />
                              <div>
                                <div 
                                  className="font-medium"
                                  style={{ color: colors.text }}
                                >
                                  {role.label}
                                </div>
                                <div 
                                  className="text-xs"
                                  style={{ color: colors.textSecondary }}
                                >
                                  {role.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <Card key={role.value} style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p 
                      className="text-sm font-medium transition-colors duration-300"
                      style={{ color: colors.textSecondary }}
                    >
                      {role.label}s
                    </p>
                    <p 
                      className="text-3xl font-bold transition-colors duration-300"
                      style={{ color: colors.heading }}
                    >
                      {role.count}
                    </p>
                  </div>
                  <Icon 
                    className="w-8 h-8"
                    style={{ color: colors.buttonPrimary }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
        <CardHeader style={{ backgroundColor: colors.cardAlt }}>
          <CardTitle 
            className="text-lg flex items-center gap-2 transition-colors duration-300"
            style={{ color: colors.heading }}
          >
            <Filter className="w-5 h-5" />
            Filter Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label style={{ color: colors.text }}>Search Users</Label>
              <div className="relative">
                <Search 
                  className="absolute left-2 top-2.5 h-4 w-4"
                  style={{ color: colors.textMuted }}
                />
                <Input
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <Label style={{ color: colors.text }}>Filter by Role</Label>
              <Select 
                value={roleFilter} 
                onValueChange={(value) => setRoleFilter(value)}
              >
                <SelectTrigger 
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <SelectItem value="all">All roles</SelectItem>
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

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const roleConfig = roleOptions.find(r => r.value === user.role);
            
            return (
              <Card 
                key={user.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
                onClick={() => {
                  setSelectedUser(user);
                  setShowDetailsDialog(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: colors.surfaceVariant }}
                        >
                          <User 
                            className="w-6 h-6"
                            style={{ color: colors.buttonPrimary }}
                          />
                        </div>
                        <div>
                          <h3 
                            className="font-bold text-xl transition-colors duration-300"
                            style={{ color: colors.heading }}
                          >
                            {user.username}
                          </h3>
                          <p style={{ color: colors.textSecondary }}>{user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.is_active, user.last_login)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span style={{ color: colors.textSecondary }}>Role:</span>
                          <p 
                            className="font-medium transition-colors duration-300"
                            style={{ color: colors.text }}
                          >
                            {roleConfig?.label}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: colors.textSecondary }}>Status:</span>
                          <p 
                            className="font-medium transition-colors duration-300"
                            style={{ color: colors.text }}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: colors.textSecondary }}>Created:</span>
                          <p 
                            className="font-medium transition-colors duration-300"
                            style={{ color: colors.text }}
                          >
                            {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span style={{ color: colors.textSecondary }}>Last Login:</span>
                          <p 
                            className="font-medium transition-colors duration-300"
                            style={{ color: colors.text }}
                          >
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>

                      {user.assigned_zones && user.assigned_zones.length > 0 && (
                        <div className="mt-3">
                          <span 
                            className="text-sm"
                            style={{ color: colors.textSecondary }}
                          >
                            Assigned Zones:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.assigned_zones.map(zoneId => {
                              const zone = zones.find(z => z.id === zoneId);
                              return (
                                <Badge 
                                  key={zoneId} 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ 
                                    borderColor: colors.border,
                                    color: colors.text,
                                    backgroundColor: 'transparent'
                                  }}
                                >
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {zone?.name || zoneId}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
                          setSelectedUser(user);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      {userRole === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ 
                            borderColor: colors.buttonPrimary,
                            color: colors.buttonPrimary,
                            backgroundColor: 'transparent'
                          }}
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
          <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
            <CardContent className="text-center py-12">
              <Users 
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: colors.textMuted }}
              />
              <h3 
                className="text-lg font-medium mb-2 transition-colors duration-300"
                style={{ color: colors.heading }}
              >
                No users found
              </h3>
              <p 
                className="mb-4"
                style={{ color: colors.textMuted }}
              >
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
              <User className="w-5 h-5" />
              User Details - {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              {/* Header Info */}
              <div 
                className="flex items-center gap-4 p-4 rounded-lg"
                style={{ backgroundColor: colors.surfaceVariant }}
              >
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: colors.surface }}
                >
                  <User 
                    className="w-8 h-8"
                    style={{ color: colors.buttonPrimary }}
                  />
                </div>
                <div className="flex-1">
                  <h3 
                    className="text-xl font-semibold transition-colors duration-300"
                    style={{ color: colors.heading }}
                  >
                    {selectedUser.username}
                  </h3>
                  <p style={{ color: colors.textSecondary }}>{selectedUser.email}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {getRoleBadge(selectedUser.role)}
                  {getStatusBadge(selectedUser.is_active, selectedUser.last_login)}
                </div>
              </div>

              {/* Role Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Role
                  </Label>
                  <p style={{ color: colors.text }}>
                    {roleOptions.find(r => r.value === selectedUser.role)?.label}
                  </p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Account Status
                  </Label>
                  <p style={{ color: colors.text }}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
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
                    {new Date(selectedUser.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label 
                    className="text-sm font-medium"
                    style={{ color: colors.textSecondary }}
                  >
                    Last Login
                  </Label>
                  <p style={{ color: colors.text }}>
                    {selectedUser.last_login ? 
                      new Date(selectedUser.last_login).toLocaleString() : 
                      'Never logged in'
                    }
                  </p>
                </div>
              </div>

              {/* Role Permissions */}
              <div>
                <Label 
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Permissions & Access
                </Label>
                <div className="mt-2 space-y-2 text-sm">
                  {selectedUser.role === 'admin' && (
                    <div className="space-y-1">
                      <p className="flex items-center gap-2">
                        <CheckCircle 
                          className="w-4 h-4"
                          style={{ color: colors.success }}
                        />
                        <span style={{ color: colors.text }}>Full system administration</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle 
                          className="w-4 h-4"
                          style={{ color: colors.success }}
                        />
                        <span style={{ color: colors.text }}>Manage all zones and users</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle 
                          className="w-4 h-4"
                          style={{ color: colors.success }}
                        />
                        <span style={{ color: colors.text }}>View all incidents and devices</span>
                      </p>
                    </div>
                  )}
                  {selectedUser.role === 'operator' && (
                    <div className="space-y-1">
                      <p className="flex items-center gap-2">
                        <CheckCircle 
                          className="w-4 h-4"
                          style={{ color: colors.success }}
                        />
                        <span style={{ color: colors.text }}>Manage assigned zones</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle 
                          className="w-4 h-4"
                          style={{ color: colors.success }}
                        />
                        <span style={{ color: colors.text }}>Create and assign incidents</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <UserX 
                          className="w-4 h-4"
                          style={{ color: colors.danger }}
                        />
                        <span style={{ color: colors.text }}>Limited to assigned zones only</span>
                      </p>
                    </div>
                  )}
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
                {userRole === 'admin' && (
                  <Button 
                    variant="outline"
                    style={{ 
                      borderColor: colors.buttonPrimary,
                      color: colors.buttonPrimary,
                      backgroundColor: 'transparent'
                    }}
                  >
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