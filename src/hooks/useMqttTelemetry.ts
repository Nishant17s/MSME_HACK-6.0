import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';

// ── Component Health Interface ──
export interface ComponentHealth {
  bearing: number;
  gear: number;
  motor: number;
  belt: number;
  spindle: number;
}

// ── Expanded Telemetry matching pod output ──
export interface TelemetryData {
  // Raw sensor readings
  temp: number;                // IR thermal (°C)
  sound: number;               // MEMS acoustic (dB)
  vibration: number;           // Accelerometer magnitude (mm/s)

  // Edge AI output
  anomaly_score: number;       // 1D-CNN inference (0-100%)

  // FFT spectral features
  fft_dominant_freq: number;   // Hz
  fft_peak_amplitude: number;  // Peak amplitude
  fft_bins: number[];          // 16 spectral bins

  // Component-level diagnostics
  component_health: ComponentHealth;

  // Pod metadata
  pod_firmware: string;
  pod_uptime_hours: number;
  signal_quality: number;      // 0-100
}

export interface DeviceTelemetryMap {
  [deviceId: string]: TelemetryData;
}

export type TelemetryHistory = Record<string, TelemetryData[]>;

const HISTORY_LENGTH = 30;
const DEFAULT_PODS = ['pod-SE001', 'pod-SE002', 'pod-SE003', 'pod-SE004', 'pod-SE005'];

const COMPONENT_NAMES: (keyof ComponentHealth)[] = ['bearing', 'gear', 'motor', 'belt', 'spindle'];

function makeDefaultTelemetry(): TelemetryData {
  return {
    temp: 22, sound: 0, vibration: 0, anomaly_score: 0,
    fft_dominant_freq: 0, fft_peak_amplitude: 0,
    fft_bins: new Array(16).fill(0),
    component_health: { bearing: 95, gear: 92, motor: 97, belt: 88, spindle: 94 },
    pod_firmware: 'v1.4.2',
    pod_uptime_hours: 0,
    signal_quality: 95,
  };
}

const generateInitialData = (): DeviceTelemetryMap => {
  const data: DeviceTelemetryMap = {};
  DEFAULT_PODS.forEach(id => {
    data[id] = makeDefaultTelemetry();
  });
  return data;
};

const generateInitialNames = (): Record<string, string> => {
  const names: Record<string, string> = {};
  const machineNames = ['CNC Router A1', 'Lathe Unit B2', 'Press Machine C3', 'Drill Station D4', 'Welder Bay E5'];
  DEFAULT_PODS.forEach((id, i) => {
    names[id] = machineNames[i] || id.toUpperCase();
  });
  return names;
};

const generateInitialPower = (): Record<string, boolean> => {
  const power: Record<string, boolean> = {};
  DEFAULT_PODS.forEach(id => {
    power[id] = true;
  });
  return power;
};

// ── Realistic FFT bin simulation ──
function generateFFTBins(isFaulty: boolean): number[] {
  const bins = new Array(16).fill(0);
  for (let i = 0; i < 16; i++) {
    // Normal: higher energy at lower frequencies, tapering off
    bins[i] = Math.max(0, (16 - i) * 2 + Math.random() * 5);
  }
  if (isFaulty) {
    // Fault signature: spike at bins 4-6 (representing bearing defect frequency)
    bins[4] += 30 + Math.random() * 15;
    bins[5] += 25 + Math.random() * 10;
    bins[6] += 15 + Math.random() * 8;
    // Harmonic at bins 9-10
    bins[9] += 12 + Math.random() * 8;
    bins[10] += 8 + Math.random() * 5;
  }
  return bins;
}

// ── Smoothed component health degradation ──
function degradeComponentHealth(
  prev: ComponentHealth,
  isFaulty: boolean,
  isOn: boolean
): ComponentHealth {
  const result = { ...prev };
  COMPONENT_NAMES.forEach(comp => {
    if (!isOn) {
      // No change when off
      return;
    }
    if (isFaulty) {
      // Accelerated degradation — bearing and gear degrade fastest
      const rates: Record<keyof ComponentHealth, number> = {
        bearing: 0.8 + Math.random() * 0.4,
        gear: 0.5 + Math.random() * 0.3,
        motor: 0.3 + Math.random() * 0.2,
        belt: 0.2 + Math.random() * 0.15,
        spindle: 0.4 + Math.random() * 0.25,
      };
      result[comp] = Math.max(5, result[comp] - rates[comp]);
    } else {
      // Very slow natural wear — almost imperceptible per tick
      const wear = 0.01 + Math.random() * 0.02;
      result[comp] = Math.max(60, result[comp] - wear);
    }
  });
  return result;
}

export const useMqttTelemetry = () => {
  const [deviceData, setDeviceData] = useState<DeviceTelemetryMap>(generateInitialData());
  const [deviceNames, setDeviceNamesState] = useState<Record<string, string>>(generateInitialNames());
  const [powerStates, setPowerStates] = useState<Record<string, boolean>>(generateInitialPower());
  const [status, setStatus] = useState<'Connecting' | 'Connected' | 'Disconnected'>('Disconnected');
  const [simulated, setSimulated] = useState(false);
  const [forceFault, setForceFault] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistory>({});
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const powerStatesRef = useRef(powerStates);
  const forceFaultRef = useRef(forceFault);
  const uptimeCounterRef = useRef<Record<string, number>>({});

  useEffect(() => { powerStatesRef.current = powerStates; }, [powerStates]);
  useEffect(() => { forceFaultRef.current = forceFault; }, [forceFault]);

  const pushHistory = useCallback((data: DeviceTelemetryMap) => {
    setTelemetryHistory(prev => {
      const next = { ...prev };
      Object.entries(data).forEach(([id, reading]) => {
        const existing = next[id] || [];
        next[id] = [...existing.slice(-(HISTORY_LENGTH - 1)), reading];
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (simulated) {
      setStatus('Connected');
      const interval = setInterval(() => {
        setDeviceData(prev => {
          const newData = { ...prev };
          let faultTripped = false;
          const currentPower = powerStatesRef.current;
          const currentFault = forceFaultRef.current;

          Object.keys(newData).forEach(deviceId => {
            const isOn = currentPower[deviceId] ?? true;
            const isFaulty = currentFault === deviceId;
            const prevEntry = newData[deviceId];

            // Track uptime
            if (isOn) {
              uptimeCounterRef.current[deviceId] = (uptimeCounterRef.current[deviceId] || 0) + (1 / 3600);
            }

            if (!isOn) {
              newData[deviceId] = {
                ...prevEntry,
                temp: Math.max(prevEntry.temp - 1.5, 20),
                sound: Math.max(prevEntry.sound - 3, 0),
                vibration: Math.max(prevEntry.vibration - 0.3, 0),
                anomaly_score: Math.max(prevEntry.anomaly_score - 3, 0),
                fft_dominant_freq: 0,
                fft_peak_amplitude: Math.max(prevEntry.fft_peak_amplitude - 0.5, 0),
                fft_bins: prevEntry.fft_bins.map(b => Math.max(b - 1, 0)),
                component_health: prevEntry.component_health,
                signal_quality: Math.min(prevEntry.signal_quality + 0.5, 100),
                pod_uptime_hours: uptimeCounterRef.current[deviceId] || 0,
              };
            } else if (isFaulty) {
              const fftBins = generateFFTBins(true);
              const dominantIdx = fftBins.indexOf(Math.max(...fftBins));
              const dominantFreq = (dominantIdx + 1) * 62.5; // 16 bins over 1kHz

              newData[deviceId] = {
                ...prevEntry,
                temp: Math.min(prevEntry.temp + 1.8, 98),
                sound: 105 + Math.random() * 15,
                vibration: 7.5 + Math.random() * 5,
                anomaly_score: Math.min(prevEntry.anomaly_score + 3, 100),
                fft_dominant_freq: dominantFreq,
                fft_peak_amplitude: Math.max(...fftBins),
                fft_bins: fftBins,
                component_health: degradeComponentHealth(prevEntry.component_health, true, true),
                signal_quality: 80 + Math.random() * 15,
                pod_uptime_hours: uptimeCounterRef.current[deviceId] || 0,
              };

              if (newData[deviceId].anomaly_score >= 95) {
                faultTripped = true;
                setPowerStates(p => ({ ...p, [deviceId]: false }));
              }
            } else {
              const fftBins = generateFFTBins(false);
              const dominantIdx = fftBins.indexOf(Math.max(...fftBins));
              const dominantFreq = (dominantIdx + 1) * 62.5;

              const baseTemp = 35 + Math.random() * 8;
              const baseSound = 42 + Math.random() * 8;
              const baseVib = 0.15 + Math.random() * 0.6;
              const baseAnomaly = 3 + Math.random() * 8;

              newData[deviceId] = {
                ...prevEntry,
                temp: prevEntry.temp * 0.85 + baseTemp * 0.15,
                sound: prevEntry.sound * 0.8 + baseSound * 0.2,
                vibration: prevEntry.vibration * 0.8 + baseVib * 0.2,
                anomaly_score: prevEntry.anomaly_score * 0.85 + baseAnomaly * 0.15,
                fft_dominant_freq: dominantFreq,
                fft_peak_amplitude: Math.max(...fftBins),
                fft_bins: fftBins,
                component_health: degradeComponentHealth(prevEntry.component_health, false, true),
                signal_quality: 90 + Math.random() * 10,
                pod_uptime_hours: uptimeCounterRef.current[deviceId] || 0,
              };
            }
          });

          if (faultTripped && currentFault) {
            setForceFault(null);
          }

          pushHistory(newData);
          return newData;
        });
        setLastUpdated(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }

    // Real MQTT connection
    setStatus('Connecting');
    setReconnectAttempts(0);

    let client: MqttClient;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
        clientId: `sentinel-edge-${Math.random().toString(16).slice(3)}`,
        reconnectPeriod: 0,
      });

      client.on('connect', () => {
        setStatus('Connected');
        setReconnectAttempts(0);
        attempt = 0;
        client.subscribe('msme/hackathon/edge_pod/#');
      });

      client.on('message', (_topic, message) => {
        const parts = _topic.split('/');
        const deviceId = parts[parts.length - 1];

        try {
          const payload = JSON.parse(message.toString());
          setDeviceData(prev => {
            const fallback = makeDefaultTelemetry();
            const updated = {
              ...prev,
              [deviceId]: { ...fallback, ...(prev[deviceId] || {}), ...payload }
            };
            pushHistory(updated);
            return updated;
          });
          setDeviceNamesState(prev => {
            if (!prev[deviceId]) return { ...prev, [deviceId]: deviceId.toUpperCase() };
            return prev;
          });
          setLastUpdated(new Date());
        } catch {
          console.error('Invalid MQTT payload:', message.toString());
        }
      });

      client.on('error', () => setStatus('Disconnected'));
      client.on('close', () => {
        setStatus('Disconnected');
        attempt++;
        setReconnectAttempts(attempt);
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        reconnectTimer = setTimeout(connect, delay);
      });
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (client) client.end();
    };
  }, [simulated, pushHistory]);

  const setDeviceName = useCallback((id: string, name: string) => {
    setDeviceNamesState(prev => ({ ...prev, [id]: name }));
  }, []);

  const toggleDevicePower = useCallback((id: string) => {
    setPowerStates(prev => ({ ...prev, [id]: !(prev[id] ?? true) }));
  }, []);

  const addDevice = useCallback((name: string) => {
    const newId = `pod-SE${Date.now().toString().slice(-4)}`;
    setDeviceData(prev => ({ ...prev, [newId]: makeDefaultTelemetry() }));
    setDeviceNamesState(prev => ({ ...prev, [newId]: name }));
    setPowerStates(prev => ({ ...prev, [newId]: true }));
    return newId;
  }, []);

  const removeDevice = useCallback((id: string) => {
    setDeviceData(prev => { const c = { ...prev }; delete c[id]; return c; });
    setDeviceNamesState(prev => { const c = { ...prev }; delete c[id]; return c; });
    setPowerStates(prev => { const c = { ...prev }; delete c[id]; return c; });
    setTelemetryHistory(prev => { const c = { ...prev }; delete c[id]; return c; });
  }, []);

  return {
    deviceData, deviceNames, setDeviceName, powerStates, toggleDevicePower,
    addDevice, removeDevice, status, simulated, setSimulated,
    forceFault, setForceFault, lastUpdated, telemetryHistory, reconnectAttempts,
  };
};
