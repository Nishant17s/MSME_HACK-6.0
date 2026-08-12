# SentinelEdge: MSME Hackathon PPT Content

*Use this outline to create your presentation slides. Each section represents 1-2 slides.*

## Slide 1: Title Slide
- **Project Title:** SentinelEdge
- **Subtitle:** Non-Intrusive Edge-AI Multimodal Sensor Pod for Legacy Industrial Machine Health Monitoring
- **Team/Presenter:** [Your Name/Team]
- **Theme:** Industry 4.0 and 5.0

## Slide 2: Objective
- **Goal:** To democratize predictive maintenance for MSMEs using an affordable, zero-cloud Edge-AI pod.
- **Cost Target:** Sub-₹10,000 INR per retrofit pod.
- **Technical Target:** Achieve >90% accuracy in detecting bearing wear, structural imbalance, and tool micro-cracks prior to physical breakdown.
- **Operational Target:** Reduce unplanned machine downtime for MSME job shops by 15-20%.

## Slide 3: Concept
- **The Problem:** MSMEs cannot afford ₹3,00,000+ condition monitoring systems from legacy giants, nor the recurring cloud subscription costs.
- **The Solution:** A self-contained, non-intrusive diagnostic unit. 
- **How it Works:** The magnetic pod snaps onto legacy machinery, analyzes acoustic and vibration data locally on the edge, and transmits health scores to a local 3D Digital Twin dashboard.

## Slide 4: Block Diagram
*(Insert the Architecture flowchart here from your GitHub repo)*
- **Key Modules:** 
  - Multimodal Sensors (ADXL355, INMP441, IR)
  - Edge AI Microcontroller (ESP32-S3)
  - Wireless Mesh Transceiver (ESP-NOW/MQTT)
  - Next.js 3D Digital Twin Dashboard

## Slide 5: Components Used & Needs
- **Microcontroller:** ESP32-S3 (Dual-core, Edge AI capable)
- **Vibration Sensor:** Analog Devices ADXL355 (High-frequency 3-axis accelerometer for micro-crack detection)
- **Acoustic Sensor:** INMP441 (Digital I2S MEMS microphone for gear mesh noise)
- **Thermal Sensor:** MLX90614 (Non-contact IR thermal probe)
- **Mounting:** N52 Neodymium Magnetic Base (For tool-less installation)
- **Software:** Next.js, React Three Fiber (Digital Twin UI), TinyML (Local Inference)

## Slide 6: Uniqueness & Newness
- **Zero Cloud Dependency:** Performs FFT signal processing and TinyML anomaly detection directly on the pod. Eliminates recurring cloud bandwidth costs.
- **Blind Source Separation (Auto-Calibration):** Automatically "listens" and infers machine components (bearings, spindles) without requiring manual frequency programming by an engineer.
- **Multimodal Sensor Fusion:** Fuses vibration and acoustics to dynamically filter out ambient factory noise.
- **Decentralized Mesh Topology:** Uses ESP-NOW to sync multiple pods across massive machines in <3ms.

## Slide 7: Potential Applications
- **Automotive Component Machining:** CNC mills, lathes, grinding machines in Tamil Nadu auto-hubs.
- **Textile Printing & Weaving:** High-speed looms and rollers where bearing failure causes severe fabric tearing.
- **Plastic Molding Extrusion:** Injection molding machinery to monitor thermal overload.
- **General Engineering Job Shops:** Retrofitting 10+ year-old analog machinery without native digital telemetry.

## Slide 8: Market Potential
- **Massive Target Market:** Millions of legacy machines across Indian industrial clusters (Coimbatore, Chennai) operate without digital telemetry.
- **Immediate ROI:** A single unpredicted spindle breakdown costs ₹50,000+ in lost production. The pod pays for itself upon its first prevented failure.
- **Import Substitution:** Provides a highly affordable, indigenous alternative to expensive imported condition monitoring hardware (Aligning with Make in India).

## Slide 9: Expected Output
- A fully functional, magnetically attachable Edge-AI sensor pod.
- A beautiful, local web-based 3D Digital Twin dashboard.
- Real-time predictive Remaining Useful Life (RUL) tracking for machine components.
- Automated generation of maintenance work orders prior to catastrophic failure.

## Slide 10: Budget Plan (Per Node Prototype)
- **Processing Unit (ESP32-S3):** ₹750
- **Accelerometer (ADXL355 module):** ₹2,200
- **Acoustic & Thermal Sensors:** ₹850
- **PCB Fabrication & Enclosure (3D Printed/N52 Magnets):** ₹600
- **Miscellaneous (Battery/Power/Passives):** ₹400
- **Total Estimated BOM:** ~₹4,800 INR (Safely under the ₹10,000 objective)

## Slide 11: References
- Analog Devices: *Condition Monitoring and Predictive Maintenance Solutions.*
- TinyML Foundation: *Edge-AI implementations for Industrial IoT.*
- MSME Hackathon 6.0 Official Guidelines.
