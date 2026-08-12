# SentinelEdge: Project Report Content

## Abstract of the Idea / Innovation
- SentinelEdge is a sub-₹10,000, magnetically attached, Edge-AI sensor pod designed to retrofit legacy industrial machinery with condition monitoring.
- It fuses vibration, acoustic, and thermal data to detect mechanical faults like bearing wear and gear micro-cracks before they cause catastrophic failure.
- The innovation lies in performing Fast Fourier Transform (FFT) and machine learning inference directly on the edge using an ESP32-S3 microcontroller.
- This eliminates the need for expensive cloud bandwidth and recurring subscription costs, making it highly affordable for MSMEs.
- Telemetry is transmitted via MQTT to a local, Next.js-powered 3D Digital Twin dashboard that visually tracks Remaining Useful Life (RUL).

## Problem Identification
- Over 80% of MSME manufacturing units in Tamil Nadu operate legacy, analog machinery with zero digital condition monitoring.
- Current condition monitoring solutions from multinational corporations cost over ₹3,00,000 per machine and require expensive cloud servers.
- MSMEs rely entirely on reactive maintenance, leading to unpredicted breakdowns that halt entire assembly lines.
- A single sudden spindle failure in a Coimbatore auto-parts CNC mill can result in ₹50,000 to ₹1,50,000 in immediate repair and lost production costs.

## Background for Getting the Idea
### A. Who is it for?
- Small to medium machine shops, textile mills, and auto-component manufacturers across Indian industrial hubs (e.g., Ambattur, Coimbatore, Tiruppur).
- Non-technical shop floor operators who need simple, visual alerts (Green/Yellow/Red) rather than complex spreadsheets of vibration data.

### B. What will it do?
- Magnetically snap onto a machine and automatically "listen" to establish a baseline of normal operation using Blind Source Separation.
- Continuously monitor high-frequency mechanical signatures to detect anomalies.
- Wirelessly trigger a local dashboard or E-Stop relay the moment a critical threshold is breached.

## Newness / Uniqueness of the Innovation
- **Zero Cloud Dependency:** All heavy signal processing (FFT) happens locally on the sensor pod, ensuring zero recurring cloud bandwidth costs.
- **Auto-Calibration:** Eliminates the need for manual frequency programming by an engineer; the pod self-learns the machine's specific BPFO/BPFI frequencies.
- **Multimodal Fusion:** Fuses 10kHz vibration data with MEMS acoustic data to intelligently filter out ambient factory noise.
- **Decentralized Mesh:** Multiple pods can form an ESP-NOW wireless mesh to monitor massive 30-foot machines without running copper wiring.

## Objective of the Idea
- To develop an affordable, sub-₹10,000 INR retrofit predictive maintenance pod for legacy industrial machinery.
- To achieve >90% accuracy in detecting bearing wear and tool micro-cracks prior to physical breakdown.
- To reduce unplanned machine downtime for MSME job shops in Tamil Nadu by 15-20%.

## Potential Areas of Application in Industry / Market
- **Automotive Component Suppliers:** Retrofitting CNC mills and lathes in the Chennai auto-hub to monitor spindle bearings and tool degradation.
- **Textile Printing Industries:** Attaching to high-speed looms and rollers in Tiruppur where bearing failure causes severe fabric tearing.
- **Plastic Molding Extrusion:** Monitoring thermal overload and mechanical strain on extruder drives and hydraulic pumps.
- **Agro-Machinery Units:** Monitoring flour mills and conveyor drives in harsh, dust-heavy environments.

## Market Data for the Potential Idea
- The Indian industrial automation market is projected to reach ₹2,50,000 Crores by 2027, driven heavily by Industry 4.0 adoption.
- Tamil Nadu houses over 6.89 lakh registered MSMEs, a vast majority of which operate legacy machinery lacking digital telemetry.
- The global predictive maintenance market is expanding rapidly, but current penetration in the Indian MSME sector is less than 5% due to high capital expenditure barriers.

## Current Development Status
- **Software:** Fully developed Next.js 3D Digital Twin dashboard featuring simulated telemetry, auto-calibration UI, and ESP-NOW mesh topologies.
- **Hardware Selection:** BOM finalized with ESP32-S3, ADXL355, INMP441, and N52 magnetic mounts, keeping total cost under ₹5,000 INR.
- **Algorithms:** Edge-FFT and TinyML logic architecture has been mapped and successfully simulated in the digital dashboard.

## Literature Survey / Prior Art
- Existing patents (e.g., SKF Enlight, Siemens MindSphere) heavily rely on sending raw vibration data to proprietary cloud infrastructure.
- Academic papers on TinyML demonstrate the viability of running 1D-CNNs for anomaly detection on constrained microcontrollers (ESP32).
- Prior art in India primarily focuses on generic IoT dashboards rather than specialized, high-frequency multimodal edge-inference pods.

## Solution Proposed
> **[IMAGE NEEDED HERE: Insert the Architecture Block Diagram/Flowchart showing the Machine -> Sensor Pod -> MQTT -> Dashboard flow]**
- The solution is the **SentinelEdge Pod**, which combines a 3-axis accelerometer and a digital microphone.
- The pod is magnetically attached to the machine chassis, acquiring data at a 10kHz sample rate.
- It performs local FFT and anomaly scoring, transmitting only a lightweight JSON payload over MQTT to a local server.
- The operator monitors the shop floor via a highly visual, 3D Digital Twin dashboard that highlights failing components in real-time.

## How You Actually Make, Assemble, or Build the Solution
- **PCB Fabrication:** Design a 4-layer custom PCB integrating the ESP32-S3, ADXL355, and power management circuits.
- **Enclosure:** 3D print an industrial-grade ABS/PETG housing with integrated N52 neodymium magnets in the base for secure attachment.
- **Firmware:** Flash the ESP32 with C++ FreeRTOS firmware to handle DMA I2S sensor sampling and TinyML inference.
- **Software:** Deploy the Next.js dashboard locally on a Raspberry Pi gateway or an existing factory PC.

## Execution / Implementation Complexity
- **Hardware Complexity:** Moderate. Requires careful PCB trace routing to minimize electrical noise on the high-frequency accelerometer lines.
- **Software Complexity:** High. Requires optimizing the FFT algorithms and quantized TinyML models to run efficiently within the ESP32's limited SRAM.
- **Installation Complexity:** Extremely Low. The end-user simply snaps the magnetic pod onto the machine and connects it to the local Wi-Fi.

## Risk Factors Involved
- **Environmental Hazards:** Industrial environments have high EMI (Electromagnetic Interference), heavy dust, and temperatures exceeding 60°C.
- **Mitigation:** The PCB must be conformal coated, and the enclosure must be IP67 rated to ensure survivability.
- **Algorithmic Drift:** As machines naturally age, their baseline vibration changes, which could trigger false positive alerts.
- **Mitigation:** Implementing a dynamic rolling baseline in the AI model that slowly adapts to natural machine aging.

## How Soon Could the Idea be Put Into Operation (TRL)
- **Current TRL:** TRL 3/4 (Analytical and experimental critical function proof-of-concept via software simulation).
- **Target TRL for Pilot:** TRL 7 (System prototype demonstration in an operational environment) can be achieved within 3 to 4 months.
- **Commercial Deployment:** Full-scale production and commercial rollout to MSMEs can be achieved within 8 to 12 months.

## Workplan / Timeline
- **Month 1:** Custom PCB schematic design, component sourcing, and initial 3D enclosure prototyping.
- **Month 2:** PCB assembly, initial firmware development (I2S DMA sampling, FFT implementation).
- **Month 3:** TinyML model training using baseline datasets; integration of the pod with the Next.js digital twin dashboard.
- **Month 4:** Field testing pilot at a local CNC machining MSME in Chennai/Coimbatore; data collection and model refinement.

## Intellectual Property / Patenting Possibility
- The core concept of using vibration sensors is not novel, but the specific **methodology** is patentable.
- **Potential Patent:** The unique algorithmic approach of fusing acoustic MEMS data with accelerometer data at the edge to perform localized Blind Source Separation and Order Tracking without cloud compute.
- This specific Edge-AI pipeline offers a strong case for an Indian process patent under the "Internet of Things for Industrial Automation" category.
