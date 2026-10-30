from fastapi import FastAPI

app = FastAPI(title="AI-Digital-Signature-Fraud-Detector ML Service")

@app.get("/")
def read_root():
    return {"message": "ML Service is running. Isolation Forest model not yet implemented."}

# Future endpoint for inference
# @app.post("/predict")
# def predict_anomaly(data: dict):
#     pass
