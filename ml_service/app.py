"""
ML Microservice — Transaction Categoriser
Loads the trained DistilBERT model + LabelEncoder and exposes:
  POST /predict          → single transaction
  POST /predict-batch    → list of transactions
  GET  /health           → liveness check
"""

import os
import pickle
import warnings
warnings.filterwarnings("ignore")

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR   = os.path.join(BASE_DIR, "transaction_model")
ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder.pkl")

# ── Load model & encoder once at startup ─────────────────────────────────────
print("Loading tokenizer…")
tokenizer = DistilBertTokenizer.from_pretrained(MODEL_DIR)

print("Loading model…")
model = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
model.eval()

print("Loading label encoder…")
with open(ENCODER_PATH, "rb") as f:
    label_encoder = pickle.load(f)

print(f"✅ Model ready — categories: {list(label_encoder.classes_)}")

# ── Flask app ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)


def predict_category(description: str) -> dict:
    """Run inference on a single transaction description."""
    inputs = tokenizer(
        description.lower().strip(),
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128,
    )
    with torch.no_grad():
        logits = model(**inputs).logits
    probs      = torch.softmax(logits, dim=1)[0]
    pred_id    = int(torch.argmax(probs))
    pred_label = label_encoder.inverse_transform([pred_id])[0]
    confidence = round(float(probs[pred_id]) * 100, 2)
    return {
        "category":   pred_label,
        "confidence": confidence,
        "label_id":   pred_id,
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "categories": list(label_encoder.classes_)})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Body: { "description": "Netflix subscription" }
    Returns: { "category": "Entertainment", "confidence": 97.3, "label_id": 1 }
    """
    data = request.get_json(force=True)
    desc = data.get("description", "").strip()
    if not desc:
        return jsonify({"error": "description is required"}), 400
    try:
        result = predict_category(desc)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    """
    Body: { "descriptions": ["Netflix", "Whole Foods", ...] }
    Returns: [ { "category": ..., "confidence": ..., "label_id": ... }, ... ]
    """
    data = request.get_json(force=True)
    descriptions = data.get("descriptions", [])
    if not descriptions or not isinstance(descriptions, list):
        return jsonify({"error": "descriptions array is required"}), 400
    try:
        results = [predict_category(d) for d in descriptions]
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"🚀 ML service running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
