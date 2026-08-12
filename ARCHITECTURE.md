# SentinelEdge Architecture & Flowchart

```mermaid
graph TD
    %% Styling
    classDef hardware fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;
    classDef software fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef mechanical fill:#334155,stroke:#94a3b8,stroke-width:2px,color:#f8fafc;
    classDef network fill:#020617,stroke:#8b5cf6,stroke-width:2px,color:#f8fafc;

    %% Machine Layer
    subgraph Physical Layer [Legacy Industrial Machine]
        direction LR
        M_Motor[Drive Motor]:::mechanical
        M_Gear[Gearbox]:::mechanical
        M_Spindle[Spindle]:::mechanical
    end

    %% Edge Node Layer
    subgraph Hardware Layer [SentinelEdge Pods]
        direction TB
        Sensors[Multimodal Sensors<br/>ADXL355 Vibrations<br/>INMP441 Acoustic<br/>MLX90614 Thermal]:::hardware
        MCU[ESP32-S3 Dual Core<br/>Edge AI & DSP]:::hardware
        
        Sensors -->|Raw High-Hz Data| MCU
        MCU -->|FFT & TinyML Anomaly Score| ESP_NOW[ESP-NOW Transceiver]:::hardware
    end

    %% Network Mesh
    subgraph Mesh Network [Decentralized Mesh Topology]
        direction LR
        Node2[Slave Pod 2<br/>Gearbox]:::network
        Node3[Slave Pod 3<br/>Spindle]:::network
        Master[Master Pod 1<br/>Data Aggregator]:::network
        
        Node2 -.->|< 3ms Sync| Master
        Node3 -.->|< 3ms Sync| Master
    end

    %% Software Layer
    subgraph Application Layer [Next.js Digital Twin Dashboard]
        direction TB
        Broker[MQTT Broker]:::software
        Engine[Predictive Maintenance Engine<br/>RUL Calculation]:::software
        UI[React Three Fiber<br/>3D Machine Render]:::software
        Alerts[E-Stop & Work Orders]:::software
        
        Broker -->|Telemetry Streams| Engine
        Engine --> UI
        Engine --> Alerts
    end

    %% Connections
    Physical Layer -.->|Magnetic Snap-on| Hardware Layer
    ESP_NOW --> Mesh Network
    Master ==>|Secure MQTT<br/>Health % Only| Broker
```

## System Workflow (How it operates)
1. **Data Acquisition:** The magnetic pod attaches to the legacy machine. Sensors sample vibration and sound at 10kHz.
2. **Edge Processing:** The ESP32-S3 computes the Fast Fourier Transform (FFT) locally. No raw data is sent to the cloud.
3. **Mesh Aggregation:** For large machines, multiple pods form an ESP-NOW wireless mesh, electing a Master to cross-correlate vibration shocks in real-time.
4. **Digital Twin Visualization:** The aggregated "health telemetry" is sent via MQTT to the Next.js dashboard, driving the 3D model, degradation curves, and predictive alerts.
