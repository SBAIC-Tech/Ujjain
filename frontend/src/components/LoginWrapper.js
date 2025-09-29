import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useTheme } from '../contexts/ThemeContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LoginWrapper = ({ onLogin }) => {
  const { colors, isDark } = useTheme();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user, data.access_token);
      } else {
        setError('Invalid credentials');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/init/sample-data`, { method: 'POST' });
      // Auto-login after data initialization
      setCredentials({ username: 'admin1', password: 'admin123' });
    } catch (error) {
      console.error('Failed to initialize data:', error);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      style={{ 
        background: `linear-gradient(135deg, ${colors.buttonPrimary}20 0%, ${colors.background} 50%, ${colors.info}15 100%)`
      }}
    >
      <Card 
        className="w-full max-w-md shadow-2xl transition-colors duration-300"
        style={{ 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder
        }}
      >
        <CardHeader className="text-center space-y-4">
          {/* AiChecked Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src={isDark 
                ? "https://customer-assets.emergentagent.com/job_urbanresponse/artifacts/1ey8mlei_aichecked-high-resolution-logo-transparent%20%281%29.png"
                : "https://customer-assets.emergentagent.com/job_emergency-dash-3/artifacts/ii4up7zh_aichecked-high-resolution-logo-transparent.png"
              }
              alt="AiChecked"
              className="h-12 w-auto object-contain transition-all duration-300"
              style={{ 
                filter: isDark 
                  ? 'brightness(1.2) contrast(1.1)' 
                  : 'brightness(1.0) contrast(1.0)',
                opacity: 1
              }}
            />
          </div>
          
          <div>
            <CardTitle 
              className="text-2xl font-bold transition-colors duration-300"
              style={{ color: colors.heading }}
            >
              AiChecked Dashboard
            </CardTitle>
            <CardDescription 
              className="transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              Emergency Management System for Ujjain Simhastha 2028
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label 
                htmlFor="username"
                style={{ color: colors.text }}
              >
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={credentials.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                className="transition-colors duration-300"
                style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text
                }}
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="password"
                style={{ color: colors.text }}
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="transition-colors duration-300"
                style={{ 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text
                }}
              />
            </div>

            {error && (
              <p 
                className="text-sm text-center"
                style={{ color: colors.danger }}
              >
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full font-semibold transition-all duration-300"
              disabled={loading}
              style={{ 
                backgroundColor: colors.buttonPrimary,
                color: colors.buttonPrimaryText,
                border: 'none'
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
            <Button 
              variant="outline" 
              onClick={initializeData}
              className="w-full transition-all duration-300"
              style={{ 
                borderColor: colors.buttonPrimary,
                color: colors.buttonPrimary,
                backgroundColor: 'transparent'
              }}
            >
              Initialize Sample Data
            </Button>
            <p 
              className="text-xs text-center mt-2"
              style={{ color: colors.textMuted }}
            >
              Click above to set up demo data, then use admin1/admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginWrapper;