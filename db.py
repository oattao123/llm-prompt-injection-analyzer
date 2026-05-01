"""
SQLite logging for analyzer.
DB เก็บประวัติทุก analysis เพื่อทำ stats / dashboard
"""
from __future__ import annotations

import hashlib
import os
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

DB_PATH = Path(os.environ.get("ANALYZER_DB", "analyzer.db"))
_lock = threading.Lock()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    with _lock:
        conn = _connect()
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()


def init_db() -> None:
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prompt_hash TEXT NOT NULL,
                prompt_preview TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                detection_count INTEGER NOT NULL,
                layers_triggered TEXT NOT NULL,
                top_pattern TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at);
            CREATE INDEX IF NOT EXISTS idx_analyses_risk ON analyses(risk_level);

            CREATE TABLE IF NOT EXISTS pattern_hits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id INTEGER NOT NULL,
                pattern_name TEXT NOT NULL,
                layer TEXT NOT NULL,
                category TEXT NOT NULL,
                severity INTEGER NOT NULL,
                FOREIGN KEY (analysis_id) REFERENCES analyses(id)
            );
            CREATE INDEX IF NOT EXISTS idx_pattern_hits_name ON pattern_hits(pattern_name);
            """
        )


def log_analysis(prompt: str, result: dict) -> None:
    """บันทึกผลทุกครั้งที่มีการเรียก /analyze"""
    prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()[:16]
    preview = (prompt[:80] + "…") if len(prompt) > 80 else prompt
    detections = result.get("detections", [])
    layers = sorted({d["layer"] for d in detections})
    top = max(detections, key=lambda d: d["severity"])["name"] if detections else None

    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO analyses
               (prompt_hash, prompt_preview, risk_score, risk_level,
                detection_count, layers_triggered, top_pattern)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                prompt_hash,
                preview,
                result["risk_score"],
                result["risk_level"],
                len(detections),
                ",".join(layers),
                top,
            ),
        )
        analysis_id = cur.lastrowid
        for d in detections:
            conn.execute(
                """INSERT INTO pattern_hits
                   (analysis_id, pattern_name, layer, category, severity)
                   VALUES (?, ?, ?, ?, ?)""",
                (analysis_id, d["name"], d["layer"], d["category"], d["severity"]),
            )


def get_stats() -> dict:
    """รวม stats สำหรับหน้า dashboard"""
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) AS c FROM analyses").fetchone()["c"]

        risk_rows = conn.execute(
            "SELECT risk_level, COUNT(*) AS c FROM analyses GROUP BY risk_level"
        ).fetchall()
        risk_distribution = {r["risk_level"]: r["c"] for r in risk_rows}

        top_rows = conn.execute(
            """SELECT pattern_name, layer, COUNT(*) AS c
               FROM pattern_hits
               GROUP BY pattern_name
               ORDER BY c DESC
               LIMIT 10"""
        ).fetchall()
        top_patterns = [
            {"name": r["pattern_name"], "layer": r["layer"], "count": r["c"]}
            for r in top_rows
        ]

        recent = conn.execute(
            """SELECT prompt_preview, risk_level, risk_score,
                      detection_count, top_pattern, created_at
               FROM analyses
               ORDER BY id DESC
               LIMIT 15"""
        ).fetchall()
        recent_analyses = [dict(r) for r in recent]

        # 24 ชม. ล่าสุด ราย hour
        since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        hourly_rows = conn.execute(
            """SELECT strftime('%Y-%m-%d %H:00', created_at) AS hour,
                      SUM(CASE WHEN risk_score > 0 THEN 1 ELSE 0 END) AS attacks,
                      COUNT(*) AS total
               FROM analyses
               WHERE created_at >= ?
               GROUP BY hour
               ORDER BY hour""",
            (since,),
        ).fetchall()
        hourly = [dict(r) for r in hourly_rows]

        avg_score_row = conn.execute(
            "SELECT AVG(risk_score) AS avg FROM analyses"
        ).fetchone()
        avg_score = round(avg_score_row["avg"], 1) if avg_score_row["avg"] else 0.0

    return {
        "total_analyses": total,
        "average_risk_score": avg_score,
        "risk_distribution": risk_distribution,
        "top_patterns": top_patterns,
        "recent_analyses": recent_analyses,
        "hourly_attacks_24h": hourly,
    }
