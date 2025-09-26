import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import IncidentManagement from "./components/IncidentManagement";
import DeviceManagement from "./components/DeviceManagement";
import ZoneManagement from "./components/ZoneManagement";
import UserManagement from "./components/UserManagement";
import AlertsManagement from "./components/AlertsManagement";
import { 
  Shield, 
  Users, 
  MapPin, 
  Camera, 
  AlertTriangle, 
  Activity, 
  BarChart3, 
  Settings, 
  User, 
  LogOut, 
  Plus, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Monitor,
  UserPlus,
  Bell,
  RefreshCw
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast.success("Login successful!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success("Logged out successfully");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// API Helper
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios({
      url: `${API}${endpoint}`,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return response.data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
};

// Login Component
const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(credentials.username, credentials.password);
    setLoading(false);
  };

  const handleInitSampleData = async () => {
    try {
      await apiCall('/init/sample-data', { method: 'POST' });
      toast.success("Sample data initialized! Use username: 'admin', password: 'admin123'");
    } catch (error) {
      toast.error("Failed to initialize sample data");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              CityHub Dashboard
            </CardTitle>
            <CardDescription className="text-slate-600">
              Emergency Management System for Ujjain MahaKumbh
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({...prev, username: e.target.value}))}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
                  className="h-11"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="pt-4 border-t">
              <Button 
                onClick={handleInitSampleData}
                variant="outline" 
                className="w-full"
              >
                Initialize Sample Data
              </Button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Click above to set up demo data, then use admin/admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Header Component
const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Ujjain MahaKumbh Command Center</h1>
            <p className="text-sm text-slate-500">Real-time Emergency Management System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <p className="font-medium text-slate-900">{user?.username}</p>
            <p className="text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <Button onClick={onLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, userRole }) => {
  const masterTabs = [
    { id: 'dashboard', label: 'City Dashboard', icon: BarChart3 },
    { id: 'incidents', label: 'Incident Center', icon: AlertTriangle },
    { id: 'devices', label: 'Devices & Cameras', icon: Camera },
    { id: 'zones', label: 'Zone Management', icon: MapPin },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'system', label: 'System Health', icon: Monitor }
  ];

  const zoneTabs = [
    { id: 'dashboard', label: 'Zone Dashboard', icon: BarChart3 },
    { id: 'incidents', label: 'Zone Incidents', icon: AlertTriangle },
    { id: 'devices', label: 'Zone Devices', icon: Camera },
    { id: 'alerts', label: 'Zone Alerts', icon: Bell }
  ];

  const availableTabs = userRole === 'master_admin' ? masterTabs : zoneTabs;

  return (
    <aside className="w-64 bg-slate-900 text-white p-6">
      <nav className="space-y-2">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

// Dashboard Component
const Dashboard = ({ userRole }) => {
  const [analytics, setAnalytics] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsData, healthData] = await Promise.all([
        apiCall('/analytics/dashboard'),
        apiCall('/system/health')
      ]);
      setAnalytics(analyticsData);
      setSystemHealth(healthData);
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">
          {userRole === 'master_admin' ? 'City-Wide Dashboard' : 'Zone Dashboard'}
        </h2>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Incidents</p>
                <p className="text-3xl font-bold text-slate-900">{analytics?.total_incidents || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Open Incidents</p>
                <p className="text-3xl font-bold text-red-600">{analytics?.open_incidents || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Devices</p>
                <p className="text-3xl font-bold text-slate-900">{analytics?.total_devices || 0}</p>
              </div>
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Device Uptime</p>
                <p className="text-3xl font-bold text-green-600">{analytics?.device_uptime || 0}%</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>Latest incidents requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.recent_incidents?.length > 0 ? (
            <div className="space-y-4">
              {analytics.recent_incidents.slice(0, 5).map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      incident.status === 'resolved' ? 'bg-green-500' :
                      incident.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-slate-900">{incident.title}</p>
                      <p className="text-sm text-slate-600">{incident.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      incident.severity >= 4 ? 'destructive' :
                      incident.severity >= 3 ? 'default' : 'secondary'
                    }>
                      Severity {incident.severity}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(incident.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No recent incidents</p>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{systemHealth.uptime}</p>
                <p className="text-sm text-slate-600">Uptime</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{systemHealth.cpu_usage}</p>
                <p className="text-sm text-slate-600">CPU Usage</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{systemHealth.memory_usage}</p>
                <p className="text-sm text-slate-600">Memory</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">{systemHealth.active_connections}</p>
                <p className="text-sm text-slate-600">Connections</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Main Dashboard Component
const MainDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard userRole={user?.role} />;
      case 'incidents':
        return <div className="p-8 text-center text-slate-500">Incident Management - Coming Soon</div>;
      case 'devices':
        return <div className="p-8 text-center text-slate-500">Device Management - Coming Soon</div>;
      case 'zones':
        return <div className="p-8 text-center text-slate-500">Zone Management - Coming Soon</div>;
      case 'users':
        return <div className="p-8 text-center text-slate-500">User Management - Coming Soon</div>;
      case 'alerts':
        return <div className="p-8 text-center text-slate-500">Alerts & Notifications - Coming Soon</div>;
      case 'analytics':
        return <div className="p-8 text-center text-slate-500">Advanced Analytics - Coming Soon</div>;
      case 'system':
        return <div className="p-8 text-center text-slate-500">System Health - Coming Soon</div>;
      default:
        return <Dashboard userRole={user?.role} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} onLogout={logout} />
      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={user?.role} />
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </div>
  );
}

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AuthRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

export default App;