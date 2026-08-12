<div align="center">
  <h1>🛡️ SentinelEdge</h1>
  <p><strong>Predictive Maintenance Edge-AI Pod & Digital Twin Dashboard</strong></p>
  <p><i>Built for the MSME Hackathon 6.0</i></p>
</div>

<br />

> **SentinelEdge** democratizes predictive maintenance for Micro, Small & Medium Enterprises (MSMEs). By combining a sub-$50 magnetic, snap-on Edge AI sensor pod with a real-time 3D Digital Twin dashboard, factories can instantly upgrade their legacy machinery into smart, predictive assets—without millions of dollars in enterprise contracts or expensive cloud telemetry costs.

---

## ✨ Key Features

- **🧲 Snap-On Deployment:** The hardware pod mounts via N52 neodymium magnets to any industrial machine. Zero drilling, zero downtime, zero wiring.
- **🤖 Edge AI (Blind Source Separation):** The pod performs Fast Fourier Transform (FFT) spectral analysis locally on the edge. It automatically discovers the mechanical components (bearings, gears, motors) hidden inside the machine without needing a manual manifest.
- **📉 Predictive Maintenance:** Uses degradation tracking to calculate the Remaining Useful Life (RUL) of components. It generates prioritized, actionable work orders (e.g., "Replace gear set immediately") before catastrophic failure occurs.
- **🔊 Spectral & Acoustic Fusion:** By fusing data from a high-frequency ADXL355 accelerometer and an I2S MEMS microphone, the AI filters out ambient factory noise and locks onto the fundamental RPM of the machine using **Order Tracking**.
- **🌐 3D Digital Twin Dashboard:** A stunning, professional-grade Next.js web application utilizing React Three Fiber to render a live, interactive 3D model of the machine overlaid with real-time component health telemetry.

👉 **[View the detailed Architecture & System Flowchart here](./ARCHITECTURE.md)**

---

## 🛠️ The Hardware Blueprint (Under $50)

Unlike legacy systems (Fluke, SKF) that cost thousands per node, SentinelEdge is built for MSMEs using accessible, powerful edge components:
1. **ESP32-S3:** Dual-core MCU with vector instructions for running TinyML/TensorFlow Lite on the edge.
2. **ADXL355 / ADXL1002:** Ultra-low noise, high-frequency (10kHz) vibration sensor required to detect microscopic bearing faults.
3. **INMP441 (I2S MEMS Mic):** Digital acoustic sensor to capture high-frequency gear wear signatures.
4. **MLX90614:** Non-contact IR thermal sensor.
5. **N52 Magnetic Base:** For instant, secure mounting.

---

## 🚀 Getting Started (Software Dashboard)

The software dashboard is built with Next.js, React Three Fiber, and TailwindCSS. It includes a built-in local simulation engine so judges can test the predictive algorithms without needing physical hardware connected.

### Installation

```bash
# Clone the repository
git clone https://github.com/Nishant17s/MSME_HACK-6.0.git
cd MSME_HACK-6.0

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

---

## 🧪 How to Demo (For Reviewers & Judges)

The dashboard includes a powerful **Dev Tools** simulation panel (located at the bottom of the right-hand telemetry panel). Use this to demonstrate the exact edge-cases you will face in a real factory:

1. **Auto-Calibration & Component Discovery:**
   - Click "+ Register Pod Manually" on the bottom left.
   - Watch the right panel enter a 15-second, 3-phase AI Calibration sequence (Environment Noise Profiling ➔ RPM Order Tracking ➔ Component Inference).
   - Once complete, verify the discovered components.

2. **Variable Machine RPM Handling:**
   - Enable `Local Simulation` and toggle **`Variable Machine RPM`**.
   - Navigate to the **Spectral** tab. You will see the FFT peaks dynamically shifting left and right as the machine speeds up and slows down. The anomaly score remains healthy, proving the algorithm uses dynamic *Order Tracking* rather than fixed frequency bands.

3. **Tamper & Misalignment Detection:**
   - Toggle **`Trigger Tamper Event`**.
   - This simulates the magnetic pod being kicked or vibrating loose. 
   - Instead of destroying the machine's component health predictions, the dashboard intelligently intercepts the massive G-shock and flags a critical `Pod Misalignment / Tamper Detected` alert, freezing the degradation curves.

4. **Predictive Failure (Critical Fault):**
   - Toggle **`Trigger Critical Fault`**.
   - Watch the FFT chart instantly spike at bins 4-6 (simulating a high-frequency bearing defect). 
   - Switch to the **Maintenance** tab to watch the Bearing and Gear health bars drain exponentially until the AI issues a `REPLACE NOW` work order.

---

## 💻 Tech Stack
- **Framework:** Next.js 14 (App Router), React 18
- **Styling:** TailwindCSS, Lucide Icons
- **3D Rendering:** Three.js, React Three Fiber (R3F), React Three Drei
- **Data & IoT:** MQTT (simulated client)
- **State Persistence:** LocalStorage (for custom pod configurations and 3D models)

<br/>
<div align="center">
  <i>Built with ❤️ for MSME Hackathon 6.0</i>
</div>
