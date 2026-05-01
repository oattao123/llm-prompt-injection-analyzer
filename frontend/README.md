# LLM Analyzer — Frontend (Next.js 15)

Next.js App Router + TypeScript + Tailwind v4 — เรียก FastAPI backend ผ่าน `NEXT_PUBLIC_API_URL`

## Local Dev
```bash
cp .env.example .env.local       # แก้ URL ถ้า backend อยู่ที่อื่น
npm install
npm run dev                       # http://localhost:3000
```

(ต้องมี FastAPI รันอยู่ที่ `http://127.0.0.1:8000` ก่อน — ดู README ที่ root)

## Deploy on Vercel
1. Import repo บน Vercel แล้วตั้ง **Root Directory** เป็น `frontend`
2. ตั้ง Environment Variable: `NEXT_PUBLIC_API_URL=https://<your-render-app>.onrender.com`
3. Vercel จะ auto-deploy ทุก push ไป `main`

## Project Layout
```
frontend/
├── app/
│   ├── layout.tsx       # Root layout, fonts, metadata
│   ├── page.tsx         # Server Component — header / hero / footer
│   └── globals.css      # Tailwind v4 + custom utilities
├── components/
│   └── analyzer.tsx     # Client Component — form + result UI
└── lib/
    ├── api.ts           # fetch wrapper to FastAPI
    └── types.ts         # AnalyzeResponse / Detection types
```
