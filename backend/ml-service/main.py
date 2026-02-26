"""
CropGuardianAI — FastAPI ML Microservice
Models: LinearRegression (shelf life), IsolationForest (anomaly detection),
        RandomForest (risk classification)
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import uvicorn
import time

app = FastAPI(
    title="CropGuardianAI ML Service",
    description="ML microservice for spoilage prediction and anomaly detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models: pre-fit on synthetic data ──────────────────────────────────────

def make_training_data(n=200):
    """Generate synthetic cold-storage training data."""
    np.random.seed(42)
    temps     = np.random.uniform(-2, 12, n)
    humidities= np.random.uniform(60, 100, n)
    durations = np.random.uniform(1, 90, n)
    co2       = np.random.uniform(300, 900, n)

    # Shelf life: decreases with temp deviation, high humidity, and duration
    shelf_life = (
        30
        - np.abs(temps - 4) * 3
        - np.maximum(0, humidities - 90) * 1.5
        - durations * 0.3
        - (co2 - 400) * 0.01
        + np.random.normal(0, 1.5, n)
    ).clip(0, 60)

    # Spoilage % label
    spoilage = np.minimum(99, np.maximum(1,
        5
        + np.abs(temps - 4) * 8
        + np.maximum(0, humidities - 90) * 3
        + durations * 0.25
        + np.random.normal(0, 3, n)
    ))

    # Risk class: 0=low, 1=medium, 2=high
    risk_class = np.where(spoilage < 25, 0, np.where(spoilage < 60, 1, 2))

    X = np.column_stack([temps, humidities, durations, co2])
    return X, shelf_life, spoilage, risk_class

X_train, y_shelf, y_spoilage, y_risk = make_training_data(300)

# Scaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)

# Shelf life regressor
shelf_model = LinearRegression()
shelf_model.fit(X_scaled, y_shelf)

# Spoilage regressor
spoilage_model = LinearRegression()
spoilage_model.fit(X_scaled, y_spoilage)

# Risk classifier
risk_model = RandomForestClassifier(n_estimators=50, random_state=42)
risk_model.fit(X_scaled, y_risk)

# Anomaly detector
anomaly_model = IsolationForest(contamination=0.08, random_state=42)
anomaly_model.fit(X_scaled)

RISK_LABELS = {0: "low", 1: "medium", 2: "high"}
RECOMMENDATIONS = {
    "low":    "Conditions are optimal. Maintain current settings.",
    "medium": "Monitor closely. Reduce humidity by 3-5% and check door seals.",
    "high":   "URGENT: Immediate inspection required. Start crop withdrawal procedure."
}

# ── Request/Response Schemas ────────────────────────────────────────────────

class PredictRequest(BaseModel):
    temp_readings:     List[float]
    humidity_readings: List[float]
    storage_duration:  float = 7.0
    crop_type:         Optional[str] = "general"
    co2_level:         Optional[float] = 420.0

class PredictResponse(BaseModel):
    spoilage_probability: float
    safe_days:           float
    risk_class:          str
    recommendation:      str
    confidence:          float
    model_version:       str = "1.0.0"

class AnomalyRequest(BaseModel):
    temp_readings:     List[float]
    humidity_readings: List[float]
    co2_levels:        Optional[List[float]] = None

class AnomalyResponse(BaseModel):
    is_anomaly:    bool
    anomaly_score: float
    anomalous_points: int
    total_points:     int
    details:          str

# ── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "CropGuardianAI ML Service",
        "models": ["LinearRegression", "RandomForestClassifier", "IsolationForest"],
        "timestamp": time.time()
    }

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not req.temp_readings or not req.humidity_readings:
        raise HTTPException(status_code=400, detail="temp_readings and humidity_readings are required.")

    avg_temp = float(np.mean(req.temp_readings))
    avg_hum  = float(np.mean(req.humidity_readings))

    X = scaler.transform([[avg_temp, avg_hum, req.storage_duration, req.co2_level or 420]])

    spoilage = float(np.clip(spoilage_model.predict(X)[0], 1, 99))
    shelf    = float(np.clip(shelf_model.predict(X)[0], 0, 90))
    risk_idx = int(risk_model.predict(X)[0])
    risk_str = RISK_LABELS[risk_idx]
    confidence = float(np.max(risk_model.predict_proba(X)[0]) * 100)

    return PredictResponse(
        spoilage_probability=round(spoilage, 2),
        safe_days=round(shelf, 1),
        risk_class=risk_str,
        recommendation=RECOMMENDATIONS[risk_str],
        confidence=round(confidence, 1)
    )

@app.post("/anomaly", response_model=AnomalyResponse)
def detect_anomaly(req: AnomalyRequest):
    if len(req.temp_readings) != len(req.humidity_readings):
        raise HTTPException(status_code=400, detail="temp and humidity arrays must be same length.")

    n = len(req.temp_readings)
    co2 = req.co2_levels or [420.0] * n
    durations = [5.0] * n

    X = scaler.transform(list(zip(req.temp_readings, req.humidity_readings, durations, co2)))
    preds  = anomaly_model.predict(X)         # -1 = anomaly, 1 = normal
    scores = anomaly_model.score_samples(X)   # more negative = more anomalous

    n_anomalies = int(np.sum(preds == -1))
    avg_score   = float(np.mean(scores))
    is_anomaly  = n_anomalies > 0

    details = (
        f"Detected {n_anomalies}/{n} anomalous readings. Average anomaly score: {avg_score:.3f}."
        if is_anomaly else
        f"All {n} readings are within normal parameters."
    )

    return AnomalyResponse(
        is_anomaly=is_anomaly,
        anomaly_score=round(avg_score, 4),
        anomalous_points=n_anomalies,
        total_points=n,
        details=details
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
