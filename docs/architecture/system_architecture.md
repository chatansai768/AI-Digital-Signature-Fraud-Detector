# System Architecture

The AI-Based Digital Signature Fraud Detector uses a microservices-inspired architecture combining Node.js for core logic and Python for AI processing.

## 1. High-Level Flow

```
[React Frontend]
      │
      │ (REST API / JSON / Multipart form)
      ▼
[Node.js Backend] ──> [MongoDB] (User Data, Signing History, Alerts)
      │
      │ (Internal REST call)
      ▼
[Python ML Service]
      │
      ▼
[Isolation Forest Model] -> Returns Risk Score
```

## 2. Components

### Frontend (React + Vite)
- Provides user interfaces for Login, Registration, Document Upload, and the Admin Dashboard.
- Communicates securely via HTTPS (in production) to the Backend using JWT tokens.

### Backend (Node.js + Express)
- Handles API routing, middleware (Auth), and temporary document storage.
- Performs cryptographic operations (SHA-256 hashing, RSA signing & verification).
- Maintains signing history in MongoDB.

### Database (MongoDB)
- Stores users, cryptographic public keys (private keys are managed by users/KMS, NOT stored in plain text).
- Stores signing metadata: Timestamp, IP Address, Document Hash, Resulting Signature.

### ML Service (Python + FastAPI)
- Receives metadata about a signing event.
- Runs data through the trained Isolation Forest model.
- Returns a Risk Score and flags if the behavior is an anomaly.

## 3. Security Considerations
- **Private Keys**: Never stored in plaintext in the database.
- **AI Limitations**: The AI generates a "Risk Score" or flags a "Behavioral Anomaly" representing "Potential signing-key misuse". It cannot definitively prove a key is stolen.
- **Integrity**: Any change to a signed document changes the SHA-256 hash, causing RSA verification to fail. This is deterministic and independent of the AI.
