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
  pod_status: 'normal' | 'tampered'; // Phase 4: Tamper state
}

export interface DeviceTelemetryMap {
  [deviceId: string]: TelemetryData;
}

export type TelemetryHistory = Record<string, TelemetryData[]>;

export type CalibrationState = 'calibrating' | 'completed' | 'verified';

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
    pod_status: 'normal',
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

const generateInitialCalibration = (): Record<string, CalibrationState> => {
  const states: Record<string, CalibrationState> = {};
  DEFAULT_PODS.forEach(id => {
    states[id] = 'verified'; // Default pods are already verified
  });
  return states;
};

const generateInitialDiscovered = (): Record<string, string[]> => {
  const discovered: Record<string, string[]> = {};
  DEFAULT_PODS.forEach(id => {
    discovered[id] = [...COMPONENT_NAMES]; // Default pods have all components
  });
  return discovered;
};

// ── Realistic FFT bin simulation ──
function generateFFTBins(isFaulty: boolean, isVariableRpm: boolean): number[] {
  const bins = new Array(16).fill(0);
  
  // Phase 4: Dynamic Shift for Variable RPM Order Tracking
  let shift = 0;
  if (isVariableRpm) {
    // Oscillate between -2 and +2 bins based on time
    shift = Math.floor(Math.sin(Date.now() / 2000) * 3);
  }

  for (let i = 0; i < 16; i++) {
    // Normal: higher energy at lower frequencies, tapering off
    const effectiveIndex = Math.max(0, Math.min(15, i - shift));
    bins[effectiveIndex] += Math.max(0, (16 - i) * 2 + Math.random() * 5);
  }
  
  if (isFaulty) {
    // Fault signature: spike at specific bins
    const faultShift = isVariableRpm ? shift : 0;
    const b4 = Math.max(0, Math.min(15, 4 + faultShift));
    const b5 = Math.max(0, Math.min(15, 5 + faultShift));
    const b6 = Math.max(0, Math.min(15, 6 + faultShift));
    const b9 = Math.max(0, Math.min(15, 9 + faultShift));
    const b10 = Math.max(0, Math.min(15, 10 + faultShift));
    
    bins[b4] += 30 + Math.random() * 15;
    bins[b5] += 25 + Math.random() * 10;
    bins[b6] += 15 + Math.random() * 8;
    bins[b9] += 12 + Math.random() * 8;
    bins[b10] += 8 + Math.random() * 5;
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
    if (!isOn) return;
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
  
  // Phase 3 & 4: Calibration & Discovery states
  const [calibrationStates, setCalibrationStates] = useState<Record<string, CalibrationState>>(generateInitialCalibration());
  const [discoveredComponents, setDiscoveredComponents] = useState<Record<string, string[]>>(generateInitialDiscovered());
  const [calibrationProgress, setCalibrationProgress] = useState<Record<string, number>>({});
  
  const [status, setStatus] = useState<'Connecting' | 'Connected' | 'Disconnected'>('Disconnected');
  const [simulated, setSimulated] = useState(false);
  const [forceFault, setForceFault] = useState<string | null>(null);
  
  // Phase 4 additions
  const [variableRpm, setVariableRpm] = useState(false);
  const [tamperedPod, setTamperedPod] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryHistory>({});
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const powerStatesRef = useRef(powerStates);
  const forceFaultRef = useRef(forceFault);
  const tamperedPodRef = useRef(tamperedPod);
  const variableRpmRef = useRef(variableRpm);
  const uptimeCounterRef = useRef<Record<string, number>>({});
  const calibrationStatesRef = useRef(calibrationStates);

  useEffect(() => { powerStatesRef.current = powerStates; }, [powerStates]);
  useEffect(() => { forceFaultRef.current = forceFault; }, [forceFault]);
  useEffect(() => { tamperedPodRef.current = tamperedPod; }, [tamperedPod]);
  useEffect(() => { variableRpmRef.current = variableRpm; }, [variableRpm]);
  useEffect(() => { calibrationStatesRef.current = calibrationStates; }, [calibrationStates]);

  // Persist custom devices
  useEffect(() => {
    const savedStr = localStorage.getItem('sentinel_deviceNames');
    if (savedStr) {
      try {
        const savedNames = JSON.parse(savedStr);
        const customIds = Object.keys(savedNames).filter(id => !DEFAULT_PODS.includes(id));
        if (customIds.length > 0) {
          setDeviceNamesState(prev => ({ ...prev, ...savedNames }));
          setDeviceData(prev => {
            const next = { ...prev };
            customIds.forEach(id => { if (!next[id]) next[id] = makeDefaultTelemetry(); });
            return next;
          });
          setPowerStates(prev => {
            const next = { ...prev };
            customIds.forEach(id => { if (next[id] === undefined) next[id] = true; });
            return next;
          });
          setCalibrationStates(prev => {
            const next = { ...prev };
            customIds.forEach(id => { if (!next[id]) next[id] = 'verified'; });
            return next;
          });
          setDiscoveredComponents(prev => {
            const next = { ...prev };
            customIds.forEach(id => { if (!next[id]) next[id] = [...COMPONENT_NAMES]; });
            return next;
          });
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (Object.keys(deviceNames).length > 0) {
      localStorage.setItem('sentinel_deviceNames', JSON.stringify(deviceNames));
    }
  }, [deviceNames]);

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
        
        // Handle auto-calibration progression
        const currentCalibration = calibrationStatesRef.current;
        Object.keys(currentCalibration).forEach(id => {
          if (currentCalibration[id] === 'calibrating') {
            setCalibrationProgress(prev => {
              const progress = (prev[id] || 0) + 1;
              
              // Phase 4: Complete calibration after 15 ticks (instead of 8)
              if (progress >= 15) {
                setCalibrationStates(s => ({ ...s, [id]: 'completed' }));
                
                // Simulate AI inferring components
                const possible = ['bearing', 'gear', 'belt', 'spindle'];
                const inferred = ['motor'];
                possible.forEach(p => {
                  if (Math.random() > 0.3) inferred.push(p);
                });
                setDiscoveredComponents(d => ({ ...d, [id]: inferred }));
              }
              
              return { ...prev, [id]: progress };
            });
          }
        });

        setDeviceData(prev => {
          const newData = { ...prev };
          let faultTripped = false;
          const currentPower = powerStatesRef.current;
          const currentFault = forceFaultRef.current;
          const currentTamper = tamperedPodRef.current;
          const currentVariableRpm = variableRpmRef.current;

          Object.keys(newData).forEach(deviceId => {
            const isOn = currentPower[deviceId] ?? true;
            const isFaulty = currentFault === deviceId;
            const isTampered = currentTamper === deviceId;
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
                pod_status: 'normal',
              };
            } else if (isTampered) {
              // Phase 4: Tamper Event - High vibration and anomaly, but normal temp and zeroed FFT (because it fell off)
              newData[deviceId] = {
                ...prevEntry,
                temp: prevEntry.temp * 0.95 + 22 * 0.05, // cools down to room temp
                sound: 50 + Math.random() * 10,
                vibration: 25 + Math.random() * 10, // Massive G-shock
                anomaly_score: 99, // Immediate critical anomaly
                fft_dominant_freq: 0,
                fft_peak_amplitude: 0,
                fft_bins: new Array(16).fill(0), // No structural harmonics detected
                component_health: prevEntry.component_health, // does not degrade components
                signal_quality: prevEntry.signal_quality,
                pod_uptime_hours: uptimeCounterRef.current[deviceId] || 0,
                pod_status: 'tampered',
              };
            } else if (isFaulty) {
              const fftBins = generateFFTBins(true, currentVariableRpm);
              const dominantIdx = fftBins.indexOf(Math.max(...fftBins));
              const dominantFreq = (dominantIdx + 1) * 62.5;

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
                pod_status: 'normal',
              };

              if (newData[deviceId].anomaly_score >= 95) {
                faultTripped = true;
                setPowerStates(p => ({ ...p, [deviceId]: false }));
              }
            } else {
              const fftBins = generateFFTBins(false, currentVariableRpm);
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
                pod_status: 'normal',
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

    // Real MQTT connection setup would go here
    setStatus('Connecting');
    setReconnectAttempts(0);
    
    // ...

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
    
    // Phase 3 & 4: New pods start in 'calibrating' state
    setCalibrationStates(prev => ({ ...prev, [newId]: 'calibrating' }));
    setCalibrationProgress(prev => ({ ...prev, [newId]: 0 }));
    setDiscoveredComponents(prev => ({ ...prev, [newId]: [] }));
    
    return newId;
  }, []);

  const removeDevice = useCallback((id: string) => {
    setDeviceData(prev => { const c = { ...prev }; delete c[id]; return c; });
    setDeviceNamesState(prev => { const c = { ...prev }; delete c[id]; return c; });
    setPowerStates(prev => { const c = { ...prev }; delete c[id]; return c; });
    setTelemetryHistory(prev => { const c = { ...prev }; delete c[id]; return c; });
    setCalibrationStates(prev => { const c = { ...prev }; delete c[id]; return c; });
    setDiscoveredComponents(prev => { const c = { ...prev }; delete c[id]; return c; });
    setCalibrationProgress(prev => { const c = { ...prev }; delete c[id]; return c; });
  }, []);

  const verifyCalibration = useCallback((id: string, verifiedComponents: string[]) => {
    setDiscoveredComponents(prev => ({ ...prev, [id]: verifiedComponents }));
    setCalibrationStates(prev => ({ ...prev, [id]: 'verified' }));
  }, []);

  return {
    deviceData, deviceNames, setDeviceName, powerStates, toggleDevicePower,
    addDevice, removeDevice, status, simulated, setSimulated,
    forceFault, setForceFault, lastUpdated, telemetryHistory, reconnectAttempts,
    calibrationStates, discoveredComponents, verifyCalibration,
    // Phase 4 exports
    calibrationProgress,
    variableRpm, setVariableRpm,
    tamperedPod, setTamperedPod,
  };
};
