import sqlite3
import hashlib
import time
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

logger = logging.getLogger("ai_digital_twin.analytics")
DB_PATH = Path(__file__).parent / "recruiter_queries.db"

def _get_conn() -> sqlite3.Connection:
    """Initialize SQLite tables with strict schema and privacy indexes."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL NOT NULL,
            ip_hash TEXT NOT NULL,
            question TEXT NOT NULL,
            model_used TEXT,
            response_time_ms REAL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            consent_given INTEGER NOT NULL DEFAULT 0,
            ip_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    return conn

def hash_ip(ip: str) -> str:
    """SHA-256 salted hash of IP address for UAE PDPL and Pakistan PECA privacy compliance."""
    salt = "anees_portfolio_privacy_salt_2026"
    return hashlib.sha256(f"{salt}:{ip}".encode("utf-8")).hexdigest()[:16]

def log_query(ip: str, question: str, model_used: str = "llama-3.3-70b-versatile", response_time_ms: float = 0.0):
    """Log anonymized user chat question for recruiter analytics."""
    try:
        conn = _get_conn()
        conn.execute(
            "INSERT INTO queries (timestamp, ip_hash, question, model_used, response_time_ms) VALUES (?, ?, ?, ?, ?)",
            (time.time(), hash_ip(ip), question[:500], model_used, round(response_time_ms, 2))
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to log query telemetry: {e}")

def log_contact(name: str, email: str, message: str, consent: bool, ip: str = "127.0.0.1"):
    """Store direct recruiter contact form submission with UAE PDPL explicit consent flag."""
    try:
        conn = _get_conn()
        conn.execute(
            "INSERT INTO contacts (name, email, message, consent_given, ip_hash) VALUES (?, ?, ?, ?, ?)",
            (name[:100], email[:200], message[:2000], 1 if consent else 0, hash_ip(ip))
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to store contact submission: {e}")

def purge_old_records(days: int = 90):
    """Auto-purge analytics records older than retention period (PDPL / GDPR Compliance)."""
    try:
        conn = _get_conn()
        cutoff = time.time() - (days * 86400)
        cursor = conn.execute("DELETE FROM queries WHERE timestamp < ?", (cutoff,))
        purged = cursor.rowcount
        conn.commit()
        conn.close()
        logger.info(f"Purged {purged} telemetry records older than {days} days.")
    except Exception as e:
        logger.error(f"Failed to purge old analytics records: {e}")

def get_recent_analytics(limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve recent queries for private telemetry review."""
    try:
        conn = _get_conn()
        cursor = conn.execute(
            "SELECT id, question, model_used, response_time_ms, created_at FROM queries ORDER BY id DESC LIMIT ?",
            (limit,)
        )
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return rows
    except Exception as e:
        logger.error(f"Failed to fetch analytics: {e}")
        return []
