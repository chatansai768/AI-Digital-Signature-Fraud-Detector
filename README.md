# AI-Based Digital Signature Fraud Detector

## Overview
This is a final-year B.Tech Computer Science research project.
The system combines cryptographic digital signatures (RSA & SHA-256) with AI-based behavioral anomaly detection (Isolation Forest) to secure document integrity and monitor potentially compromised signing keys.

### Important Research Context
The AI subsystem detects *behavioral anomalies* in document signing behavior (e.g., suspicious IP, abnormal time of day, unusual frequency). It outputs a risk score and generates an alert of "Potential signing-key misuse". It does *not* claim definitive proof of fraud. Human administrators investigate these alerts.

## Project Structure
- `frontend/`: React + Vite application
- `backend/`: Node.js + Express API handling authentication, document uploads, and cryptographic signing
- `ml-service/`: Python + FastAPI microservice hosting the scikit-learn Isolation Forest model
- `docs/`: System architecture and research documents

## Phases
* **Phase 1**: Project Structure Setup (Current)
* **Phase 2**: User Authentication
* **Phase 3**: Document Upload
* **Phase 4**: SHA-256 Hashing
* **Phase 5**: RSA Signing
* **Phase 6**: Signature Verification & Tamper Detection
* **Phase 7**: MongoDB Signing History
* **Phase 8**: Isolation Forest Anomaly Detection
* **Phase 9**: Risk Scoring
* **Phase 10**: Alerts and Reports
* **Phase 11**: Admin Dashboard
* **Phase 12**: Testing and Security
* **Phase 13**: Research Experiments & Paper Results
