import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

export interface TelemetryData {
  temp: number;
  sound: number;
  vibration: number;
  anomaly_score: number;
}

export const useMqttTelemetry = () => {
  const [data, setData] = useState<TelemetryData>({
    temp: 22,
    sound: 45,
    vibration: 0.5,
    anomaly_score: 10,
  });
  
  const [status, setStatus] = useState<'Connecting' | 'Connected' | 'Disconnected'>('Disconnected');
  const [simulated, setSimulated] = useState(false);
  const [forceFault, setForceFault] = useState(false);

  useEffect(() => {
    if (simulated) {
      const interval = setInterval(() => {
        setData(prev => ({
          temp: forceFault ? Math.min(prev.temp + 2, 95) : Math.max(prev.temp - 1, 45),
          sound: forceFault ? 110 + Math.random() * 10 : 50 + Math.random() * 5,
          vibration: forceFault ? 8 + Math.random() * 4 : 1 + Math.random() * 0.5,
          anomaly_score: forceFault ? 85 + Math.random() * 15 : 15 + Math.random() * 10,
        }));
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
      client.subscribe('msme/hackathon/edge_pod');
    });

    client.on('message', (topic, message) => {
      if (topic === 'msme/hackathon/edge_pod') {
        try {
          const payload = JSON.parse(message.toString());
          setData(prev => ({ ...prev, ...payload }));
        } catch (e) {
          console.error('Invalid payload:', message.toString());
        }
      }
    });

    client.on('error', () => {
      setStatus('Disconnected');
    });

    client.on('close', () => {
      setStatus('Disconnected');
    });

    return () => {
      client.end();
    };
  }, [simulated, forceFault]);

  return { data, status, simulated, setSimulated, forceFault, setForceFault };
};
