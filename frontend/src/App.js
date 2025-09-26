import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { ThemeProvider, ThemeContext } from "./contexts/ThemeContext";
import { ToastProvider } from "./components/ui/toast";
import Layout from "./components/Layout/Layout";
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
import EnhancedIncidentCenter from "./components/EnhancedIncidentCenter";
import EnhancedDeviceManagement from "./components/EnhancedDeviceManagement";
import EnhancedZoneManagement from "./components/EnhancedZoneManagement";
import EnhancedUserManagement from "./components/EnhancedUserManagement";
import EnhancedAlertsManagement from "./components/EnhancedAlertsManagement";
import EnhancedAnalytics from "./components/EnhancedAnalytics";
import SystemHealth from "./components/SystemHealth";
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
  RefreshCw,
  TrendingUp
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
  const { colors } = useContext(ThemeContext) || { colors: {} };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(credentials.username, credentials.password);
    setLoading(false);
  };

  const handleInitSampleData = async () => {
    try {
      await apiCall('/init-data', { method: 'POST' });
      toast.success("Sample data initialized! Use username: 'admin1', password: 'admin123'");
    } catch (error) {
      toast.error("Failed to initialize sample data");
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: 'linear-gradient(135deg, #F1F3F4 0%, #D0021B 100%)',
      }}
    >
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0" style={{ backgroundColor: colors.card || '#FFFFFF' }}>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-6">
              <img 
                src="https://customer-assets.emergentagent.com/job_urbanresponse/artifacts/1ey8mlei_aichecked-high-resolution-logo-transparent%20%281%29.png"
                alt="AiChecked"
                className="h-16 w-auto object-contain"
              />
            </div>
            <CardTitle 
              className="text-3xl font-bold"
              style={{ color: colors.text || '#333333' }}
            >
              AiChecked Dashboard
            </CardTitle>
            <CardDescription style={{ color: colors.textSecondary || '#6B7280' }}>
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
                className="w-full h-12 font-semibold text-white"
                style={{ 
                  backgroundColor: '#FF4500',
                  border: 'none'
                }}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="text-center pt-4 border-t" style={{ borderColor: colors.divider || '#E5E7EB' }}>
              <Button 
                variant="outline" 
                onClick={handleInitSampleData}
                className="w-full h-12"
                style={{ 
                  borderColor: '#FF4500',
                  color: '#FF4500',
                  backgroundColor: 'transparent'
                }}
              >
                Initialize Sample Data
              </Button>
              <p className="text-xs mt-3" style={{ color: colors.textMuted || '#9CA3AF' }}>
                Click above to set up demo data, then use admin1/admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Enhanced Dashboard Component
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
        <h2 className="text-3xl font-bold text-slate-900">
          {userRole === 'Admin' ? 'City-Wide Command Dashboard' : 'Zone Dashboard'}
        </h2>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Enhanced Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Active Incidents</p>
                <p className="text-3xl font-bold text-red-900">{analytics?.open_incidents || 2}</p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  Requires attention
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Devices</p>
                <p className="text-3xl font-bold text-blue-900">{analytics?.total_devices || 5}</p>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                  <Camera className="w-3 h-3" />
                  All zones covered
                </p>
              </div>
              <Monitor className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Device Uptime</p>
                <p className="text-3xl font-bold text-green-900">80%</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  4/5 devices online
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">System Health</p>
                <p className="text-3xl font-bold text-purple-900">98.5%</p>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3" />
                  All systems operational
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Recent Incidents
            </CardTitle>
            <CardDescription>Latest incidents requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border-l-4 border-red-500 bg-red-50 rounded">
                <div>
                  <p className="font-medium text-slate-900">INC001 - Overcrowding Alert</p>
                  <p className="text-sm text-slate-600">Temple District - CAM105</p>
                </div>
                <Badge variant="destructive">Open</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border-l-4 border-orange-500 bg-orange-50 rounded">
                <div>
                  <p className="font-medium text-slate-900">INC002 - Missing Child</p>
                  <p className="text-sm text-slate-600">Ram Ghat & Riverfront - SOS021</p>
                </div>
                <Badge className="bg-yellow-500">In Progress</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50 rounded">
                <div>
                  <p className="font-medium text-slate-900">INC003 - Medical Emergency</p>
                  <p className="text-sm text-slate-600">Market District - Resolved</p>
                </div>
                <Badge className="bg-green-600">Resolved</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              System Alerts
            </CardTitle>
            <CardDescription>Recent system notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded border-l-4 border-red-500">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-slate-900">Device CAM203 Offline</p>
                  <p className="text-sm text-slate-600">Ram Ghat area - Requires attention</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-slate-900">High Crowd Density</p>
                  <p className="text-sm text-slate-600">Temple District approaching capacity</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-slate-900">System Backup Complete</p>
                  <p className="text-sm text-slate-600">Daily backup finished successfully</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Overview (for Admin) */}
      {userRole === 'Admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Zone Overview
            </CardTitle>
            <CardDescription>Real-time status across all zones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">Temple District</h4>
                  <Badge className="bg-red-100 text-red-800">High Density</Badge>
                </div>
                <p className="text-sm text-slate-600">Occupancy: 9,200 / 50,000 (18%)</p>
                <p className="text-sm text-slate-600">Cameras: 720 active</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">Ram Ghat & Riverfront</h4>
                  <Badge className="bg-orange-100 text-orange-800">Very High</Badge>
                </div>
                <p className="text-sm text-slate-600">Occupancy: 15,400 / 80,000 (19%)</p>
                <p className="text-sm text-slate-600">Cameras: 900 active</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-900">Market District</h4>
                  <Badge className="bg-green-100 text-green-800">Normal</Badge>
                </div>
                <p className="text-sm text-slate-600">Occupancy: 6,800 / 30,000 (23%)</p>
                <p className="text-sm text-slate-600">Cameras: 270 active</p>
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
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [notifications] = useState([
    { id: 1, message: 'Device CAM203 Offline', read: false, type: 'error' },
    { id: 2, message: 'High crowd density detected', read: false, type: 'warning' },
    { id: 3, message: 'System backup complete', read: true, type: 'success' }
  ]);

  const handleNavigation = (route) => {
    setActiveRoute(route);
  };

  const renderContent = () => {
    switch (activeRoute) {
      case 'dashboard':
        return <Dashboard userRole={user?.role} />;
      case 'incidents':
        return <EnhancedIncidentCenter userRole={user?.role} />;
      case 'devices':
        return <EnhancedDeviceManagement userRole={user?.role} />;
      case 'zones':
        return <EnhancedZoneManagement userRole={user?.role} />;
      case 'users':
        return <EnhancedUserManagement userRole={user?.role} />;
      case 'alerts':
        return <EnhancedAlertsManagement userRole={user?.role} />;
      case 'analytics':
        return <EnhancedAnalytics userRole={user?.role} />;
      case 'system-health':
        return <SystemHealth userRole={user?.role} />;
      default:
        return <Dashboard userRole={user?.role} />;
    }
  };

  return (
    <Layout
      activeRoute={activeRoute}
      onNavigate={handleNavigation}
      user={user}
      onLogout={logout}
      notifications={notifications}
      userRole={user?.role?.toLowerCase() || 'admin'}
    >
      {renderContent()}
    </Layout>
  );
};

// Main App Component
function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
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
      </ToastProvider>
    </ThemeProvider>
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