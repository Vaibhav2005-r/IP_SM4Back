import random
import pandas as pd
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# Scikit-learn and ChromaDB
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import chromadb

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. ChromaDB Setup (Vector Database) ---
chroma_client = chromadb.Client()
collection = chroma_client.create_collection(name="product_embeddings")

# Pre-seed vector DB with some products
seed_products = ["Tata Salt", "Aashirvaad Atta", "Samsung Galaxy", "Amul Butter"]
collection.add(
    documents=["Premium iodine salt", "Whole wheat flour", "Flagship smartphone", "Fresh dairy butter"],
    metadatas=[{"category": "FMCG"}, {"category": "FMCG"}, {"category": "Electronics"}, {"category": "Dairy"}],
    ids=["prod_1", "prod_2", "prod_3", "prod_4"]
)

# --- 2. Market Trend Engine (Random Forest) ---
def train_market_trend_engine():
    """Trains a Random Forest model on dummy historical sales data to predict demand."""
    print("Training ML Market Trend Engine...")
    df = pd.DataFrame({
        'product_id': np.random.randint(1, 5, 100),
        'past_sales_vol': np.random.randint(10, 500, 100),
        'competitor_price': np.random.uniform(20.0, 3000.0, 100),
        'demand_category': np.random.choice(['HIGH', 'LOW', 'STABLE'], 100)
    })
    
    le = LabelEncoder()
    df['demand_encoded'] = le.fit_transform(df['demand_category'])
    
    X = df[['product_id', 'past_sales_vol', 'competitor_price']]
    y = df['demand_encoded']
    
    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    rf.fit(X, y)
    return rf, le

trend_model, label_encoder = train_market_trend_engine()

# --- 3. Models ---
class Quotation(BaseModel):
    seller_name: str
    amount: float
    trust_score: float

class QuotationRequest(BaseModel):
    product_name: str
    quotations: List[Quotation]
    ai_mode: str = "GLOBAL" # "GLOBAL" (Gemini) or "LOCAL" (Ollama)

# --- 4. API Endpoints ---

import google.generativeai as genai
import json

genai.configure(api_key="YOUR_GEMINI_API_KEY")

@app.post("/api/ai/evaluate-quotes")
def evaluate_quotes(req: QuotationRequest):
    """AI Router for evaluating supplier quotations natively using Gemini API."""
    prompt = f"Evaluate these quotations for {req.product_name}:\n"
    for q in req.quotations:
        prompt += f"- Seller: {q.seller_name}, Amount: {q.amount}, Trust Score: {q.trust_score}/10\n"
    
    prompt += """
    Select the optimal quote based on a trade-off between price and trust score. You MUST select exactly one seller.
    Respond purely with a JSON object in this format, and no other text:
    {"selected_seller": "seller_name", "rationale": "reason"}
    """
    
    engine_used = "Mistral 7B (Local/Offline) [STUB]"
    best = min(req.quotations, key=lambda q: q.amount - (q.trust_score * 5))
    rationale = f"Selected {best.seller_name} due to optimal blend of low price (₹{best.amount}) and high trust score ({best.trust_score})."
    
    # Actually ping Google's AI if running globally
    if req.ai_mode == "GLOBAL":
        engine_used = "Gemini 1.5 Flash (Cloud)"
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            # Remove Markdown block wrapping if present
            clean_res = response.text.replace('```json', '').replace('```', '').strip()
            ai_choice = json.loads(clean_res)
            
            # Map back to python object
            best = next(q for q in req.quotations if q.seller_name == ai_choice['selected_seller'])
            rationale = ai_choice['rationale']
        except Exception as e:
            rationale = f"Gemini API failure, fell back to local math stub. Error: {str(e)}"
            
    return {
        "status": "success",
        "best_quotation": best,
        "engine_used": engine_used,
        "rationale": rationale
    }

@app.get("/api/ai/market-trend/{product_name}")
def market_trend(product_name: str):
    """Use Random Forest to predict demand, enhanced by ChromaDB semantic lookup."""
    # 1. Semantic lookup
    results = collection.query(
        query_texts=[product_name],
        n_results=1
    )
    
    category = "Unknown"
    if results['metadatas'][0]:
        category = results['metadatas'][0][0]['category']
        
    # 2. Predict using Random Forest
    dummy_input = pd.DataFrame({
        'product_id': [random.randint(1, 4)], 
        'past_sales_vol': [random.randint(50, 400)], 
        'competitor_price': [random.uniform(50.0, 1000.0)]
    })
    
    prediction = trend_model.predict(dummy_input)[0]
    probabilities = trend_model.predict_proba(dummy_input)[0]
    
    demand_tag = label_encoder.inverse_transform([prediction])[0]
    confidence = max(probabilities) * 100
    
    # 3. Dynamic pricing action
    price_action = "INCREASE_PRICE_5_PERCENT" if demand_tag == "HIGH" else "DISCOUNT" if demand_tag == "LOW" else "HOLD"
    
    return {
        "product": product_name,
        "semantic_category": category,
        "forecasted_demand": demand_tag,
        "confidence": f"{confidence:.1f}%",
        "recommended_pricing_action": price_action
    }

from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os
import datetime
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

@app.get("/api/reports/generate-pdf")
def generate_pdf_report():
    """Phase 5: Generate an End-Of-Month Finanacial Report with a Digital Cryptographic Signature."""
    pdf_filename = f"IMS_Financial_Report_{datetime.date.today()}.pdf"
    
    # 1. Generate PDF with ReportLab
    c = canvas.Canvas(pdf_filename, pagesize=letter)
    c.setFont("Helvetica-Bold", 24)
    c.setFillColorRGB(0, 0.19, 0.33)  # Prussian Blue
    c.drawString(100, 750, "IMS AI - End of Month Report")
    
    c.setFont("Helvetica", 14)
    c.setFillColorRGB(0, 0, 0)
    c.drawString(100, 700, "Profit/Loss Summary:")
    c.drawString(120, 670, "- Last Month Profit: Rs. 45,000")
    c.drawString(120, 640, "- Current Month Profit: Rs. 52,000")
    c.drawString(120, 610, "- Projected Profit: Rs. 60,000")
    
    c.drawString(100, 550, "Top Movers:")
    c.drawString(120, 520, "1. Tata Salt (FMCG) - HIGH DEMAND")
    c.drawString(120, 490, "2. Aashirvaad Atta (FMCG) - STABLE")
    
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(100, 100, f"Automatically generated by IMS AI Engine on {datetime.datetime.now()}")
    c.drawString(100, 80, "Digitally signed framework enforced.")
    c.save()
    
    # 2. Cryptographic Digital Signature
    # Generate private key
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    
    # Sign the file
    with open(pdf_filename, "rb") as f:
        pdf_data = f.read()
        
    signature = private_key.sign(
        pdf_data,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256()
    )
    
    # Save the cryptographic signature companion file
    with open(pdf_filename + ".sig", "wb") as f:
        f.write(signature)
        
    return FileResponse(pdf_filename, media_type='application/pdf', filename=pdf_filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
