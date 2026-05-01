# 🛡️ LLM Prompt Injection & Jailbreak Analyzer — v1.2.0

**Hybrid AI Defense System** for OWASP **LLM01: Prompt Injection**
4-layer detection · TH+EN · LLM-as-Judge · Live Dashboard · F1 = 1.00 on benchmark

```
┌────────────────────────────┐  POST /analyze   ┌──────────────────────────────────┐
│  Next.js 15 (Vercel)       │ ───────────────► │  FastAPI + uv (Render)           │
│  · Analyzer page           │                  │  L1 Heuristic (EN+TH 16 rules)   │
│  · Dashboard (live stats)  │   GET /stats     │  L2 Encoding (b64/leet/zwidth)   │
└────────────────────────────┘ ◄─────────────── │  L3 Lexical anomaly              │
                                                │  L4 LLM-as-Judge (Gemini opt.)   │
                                                │  + SQLite logging + RateLimit    │
                                                └──────────────────────────────────┘
```

## What's Inside

### Backend (`main.py` · `db.py` · `llm_judge.py`)
| Layer | Detects | Inspired by |
|-------|---------|-------------|
| **1. Heuristic** | 16 rules — 10 EN + 6 TH (System Override, DAN, Prompt Leak, Malware, PII, …) | Garak / Rebuff |
| **2. Encoding** | Base64, Leetspeak, Zero-width / Bidi override | Vigil |
| **3. Lexical** | Length anomaly, Repetition attack | Vigil |
| **4. LLM-as-Judge** | Gemini 2.0 Flash semantic classifier (silent skip if no API key) | Rebuff |

Plus:
- **Rate limiting** via slowapi (`60/minute` default, env-configurable)
- **SQLite logging** of every analysis → powers `/stats` endpoint
- **Graceful degradation**: each layer is independent; LLM-judge failure ≠ request failure

### Frontend (`frontend/` · Next.js 15 + TS + Tailwind v4)
- `/` — Analyzer page with severity gauge, per-detection breakdown, example payloads (TH+EN)
- `/dashboard` — Live KPIs, risk distribution, top patterns, 24h activity chart, recent analyses (auto-refresh 5s)

### Benchmark (`benchmark/`)
- `dataset.json` — 45 labeled samples (35 attack / 10 safe, EN+TH, all 4 layers)
- `run.py` — runs all samples, computes Precision/Recall/F1, fails CI if F1 < 0.85
- Current performance: **Accuracy 1.00 · Precision 1.00 · Recall 1.00 · F1 1.00**
- CI uploads `report.json` as an artifact every push

## Repository
```
p-devop/
├── main.py                  # FastAPI app (4 layers + routes)
├── db.py                    # SQLite logging + stats aggregation
├── llm_judge.py             # Gemini API client (Layer 4)
├── test_main.py             # 23 pytest cases
├── benchmark/
│   ├── dataset.json         # 45 labeled prompts
│   └── run.py               # F1 benchmark runner
├── pyproject.toml           # uv project (incl. slowapi, httpx)
├── uv.lock
├── .github/workflows/main.yml   # CI: test → benchmark → deploy
└── frontend/                # Next.js 15 (Vercel)
    ├── app/
    │   ├── page.tsx              # Analyzer
    │   └── dashboard/page.tsx    # Live dashboard
    ├── components/
    │   ├── analyzer.tsx
    │   ├── dashboard.tsx
    │   └── nav.tsx
    └── lib/
        ├── api.ts                # fetch wrappers
        └── types.ts
```

## Run Locally

**Backend** (terminal 1):
```bash
uv sync --all-groups
uv run uvicorn main:app --reload      # http://127.0.0.1:8000/docs
```
Optional — enable Layer 4 (LLM-as-Judge):
```bash
export GEMINI_API_KEY="your-key-from-aistudio.google.com"
```

**Frontend** (terminal 2):
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                            # http://localhost:3000
```

**Tests + benchmark:**
```bash
uv run pytest test_main.py -v
uv run python benchmark/run.py
```

## Deploy

### Backend → Render.com
- **Build:** `pip install uv && uv sync --no-dev --frozen`
- **Start:** `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars (optional): `GEMINI_API_KEY`, `RATE_LIMIT=60/minute`
- ปิด Auto-Deploy แล้วเก็บ Deploy Hook URL ใน GitHub Secrets ชื่อ `RENDER_DEPLOY_HOOK_URL`

### Frontend → Vercel
- Import repo → set **Root Directory** = `frontend`
- Env: `NEXT_PUBLIC_API_URL=https://<your-render-app>.onrender.com`
- Vercel auto-deploy ทุก push ไป `main`

## CI/CD Pipeline (`.github/workflows/main.yml`)
3 jobs ทำงานต่อกัน:
```
build-and-test  →  benchmark (F1 ≥ 0.85)  →  deploy (Render hook)
```
ถ้า test fail หรือ benchmark F1 ตก threshold → ไม่ deploy

## What's New in v1.2.0
- ⭐ **Layer 4: LLM-as-Judge** — Gemini API ทำหน้าที่เป็น semantic classifier
- ⭐ **6 Thai-language patterns** — ลืมคำสั่ง / สวมบทบาท / ขอ system prompt / ข้ามตัวกรอง / ห้ามปฏิเสธ / ขอ credential
- ⭐ **Live Dashboard** — KPIs, risk distribution, top patterns, 24h activity, recent analyses
- ⭐ **Adversarial Benchmark** — measurable F1 score in CI artifacts
- ⭐ **Rate limiting** + **SQLite logging** + **lifespan event handlers**

## Related Works
- [Rebuff](https://github.com/protectai/rebuff) — multi-layered prompt injection defense
- [Lakera Gandalf](https://gandalf.lakera.ai) — gamified prompt injection challenge
- [Garak](https://github.com/leondz/garak) — LLM red-teaming scanner / payload taxonomy
- [Vigil](https://github.com/deadbits/vigil-llm) — YARA-based LLM guardrails
