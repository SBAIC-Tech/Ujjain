import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Live sample data with simulated real-time updates
const initialData = {
  incidents: [
    {
      id: 'INC001',
      title: 'Overcrowding Alert',
      location: 'Temple District - CAM105',
      status: 'Open',
      priority: 'High',
      type: 'crowd_management',
      timestamp: new Date(),
      assignedTo: 'Team Alpha',
      description: 'Large crowd gathering detected near main temple entrance'
    },
    {
      id: 'INC002', 
      title: 'Missing Child',
      location: 'Ram Ghat & Riverfront - SOS021',
      status: 'In Progress',
      priority: 'Critical',
      type: 'missing_person',
      timestamp: new Date(Date.now() - 1800000),
      assignedTo: 'Team Beta',
      description: '7-year old child separated from family group'
    },
    {
      id: 'INC003',
      title: 'Medical Emergency',
      location: 'Market District - Zone C',
      status: 'Resolved',
      priority: 'High',
      type: 'medical',
      timestamp: new Date(Date.now() - 3600000),
      assignedTo: 'Medical Team 1',
      description: 'Elderly person collapsed, ambulance dispatched'
    }
  ],
  devices: [
    {
      id: 'CAM001',
      name: 'Temple Gate Camera',
      type: 'CCTV',
      location: 'Temple District - Gate A',
      status: 'online',
      health: 98,
      lastPing: new Date()
    },
    {
      id: 'CAM002',
      name: 'Riverfront Drone',
      type: 'Drone',
      location: 'Ram Ghat Area',
      status: 'online',
      health: 95,
      lastPing: new Date()
    },
    {
      id: 'CAM203',
      name: 'Market Street CCTV',
      type: 'CCTV', 
      location: 'Market District',
      status: 'offline',
      health: 0,
      lastPing: new Date(Date.now() - 1800000)
    },
    {
      id: 'SEN001',
      name: 'Crowd Density Sensor',
      type: 'Sensor',
      location: 'Main Bazaar',
      status: 'online',
      health: 92,
      lastPing: new Date()
    },
    {
      id: 'SOS001',
      name: 'Emergency Call Point',
      type: 'SOS',
      location: 'Parking Area B',
      status: 'online',
      health: 100,
      lastPing: new Date()
    }
  ],
  zones: [
    {
      id: 'ZONE001',
      name: 'Temple District',
      type: 'Religious',
      capacity: 50000,
      currentOccupancy: 9200,
      status: 'High Density',
      devices: 720,
      incidents: 8
    },
    {
      id: 'ZONE002',
      name: 'Ram Ghat & Riverfront',
      type: 'Waterfront',
      capacity: 80000,
      currentOccupancy: 15400,
      status: 'Very High',
      devices: 900,
      incidents: 12
    },
    {
      id: 'ZONE003',
      name: 'Market District',
      type: 'Commercial',
      capacity: 30000,
      currentOccupancy: 6800,
      status: 'Normal',
      devices: 270,
      incidents: 3
    }
  ],
  alerts: [
    {
      id: 'ALERT001',
      title: 'Device CAM203 Offline',
      message: 'Ram Ghat area - Requires attention',
      type: 'device_failure',
      severity: 'high',
      status: 'unread',
      timestamp: new Date()
    },
    {
      id: 'ALERT002',
      title: 'High Crowd Density',
      message: 'Temple District approaching capacity',
      type: 'crowd_warning',
      severity: 'medium',
      status: 'unread',
      timestamp: new Date(Date.now() - 900000)
    },
    {
      id: 'ALERT003',
      title: 'System Backup Complete',
      message: 'Daily backup finished successfully',
      type: 'system_info',
      severity: 'low',
      status: 'read',
      timestamp: new Date(Date.now() - 7200000)
    }
  ],
  analytics: {
    totalIncidents: 47,
    activeIncidents: 3,
    resolvedToday: 12,
    averageResponseTime: '4.2 min',
    deviceUptime: '98.5%',
    totalDevices: 1890,
    onlineDevices: 1861,
    crowdDensity: {
      temple: 92,
      ghat: 85,
      market: 23
    }
  },
  systemHealth: {
    overallStatus: 'Operational',
    uptime: '99.8%',
    activeConnections: 1861,
    networkLatency: '< 100ms',
    databaseStatus: 'Connected',
    cpuUsage: 34,
    memoryUsage: 67,
    diskUsage: 45
  }
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(initialData);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => ({
        ...prevData,
        analytics: {
          ...prevData.analytics,
          activeIncidents: Math.max(1, prevData.analytics.activeIncidents + Math.floor(Math.random() * 3 - 1)),
          deviceUptime: (98 + Math.random() * 2).toFixed(1) + '%'
        },
        devices: prevData.devices.map(device => ({
          ...device,
          health: device.status === 'online' ? Math.max(85, Math.min(100, device.health + Math.floor(Math.random() * 6 - 3))) : 0,
          lastPing: device.status === 'online' ? new Date() : device.lastPing
        })),
        zones: prevData.zones.map(zone => ({
          ...zone,
          currentOccupancy: Math.max(100, zone.currentOccupancy + Math.floor(Math.random() * 200 - 100))
        }))
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const updateIncidentStatus = (incidentId, newStatus) => {
    setData(prevData => ({
      ...prevData,
      incidents: prevData.incidents.map(incident =>
        incident.id === incidentId ? { ...incident, status: newStatus } : incident
      ),
      analytics: {
        ...prevData.analytics,
        activeIncidents: newStatus === 'Resolved' 
          ? Math.max(0, prevData.analytics.activeIncidents - 1)
          : prevData.analytics.activeIncidents + (newStatus === 'Open' ? 1 : 0),
        resolvedToday: newStatus === 'Resolved' 
          ? prevData.analytics.resolvedToday + 1 
          : prevData.analytics.resolvedToday
      }
    }));
  };

  const updateDeviceStatus = (deviceId, newStatus) => {
    setData(prevData => ({
      ...prevData,
      devices: prevData.devices.map(device =>
        device.id === deviceId 
          ? { 
              ...device, 
              status: newStatus, 
              health: newStatus === 'online' ? Math.max(85, Math.random() * 15 + 85) : 0,
              lastPing: newStatus === 'online' ? new Date() : device.lastPing
            } 
          : device
      ),
      analytics: {
        ...prevData.analytics,
        onlineDevices: prevData.devices.filter(d => 
          (d.id === deviceId ? newStatus : d.status) === 'online'
        ).length,
        deviceUptime: (
          (prevData.devices.filter(d => (d.id === deviceId ? newStatus : d.status) === 'online').length / 
           prevData.devices.length) * 100
        ).toFixed(1) + '%'
      }
    }));
  };

  const markAlertAsRead = (alertId) => {
    setData(prevData => ({
      ...prevData,
      alerts: prevData.alerts.map(alert =>
        alert.id === alertId ? { ...alert, status: 'read' } : alert
      )
    }));
  };

  const addIncident = (newIncident) => {
    setData(prevData => ({
      ...prevData,
      incidents: [
        {
          ...newIncident,
          id: `INC${String(prevData.incidents.length + 1).padStart(3, '0')}`,
          timestamp: new Date()
        },
        ...prevData.incidents
      ],
      analytics: {
        ...prevData.analytics,
        totalIncidents: prevData.analytics.totalIncidents + 1,
        activeIncidents: prevData.analytics.activeIncidents + 1
      }
    }));
  };

  const contextValue = {
    data,
    updateIncidentStatus,
    updateDeviceStatus,
    markAlertAsRead,
    addIncident
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;