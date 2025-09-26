import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { ThemeProvider, ThemeContext, useTheme } from "./contexts/ThemeContext";
import { DataProvider, DataContext } from "./contexts/DataContext";
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

// Login Component Wrapper
const LoginWrapper = () => {
  return (
    <ThemeProvider>
      <Login />
    </ThemeProvider>
  );
};

// Login Component
const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { colors } = useTheme();

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
  const { colors } = useTheme();
  const { data } = useContext(DataContext);
  const [analytics, setAnalytics] = useState(data?.analytics);
  const [systemHealth, setSystemHealth] = useState(data?.systemHealth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setAnalytics(data.analytics);
      setSystemHealth(data.systemHealth);
    }
  }, [data]);

  const fetchData = async () => {
    try {
      const [analyticsData, healthData] = await Promise.all([
        apiCall('/analytics/dashboard'),
        apiCall('/system/health')
      ]);
      setAnalytics(analyticsData);
      setSystemHealth(healthData);
    } catch (error) {
      // Fallback to context data if API fails
      setAnalytics(data?.analytics);
      setSystemHealth(data?.systemHealth);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-8 h-8 animate-spin" style={{ color: colors.buttonPrimary }} />
    </div>;
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: colors.background }}>
      {/* Page Title */}
      <div 
        className="flex items-center justify-between"
        style={{ backgroundColor: colors.backgroundAlt, padding: '1rem', borderRadius: '8px' }}
      >
        <h1 
          className="text-3xl font-bold transition-colors duration-300"
          style={{ color: colors.heading }}
        >
          City-Wide Command Dashboard
        </h1>
        <Button 
          onClick={fetchData} 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
          style={{ 
            borderColor: colors.buttonPrimary,
            color: colors.buttonPrimary 
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Active Incidents
                </p>
                <p 
                  className="text-2xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {analytics?.activeIncidents || data?.incidents?.filter(i => i.status !== 'Resolved').length || 0}
                </p>
                <p 
                  className="text-xs flex items-center gap-1 mt-1"
                  style={{ color: colors.danger }}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Requires attention
                </p>
              </div>
              <AlertTriangle 
                className="w-8 h-8"
                style={{ color: colors.danger }}
              />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Total Devices
                </p>
                <p 
                  className="text-2xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {data?.devices?.length || 0}
                </p>
                <p 
                  className="text-xs flex items-center gap-1 mt-1"
                  style={{ color: colors.info }}
                >
                  <Monitor className="w-3 h-3" />
                  All zones covered
                </p>
              </div>
              <Monitor 
                className="w-8 h-8"
                style={{ color: colors.info }}
              />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  Device Uptime
                </p>
                <p 
                  className="text-2xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {analytics?.deviceUptime || '98.5%'}
                </p>
                <p 
                  className="text-xs flex items-center gap-1 mt-1"
                  style={{ color: colors.success }}
                >
                  <Activity className="w-3 h-3" />
                  {data?.devices?.filter(d => d.status === 'online').length || 0}/{data?.devices?.length || 0} devices online
                </p>
              </div>
              <Activity 
                className="w-8 h-8"
                style={{ color: colors.success }}
              />
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: colors.textSecondary }}
                >
                  System Health
                </p>
                <p 
                  className="text-2xl font-bold transition-colors duration-300"
                  style={{ color: colors.heading }}
                >
                  {systemHealth?.uptime || '99.8%'}
                </p>
                <p 
                  className="text-xs flex items-center gap-1 mt-1"
                  style={{ color: colors.success }}
                >
                  <Shield className="w-3 h-3" />
                  All systems operational
                </p>
              </div>
              <Shield 
                className="w-8 h-8"
                style={{ color: colors.success }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardHeader style={{ backgroundColor: colors.cardAlt }}>
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <AlertTriangle className="w-5 h-5" />
              Recent Incidents
            </CardTitle>
            <CardDescription style={{ color: colors.textSecondary }}>
              Latest incidents requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data?.incidents?.slice(0, 3).map((incident, index) => (
                <div 
                  key={incident.id}
                  className="flex items-center justify-between p-3 rounded border-l-4"
                  style={{ 
                    backgroundColor: colors.surfaceVariant,
                    borderLeftColor: incident.status === 'Open' ? colors.danger : 
                                   incident.status === 'In Progress' ? colors.warning : colors.success
                  }}
                >
                  <div>
                    <p 
                      className="font-medium transition-colors duration-300"
                      style={{ color: colors.heading }}
                    >
                      {incident.id} - {incident.title}
                    </p>
                    <p 
                      className="text-sm transition-colors duration-300"
                      style={{ color: colors.textSecondary }}
                    >
                      {incident.location}
                    </p>
                  </div>
                  <Badge 
                    className={`${
                      incident.status === 'Open' ? 'bg-red-500 text-white' : 
                      incident.status === 'In Progress' ? 'bg-orange-500 text-white' : 
                      'bg-green-500 text-white'
                    }`}
                  >
                    {incident.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardHeader style={{ backgroundColor: colors.cardAlt }}>
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <Bell className="w-5 h-5" />
              System Alerts
            </CardTitle>
            <CardDescription style={{ color: colors.textSecondary }}>
              Recent system notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data?.alerts?.slice(0, 3).map((alert, index) => (
                <div 
                  key={alert.id}
                  className="flex items-center gap-3 p-3 rounded border-l-4"
                  style={{ 
                    backgroundColor: colors.surfaceVariant,
                    borderLeftColor: alert.severity === 'high' ? colors.danger : 
                                   alert.severity === 'medium' ? colors.warning : colors.info
                  }}
                >
                  <AlertTriangle 
                    className="w-5 h-5"
                    style={{ 
                      color: alert.severity === 'high' ? colors.danger : 
                             alert.severity === 'medium' ? colors.warning : colors.info
                    }}
                  />
                  <div>
                    <p 
                      className="font-medium transition-colors duration-300"
                      style={{ color: colors.heading }}
                    >
                      {alert.title}
                    </p>
                    <p 
                      className="text-sm transition-colors duration-300"
                      style={{ color: colors.textSecondary }}
                    >
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Overview (for Admin) */}
      {userRole === 'admin' && (
        <Card style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <CardHeader style={{ backgroundColor: colors.cardAlt }}>
            <CardTitle 
              className="flex items-center gap-2 transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              <MapPin className="w-5 h-5" />
              Zone Overview
            </CardTitle>
            <CardDescription style={{ color: colors.textSecondary }}>
              Real-time status across all zones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.zones?.map((zone, index) => (
                <div 
                  key={zone.id}
                  className="p-4 border rounded-lg transition-colors duration-300"
                  style={{ 
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 
                      className="font-medium transition-colors duration-300"
                      style={{ color: colors.heading }}
                    >
                      {zone.name}
                    </h4>
                    <Badge 
                      className={`${
                        zone.status === 'High Density' || zone.status === 'Very High' ? 
                        'bg-red-500 text-white' : 'bg-green-500 text-white'
                      }`}
                    >
                      {zone.status}
                    </Badge>
                  </div>
                  <p 
                    className="text-sm transition-colors duration-300"
                    style={{ color: colors.textSecondary }}
                  >
                    Occupancy: {zone.currentOccupancy?.toLocaleString()} / {zone.capacity?.toLocaleString()} ({Math.round((zone.currentOccupancy / zone.capacity) * 100)}%)
                  </p>
                  <p 
                    className="text-sm transition-colors duration-300"
                    style={{ color: colors.textSecondary }}
                  >
                    Devices: {zone.devices} active
                  </p>
                </div>
              ))}
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
                <Route path="/login" element={<AuthRoute><LoginWrapper /></AuthRoute>} />
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