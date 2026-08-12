import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

export interface TelemetryData {
  temp: number;
  sound: number;
  vibration: number;
  anomaly_score: number;
}

export interface DeviceTelemetryMap {
  [deviceId: string]: TelemetryData;
}

const DEFAULT_DEVICES = ['device-1', 'device-2', 'device-3', 'device-4', 'device-5'];

const generateInitialData = (): DeviceTelemetryMap => {
  const data: DeviceTelemetryMap = {};
  DEFAULT_DEVICES.forEach(id => {
    data[id] = {
      temp: 20 + Math.random() * 5,
      sound: 40 + Math.random() * 10,
      vibration: 0.2 + Math.random() * 1,
      anomaly_score: 5 + Math.random() * 10,
    };
  });
  return data;
};

export const useMqttTelemetry = () => {
  const [deviceData, setDeviceData] = useState<DeviceTelemetryMap>(generateInitialData());
  const [status, setStatus] = useState<'Connecting' | 'Connected' | 'Disconnected'>('Disconnected');
  const [simulated, setSimulated] = useState(false);
  const [forceFault, setForceFault] = useState<string | null>(null); // Which device is faulting
  
  // Expose global last updated for the status bar
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (simulated) {
      const interval = setInterval(() => {
        setDeviceData(prev => {
          const newData = { ...prev };
          Object.keys(newData).forEach(deviceId => {
            const isFaulty = forceFault === deviceId;
            newData[deviceId] = {
              temp: isFaulty ? Math.min(newData[deviceId].temp + 2, 95) : Math.max(newData[deviceId].temp - 0.5, 20 + Math.random() * 5),
              sound: isFaulty ? 110 + Math.random() * 10 : 40 + Math.random() * 10,
              vibration: isFaulty ? 8 + Math.random() * 4 : 0.2 + Math.random() * 1,
              anomaly_score: isFaulty ? 85 + Math.random() * 15 : 5 + Math.random() * 10,
            };
          });
          return newData;
        });
        setLastUpdated(new Date());
        setStatus('Connected');
      }, 1000);
      return () => clearInterval(interval);
    }

    setStatus('Connecting');
    const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
      clientId: `msme-hack-edge-${Math.random().toString(16).slice(3)}`,
    });

    client.on('connect', () => {
      setStatus('Connected');
      client.subscribe('msme/hackathon/edge_pod/#');
    });

    client.on('message', (topic, message) => {
      // Expected topic: msme/hackathon/edge_pod/device-1
      const parts = topic.split('/');
      const deviceId = parts[parts.length - 1];
      
      try {
        const payload = JSON.parse(message.toString());
        setDeviceData(prev => ({
          ...prev,
          [deviceId]: { ...(prev[deviceId] || generateInitialData()['device-1']), ...payload }
        }));
        setLastUpdated(new Date());
      } catch (e) {
        console.error('Invalid payload:', message.toString());
      }
    });

    client.on('error', () => setStatus('Disconnected'));
    client.on('close', () => setStatus('Disconnected'));

    return () => client.end();
  }, [simulated, forceFault]);

  return { 
    deviceData, 
    status, 
    simulated, 
    setSimulated, 
    forceFault, 
    setForceFault,
    lastUpdated
  };
};
