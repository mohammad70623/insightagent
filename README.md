# InsightAgent.ai — Enterprise RAG & Real-Time Analytics Pipeline

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Qdrant](https://img.shields.io/badge/Qdrant-Active-red?style=for-the-badge&logo=qdrant)](https://qdrant.tech)
[![Groq LLaMA](https://img.shields.io/badge/Groq_Inference-Powered-orange?style=for-the-badge)](https://groq.com)

🔗 **Live Production Deployment:** [insightagent-kappa.vercel.app](https://insightagent-kappa.vercel.app/)

**InsightAgent.ai** is an enterprise-grade SaaS analytics and Retrieval-Augmented Generation (RAG) platform that processes unstructured files to extract business intelligence dynamically. The system solves the problem of information latency by ingestion of raw, multi-format business documents, isolating them in secure tenant vector databases, and orchestrating live LLM synthesis to hydrate real-time interactive dashboards. Through dynamic multi-agent loops and decoupled state hydration, InsightAgent.ai bridges the gap between unstructured text and structured dashboard insights.

---



## ⚙️ Technical Architecture & Pipeline Flow

The platform separates the **Ingestion Pipeline** (multipart streams to isolated vector spaces) from the **Telemetry Analytics Loop** (semantic scroll to model synthesis).

### File Upload & Processing Flow
```
[Unstructured File Upload]
           │ (Multipart Form-Data Stream)
           ▼
[FastAPI /index-payload]
           │ (Disk Cache & Layout-Aware Extraction)
           ▼
[Semantic Text Chunker]
           │ (Character Size: 2000, Overlap: 300)
           ▼
[Embedding Service]
           │ (Dense Vectors; Dimension: 384)
           ▼
[Qdrant Database Cluster]
           │ (Tenant Collection Namespace Isolation: tenant_cluster_[user_id])
           ▼
[In-Memory Cache Invalidation]
           │ (GLOBAL_ANALYTICS_CACHE Clear)
           ▼
[Frontend Ingestion Polling Status] -> (Reports indexing at 100%)
```

### Live Graph Rendering Process
```
[Analytics Dashboard Page (React)]
           │ (Reads Document Metadata & Triggers Data Pulls)
           ▼
[FastAPI /chat/analytics/top-products]
           │ (Queries Vector Store & Filters by User ID)
           ▼
[Qdrant Collection Scroll]
           │ (Retrieves all Raw Chunks for matching User ID)
           ▼
[ChatGroq LLaMA Inference Engine]
           │ (Processes Corpus & Extracts Structured JSON Schema)
           ▼
[JSON Outbound Sanitizer]
           │ (Resolves Schema & Ensures Int/Float numeric conversions)
           ▼
[TopProducts Dashboard Component]
           │ (Renders Metrics Sorted by Conversion Descending)
```

---

## Architectural Tools List

| Layer | Technology | Engineering Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite, Tailwind CSS v4 | Provides atomic rendering, fast HMR bundling, and modern tailwind utility styling with zero-runtime latency. |
| **API Server** | FastAPI (ASGI), Uvicorn | High-performance async gateway handles concurrent multi-user streams and background tasks (e.g. Gmail ingestion loop). |
| **Vector DB** | Qdrant Client | Dynamic vector lookup, keyword filtering, and isolated tenant cluster namespaces (`tenant_cluster_[user_id]`). |
| **Inference Core** | LangChain / Groq Cloud (LLaMA 3.3) | Drives zero-shot semantic extraction, competitor benchmark analysis, and predictive simulation engines. |
| **ORM & Database**| SQLAlchemy, PostgreSQL, Alembic | Manages structured application state, tenant credentials, user configurations, and audit telemetry records. |

---

## 🚀 Core System Features

* **Secure Tenant Isolation:** Multi-tenant vector spacing isolates document embeddings in Qdrant collections matching specific `user_id` string filters, ensuring data isolation.
* **Asynchronous Telemetry Hydration:** Decoupled data fetching pulls dashboard metrics asynchronously, preventing long-running LLM completions from locking the main user interface.
* **Layout-Aware Ingestion:** Text extraction pipeline utilizes advanced layout parsing (`pdfplumber` / `pypdf` fallbacks) to capture table matrices, column flows, and written-word percentages accurately.
* **Dynamic Simulation Engines:** Integrates forecast simulators that ingest variable sliders (pricing, marketing, innovation) to generate real-time projections and tactical markdown reports via specialized LLM routing.
* **System-Wide Cache Sync:** Automatically invalidates cached data buffers on new file ingestion, ensuring metrics dashboards dynamically reflect the latest operational state.

---

## 🧪Bug Fixes & Challenges Resolved

The recent production release resolved three critical bottlenecks:

### 1. Fixing Dashboard Loading & Data Disappearance Issues
* **The Problem:** The parent dashboard ([Analytics.jsx](file:///c:/SaasProject/insightagent/frontend/src/pages/Analytics.jsx)) initialized `activeDocumentId` as `null` during mount. The state-dependent `activeDocumentId` effect fired on initial render and called `setReports([])`, wiping out the concurrent mount-based GET fetch to `/top-products`.
* **The Resolution:** Added an early return guard (`if (!activeDocumentId) return;`) to prevent initial null states from resetting dashboard states. Furthermore, `fetchUploadedFiles` was refactored to extract the newly ingested `targetId` directly from the raw API response and pass it immediately to `fetchTopProducts(targetId)`. This bypasses React's asynchronous state queue delay, ensuring immediate UI hydration upon upload completion.

### 2. Fixing AI API Key Configuration
* **The Problem:** The LLM default instance (`llm_default` in [metrics.py](file:///c:/SaasProject/insightagent/backend/app/api/v1/endpoints/analytics/metrics.py)) evaluated to `None` if the specific environment key `GROQ_API_KEY_DEFAULT` was absent. This triggered a silent validation gate return of `TopProductsResponse(products=[])` without querying the vector database.
* **The Resolution:** The environment configuration was normalized. The API key binding checks were aligned with the chatbot's fallback behaviors. The backend now guarantees a valid inference client is instantiated by mapping `GROQ_API_KEY_DEFAULT` directly to the system's global keys.

### 3. Handling Raw AI Response & Cleaning JSON Data
* **The Problem:** In JSON mode, standard LLM completions occasionally output markdown envelopes (e.g. ` ```json ... ``` `) or conversational prefixes that break standard `json.loads` calls, causing parsing failures.
* **The Resolution:** Integrated a greedy regex extraction block (`re.search(r'(\{.*\}|\[.*\])', raw_content, re.DOTALL)`) in the backend parse pipeline to strip conversational noise and isolate raw JSON structures, followed by programmatic conversions of written percentages to numeric values.

---

## 💻 Local Project Setup Guide

### 1. Configure the Environment Files

Create a `.env` file in the `backend/` directory:

```env
# Server Configurations
PROJECT_NAME="InsightAgent Enterprise"
BACKEND_CORS_ORIGINS=

# Database Configurations
DATABASE_URL=
VECTOR_DB_URL=
QDRANT_API_KEY=""

# Inference Engine Configurations
GROQ_MODEL=
GROQ_API_KEY=
GROQ_API_KEY_DEFAULT=
GROQ_API_KEY_COMPETITOR=""
GROQ_API_KEY_EMAIL=""
GROQ_API_KEY_RISK=""
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=
```

### 2. Spin Up Services

Run a local Qdrant container:
```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage:z \
  qdrant/qdrant
```

### 3. Install & Start Backend

Navigate to `backend/`, create a virtual environment, and run migrations:
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Install & Start Frontend

Navigate to `frontend/` and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
Open your browser to `http://localhost:5173` to access the dashboard.
