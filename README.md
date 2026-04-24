# 🚀 AI-Powered Inventory Management System (IMS)

A complete, production-ready full-stack intelligent Inventory Management System built specifically for the Indian Market, featuring a predictive ML backbone, cryptographic security, and automated communication.

## 🏗️ Architecture Stack
1. **Frontend**: React 18 + Vite, Tailwind CSS v4, Framer Motion, Recharts
2. **Backend**: Java 17 + Spring Boot 3, Spring Data JPA, JWT Security
3. **Database**: MySQL Community Server (with H2 Fallback)
4. **AI Microservice**: Python 3.9 + FastAPI, Scikit-Learn, ChromaDB, Google Gemini (GenAI)
5. **Reporting & Security**: ReportLab, Cryptography (RSA/PSS)
6. **Communication**: Twilio SDK (WhatsApp), JavaMail

---

## 📂 Project Structure
```text
/Users/vaibhav/IP_SM
├── backend/                       # Java Spring Boot Services
│   ├── src/main/java/com/example/demo
│   │   ├── config/                # JWT & CORS Security Configuration 
│   │   ├── controller/            # REST API (Alerts, Products)
│   │   ├── entity/                # JPA Objects (Products, Orders)
│   │   ├── repository/            # MySQL Database Access
│   │   └── service/               # NotificationService (Twilio/Mail)
│   └── src/main/resources
│       ├── schema.sql             # SQL Initializer
│       ├── data.sql               # 100+ Indian Market Mock Dataset
│       └── application.properties # Server, DB, Twilio, and SMTP configs
│
├── frontend/                      # React UI
│   ├── src/App.jsx                # Global App, Routes, Role Gateways
│   ├── src/index.css              # Glassmorphism & Animations
│   └── tailwind.config.js         # Prussian Blue Branding
│
├── ai_microservice/               # Python AI Engine
│   ├── main.py                    # FastAPI (Port 8000)
│   └── venv/                      # Python Dependencies Layer
└── README.md
```

## 🛠️ Step-by-Step Setup Instructions

### 1. Start the Java Backend (Port 8081)
Navigate into the backend and boot the Java service. This will automatically digest the `schema.sql` and `data.sql` to populate your 100+ realistic Indian Products.
```bash
cd backend
./mvnw clean spring-boot:run
```

### 2. Start the AI Microservice (Port 8000)
Navigate to the AI layer, activate the virtual environment, and launch FastAPI via Uvicorn.
```bash
cd ai_microservice
source venv/bin/activate
# Make sure reportlab, cryptography, pandas, scikit-learn, google-generativeai are installed
python main.py
```

### 3. Start the React Frontend (Port 5173)
Launch the modern Vite server.
```bash
cd frontend
npm install
npm run dev
```

---

## 📕 API Documentation Reference

### Java Spring Boot (`http://localhost:8081`)

*   `POST /api/alerts/low-stock`
    *   **Description**: Receives a webhook when a sale pushes inventory below threshold (10 units). Immediately executes `NotificationService` to send a Twilio WhatsApp message and an SMTP Email.
    *   **Payload**: `{"productName": "Tata Salt", "currentStock": 5}`

*   `GET /api/products` (Internal JPA Configured)
    *   **Description**: Pulls the active tracked rows mapped securely via Spring Boot's automatic repository wiring.

### Python FastAPI AI Engine (`http://localhost:8000`)

*   `POST /api/ai/evaluate-quotes`
    *   **Description**: Connects to the **Google Gemini 1.5 Flash API**. Evaluates an array of supplier quotations and determines the best choice analytically based on Trust Score and Price (₹).
    *   **Payload**: `{"product_name": "Tata Salt", "quotations": [...], "ai_mode": "GLOBAL"}`

*   `GET /api/reports/generate-pdf`
    *   **Description**: Dynamically generates the **End-Of-Month Financial Output**. Generates an ephemeral `RSA-2048` cryptographic key to digitally sign the document utilizing SHA-256 PSS hashing before pushing the PDF Binary out to the client.

*   `GET /api/ai/market-trend/{product_name}`
    *   **Description**: Evaluates localized product trajectories using an actively trained **Scikit-Learn Random Forest Classifier**. Infers semantic meaning from ChromaDB and recommends `APPLY DISCOUNT` or `INCREASE PRICE` based on volume history.

---

## ✅ Implementation Checklist Met
- [x] **Core System:** MySQL + Java Backend + React/Tailwind frontend.
- [x] **User Roles:** Admin metrics/approvals vs User transaction routing.
- [x] **Reporting:** Native `reportlab` generated PDFs backed by `cryptography`.
- [x] **Alerts:** Twilio integration for WhatsApp + JavaMail SMTP.
- [x] **Workflow Automation:** Gemini AI autonomously scoring Quotations.
- [x] **Market Trend Analysis:** Python `RandomForestClassifier` forecasting demand dynamically.
- [x] **Finance Management:** Dynamic Recharts rendering Gross Value against 9% SGST/CGST.
- [x] **AI Backbone:** ChromaDB and Generative AI bridged seamlessly via FastAPI.
- [x] **Security:** CORS bindings locked, JWT properties placed, RSA signatures active.
- [x] **UI/UX Design:** High-End Framer Motion tracking animations with premium Prussian Blue color schemes wrapped in pure glassmorphism layers.
