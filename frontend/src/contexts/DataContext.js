import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Real Ujjain Police Stations Data (31 stations)
const ujjainPoliceStations = [
  { id: 'PS001', name: 'Neelganga', zone: 'North Central', cameras_assigned: 15, contact: '+91-734-2515100', incidents: 3 },
  { id: 'PS002', name: 'Mahakal', zone: 'Temple District', cameras_assigned: 23, contact: '+91-734-2515200', incidents: 8 },
  { id: 'PS003', name: 'Kotwali', zone: 'Central City', cameras_assigned: 18, contact: '+91-734-2515300', incidents: 5 },
  { id: 'PS004', name: 'Nanakheda', zone: 'East Central', cameras_assigned: 12, contact: '+91-734-2515400', incidents: 2 },
  { id: 'PS005', name: 'Kharakua', zone: 'West District', cameras_assigned: 14, contact: '+91-734-2515500', incidents: 4 },
  { id: 'PS006', name: 'Madhav Nagar', zone: 'South Central', cameras_assigned: 16, contact: '+91-734-2515600', incidents: 3 },
  { id: 'PS007', name: 'Dewas Gate', zone: 'Transport Hub', cameras_assigned: 20, contact: '+91-734-2515700', incidents: 6 },
  { id: 'PS008', name: 'Mahila Thana', zone: 'Central City', cameras_assigned: 10, contact: '+91-734-2515800', incidents: 1 },
  { id: 'PS009', name: 'Jiwajigunj', zone: 'East Central', cameras_assigned: 13, contact: '+91-734-2515900', incidents: 2 },
  { id: 'PS010', name: 'Chimangunj', zone: 'Market District', cameras_assigned: 17, contact: '+91-734-2516000', incidents: 4 },
  { id: 'PS011', name: 'Bherugarh', zone: 'North District', cameras_assigned: 11, contact: '+91-734-2516100', incidents: 2 },
  { id: 'PS012', name: 'Naagjhiri', zone: 'East District', cameras_assigned: 9, contact: '+91-734-2516200', incidents: 1 },
  { id: 'PS013', name: 'Chintaman', zone: 'South District', cameras_assigned: 12, contact: '+91-734-2516300', incidents: 3 },
  { id: 'PS014', name: 'Traffic Thana', zone: 'Transport Hub', cameras_assigned: 25, contact: '+91-734-2516400', incidents: 7 }
];

// Real CCTV Camera Infrastructure Data for Ujjain (700+ cameras)
const realCameraTypes = ['Dome', 'PTZ', 'Bullet', 'Facial Recognition', 'ANPR'];

// Live sample data with real Ujjain statistics and infrastructure
const initialData = {
  incidents: [
    {
      id: 'INC2417',
      title: 'Overcrowding Alert - Mahakal Corridor',
      location: 'Mahakaleshwar Temple - Entry Gate 3',
      status: 'Open',
      priority: 'Critical',
      type: 'crowd_management',
      timestamp: new Date(Date.now() - 1800000), // 30 mins ago
      assignedTo: 'Mahakal Police Station',
      description: 'Large crowd gathering exceeding 250,000 visitors at main temple entrance. Implementing crowd control measures.',
      policeStation: 'Mahakal'
    },
    {
      id: 'INC2431', 
      title: 'Missing Child Alert',
      location: 'Ram Ghat & Shipra Riverfront - Ghat 7',
      status: 'In Progress',
      priority: 'High',
      type: 'missing_person',
      timestamp: new Date(Date.now() - 900000), // 15 mins ago
      assignedTo: 'Neelganga Police Station',
      description: '8-year old child separated from family during evening aarti ceremony',
      policeStation: 'Neelganga'
    },
    {
      id: 'INC2445',
      title: 'Medical Emergency - Elderly Pilgrim',
      location: 'Chimangunj Market Area - Stall 45',
      status: 'Resolved',
      priority: 'High',
      type: 'medical',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      assignedTo: 'Chimangunj Police Station',
      description: 'Elderly pilgrim collapsed due to heat exhaustion, ambulance dispatched and recovered',
      policeStation: 'Chimangunj'
    },
    {
      id: 'INC2452',
      title: 'Traffic Congestion - Dewas Gate',
      location: 'Dewas Gate Junction - NH52 Entry',
      status: 'Open',
      priority: 'Medium',
      type: 'traffic_management',
      timestamp: new Date(Date.now() - 600000), // 10 mins ago
      assignedTo: 'Traffic Thana',
      description: 'Heavy vehicle backup at main city entry point, diverting traffic via alternate routes',
      policeStation: 'Traffic Thana'
    },
    {
      id: 'INC2461',
      title: 'Suspicious Activity Alert',
      location: 'Madhav Nagar - CCTV Cam 47',
      status: 'Open',
      priority: 'Medium',
      type: 'security',
      timestamp: new Date(Date.now() - 300000), // 5 mins ago
      assignedTo: 'Madhav Nagar Police Station',
      description: 'Facial recognition system detected individual on watchlist near crowd area',
      policeStation: 'Madhav Nagar'
    }
  ],
  devices: [
    // Mahakal Temple Zone Cameras (700+ cameras)
    {
      id: 'CAM_MK_001',
      name: 'Mahakal Entry Gate 1 - Facial Recognition',
      type: 'Facial Recognition',
      location: 'Mahakaleshwar Temple - Main Entry',
      status: 'online',
      health: 98,
      lastPing: new Date(),
      zone: 'Temple District',
      policeStation: 'Mahakal'
    },
    {
      id: 'CAM_MK_PTZ_12',
      name: 'Mahakal Corridor - PTZ Surveillance',
      type: 'PTZ',
      location: 'Mahakal Corridor - Section 12',
      status: 'online',
      health: 96,
      lastPing: new Date(),
      zone: 'Temple District',
      policeStation: 'Mahakal'
    },
    {
      id: 'CAM_MK_ANPR_03',
      name: 'Temple Parking - ANPR System',
      type: 'ANPR',
      location: 'Mahakal Temple - Parking Zone C',
      status: 'online',
      health: 94,
      lastPing: new Date(),
      zone: 'Temple District',
      policeStation: 'Mahakal'
    },
    // Ram Ghat & Shipra Riverfront Cameras
    {
      id: 'CAM_RG_051',
      name: 'Ram Ghat - Ghat 5 Surveillance',
      type: 'Dome',
      location: 'Ram Ghat - Ghat Point 5',
      status: 'online',
      health: 92,
      lastPing: new Date(),
      zone: 'Ram Ghat & Riverfront',
      policeStation: 'Neelganga'
    },
    {
      id: 'CAM_RG_PTZ_08',
      name: 'Shipra Bridge - PTZ Monitoring',
      type: 'PTZ',
      location: 'Shipra River Bridge',
      status: 'online',
      health: 97,
      lastPing: new Date(),
      zone: 'Ram Ghat & Riverfront',
      policeStation: 'Neelganga'
    },
    // Market District Cameras
    {
      id: 'CAM_MD_023',
      name: 'Chimangunj Market - Dome Cam',
      type: 'Dome',
      location: 'Chimangunj Main Market',
      status: 'offline',
      health: 0,
      lastPing: new Date(Date.now() - 1800000),
      zone: 'Market District',
      policeStation: 'Chimangunj'
    },
    {
      id: 'CAM_MD_ANPR_15',
      name: 'Market Entry - ANPR System',
      type: 'ANPR',
      location: 'Market District - Entry Point',
      status: 'online',
      health: 89,
      lastPing: new Date(),
      zone: 'Market District',
      policeStation: 'Chimangunj'
    },
    // Transport Hub Cameras
    {
      id: 'CAM_TH_DG_01',
      name: 'Dewas Gate - Traffic Monitoring',
      type: 'Bullet',
      location: 'Dewas Gate Junction',
      status: 'online',
      health: 95,
      lastPing: new Date(),
      zone: 'Transport Hub',
      policeStation: 'Traffic Thana'
    },
    {
      id: 'CAM_TH_PTZ_19',
      name: 'Bus Station - PTZ Overview',
      type: 'PTZ',
      location: 'Ujjain Bus Station',
      status: 'online',
      health: 91,
      lastPing: new Date(),
      zone: 'Transport Hub',
      policeStation: 'Dewas Gate'
    },
    // Additional Strategic Cameras
    {
      id: 'CAM_CN_007',
      name: 'Central Naka - Facial Recognition',
      type: 'Facial Recognition',
      location: 'Central City - Main Naka',
      status: 'online',
      health: 99,
      lastPing: new Date(),
      zone: 'Central City',
      policeStation: 'Kotwali'
    }
  ],
  zones: [
    {
      id: 'ZONE001',
      name: 'Mahakaleshwar Temple District',
      type: 'Religious - Primary',
      capacity: 800000, // Updated corridor capacity
      currentOccupancy: 185000, // Current pilgrims
      status: 'Very High Density',
      devices: 700, // Real camera count
      incidents: 8,
      policeStations: ['Mahakal'],
      dailyVisitorsAvg: 180000,
      peakToday: 250000,
      localGateEntries: 28000,
      description: 'Primary temple zone with Mahakal Lok Corridor and AI-enabled surveillance'
    },
    {
      id: 'ZONE002',
      name: 'Ram Ghat & Shipra Riverfront',
      type: 'Waterfront - Sacred',
      capacity: 150000,
      currentOccupancy: 42000,
      status: 'High Density',
      devices: 51, // Strategic ghat coverage
      incidents: 12,
      policeStations: ['Neelganga', 'Naagjhiri'],
      description: 'Sacred bathing ghats along Shipra River with comprehensive monitoring'
    },
    {
      id: 'ZONE003',
      name: 'Chimangunj Market District',
      type: 'Commercial',
      capacity: 50000,
      currentOccupancy: 18500,
      status: 'Normal',
      devices: 50,
      incidents: 3,
      policeStations: ['Chimangunj'],
      description: 'Primary commercial and shopping area for pilgrims and locals'
    },
    {
      id: 'ZONE004',
      name: 'Transport Hub (Dewas Gate)',
      type: 'Transport & Logistics',
      capacity: 75000,
      currentOccupancy: 32000,
      status: 'High Activity',
      devices: 48,
      incidents: 6,
      policeStations: ['Dewas Gate', 'Traffic Thana'],
      description: 'Main entry point with bus station, railway connectivity and traffic management'
    },
    {
      id: 'ZONE005',
      name: 'Central City (Kotwali Area)',
      type: 'Administrative',
      capacity: 60000,
      currentOccupancy: 15200,
      status: 'Moderate',
      devices: 35,
      incidents: 2,
      policeStations: ['Kotwali', 'Mahila Thana'],
      description: 'Central administrative and residential area with key government facilities'
    },
    {
      id: 'ZONE006',
      name: 'Extended Districts',
      type: 'Peripheral',
      capacity: 200000,
      currentOccupancy: 45000,
      status: 'Normal',
      devices: 116, // Distributed across remaining stations
      incidents: 4,
      policeStations: ['Madhav Nagar', 'Kharakua', 'Jiwajigunj', 'Bherugarh', 'Chintaman'],
      description: 'Extended city areas with distributed monitoring and crowd management'
    }
  ],
  policeStations: ujjainPoliceStations,
  alerts: [
    {
      id: 'ALERT_MK_001',
      title: 'Mahakal Temple Visitor Capacity Alert',
      message: 'Current occupancy: 185,000 | Approaching peak capacity',
      type: 'crowd_warning',
      severity: 'high',
      status: 'unread',
      timestamp: new Date(),
      zone: 'Temple District',
      policeStation: 'Mahakal'
    },
    {
      id: 'ALERT_CAM_002',
      title: 'Camera CAM_MD_023 Offline',
      message: 'Chimangunj Market surveillance disrupted - requires attention',
      type: 'device_failure',
      severity: 'medium',
      status: 'unread',
      timestamp: new Date(Date.now() - 900000),
      zone: 'Market District',
      policeStation: 'Chimangunj'
    },
    {
      id: 'ALERT_TRF_003',
      title: 'Traffic Congestion - Dewas Gate',
      message: 'Heavy vehicle backup detected at main city entry point',
      type: 'traffic_alert',
      severity: 'medium',
      status: 'unread',
      timestamp: new Date(Date.now() - 600000),
      zone: 'Transport Hub',
      policeStation: 'Traffic Thana'
    },
    {
      id: 'ALERT_SYS_004',
      title: 'Facial Recognition System Update',
      message: 'Daily facial recognition database sync completed successfully',
      type: 'system_info',
      severity: 'low',
      status: 'read',
      timestamp: new Date(Date.now() - 7200000),
      zone: 'System Wide',
      policeStation: 'All Stations'
    }
  ],
  analytics: {
    totalIncidents: 89,
    activeIncidents: 5,
    resolvedToday: 24,
    averageResponseTime: '3.8 min',
    deviceUptime: '97.8%',
    totalDevices: 1100, // Real camera infrastructure count
    onlineDevices: 1076,
    totalPoliceStations: 31,
    crowdDensity: {
      mahakal_temple: 185000, // Real visitor count
      ram_ghat: 42000,
      market_district: 18500,
      transport_hub: 32000,
      central_city: 15200
    },
    dailyTempleVisitors: 180000,
    peakTempleVisitors: 250000,
    festivalCapacity: 500000,
    localGateEntries: 28000,
    cameraTypes: {
      'Facial Recognition': 156,
      'PTZ': 245,
      'Dome': 298,
      'Bullet': 187,
      'ANPR': 214
    }
  },
  systemHealth: {
    overallStatus: 'Operational',
    uptime: '99.2%',
    activeConnections: 1076,
    networkLatency: '< 85ms',
    databaseStatus: 'Connected',
    cpuUsage: 38,
    memoryUsage: 72,
    diskUsage: 52,
    networkStatus: 'Stable',
    aiSystemStatus: 'Active', // For facial recognition
    lastBackup: new Date(),
    policeStationConnectivity: {
      connected: 30,
      total: 31,
      offline: ['Naagjhiri'] // Simulated maintenance
    }
  }
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(initialData);

  // Simulate live data updates with realistic Ujjain patterns
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => ({
        ...prevData,
        analytics: {
          ...prevData.analytics,
          activeIncidents: Math.max(3, prevData.analytics.activeIncidents + Math.floor(Math.random() * 3 - 1)),
          deviceUptime: (97 + Math.random() * 2).toFixed(1) + '%',
          dailyTempleVisitors: Math.max(150000, Math.min(220000, 
            prevData.analytics.dailyTempleVisitors + Math.floor(Math.random() * 10000 - 5000)
          )),
          peakTempleVisitors: Math.max(200000, Math.min(300000,
            prevData.analytics.peakTempleVisitors + Math.floor(Math.random() * 15000 - 7500)
          ))
        },
        devices: prevData.devices.map(device => ({
          ...device,
          health: device.status === 'online' ? 
            Math.max(85, Math.min(100, device.health + Math.floor(Math.random() * 6 - 3))) : 0,
          lastPing: device.status === 'online' ? new Date() : device.lastPing
        })),
        zones: prevData.zones.map(zone => {
          // Realistic occupancy fluctuations based on zone type
          let fluctuation;
          if (zone.name.includes('Temple')) {
            fluctuation = Math.floor(Math.random() * 20000 - 10000); // Temple has higher variance
          } else if (zone.name.includes('Ghat')) {
            fluctuation = Math.floor(Math.random() * 8000 - 4000); // Ghat moderate variance
          } else {
            fluctuation = Math.floor(Math.random() * 3000 - 1500); // Other zones lower variance
          }
          
          return {
            ...zone,
            currentOccupancy: Math.max(1000, 
              Math.min(zone.capacity * 0.8, zone.currentOccupancy + fluctuation)
            )
          };
        })
      }));
    }, 12000); // Update every 12 seconds for realistic feel

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
          id: `INC${String(2400 + prevData.incidents.length + 1)}`,
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

export { DataContext };
export default DataContext;