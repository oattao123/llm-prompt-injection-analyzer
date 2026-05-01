"""
Adversarial benchmark runner.
รันชุด prompts จาก dataset.json เทียบกับ ground-truth label
รายงาน confusion matrix + precision / recall / F1
ใช้ exit code 1 เมื่อ F1 < threshold เพื่อ fail CI
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# import จาก root project
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# ปิด LLM judge ระหว่าง benchmark เพื่อความ deterministic
os.environ.pop("GEMINI_API_KEY", None)
os.environ["ANALYZER_DB"] = ":memory:"

import main  # noqa: E402

DATASET = ROOT / "benchmark" / "dataset.json"
THRESHOLD = float(os.environ.get("BENCHMARK_F1_MIN", "0.85"))


def main_run() -> int:
    data = json.loads(DATASET.read_text(encoding="utf-8"))
    samples = data["samples"]

    tp = fp = tn = fn = 0
    misclassified: list[dict] = []

    for sample in samples:
        prompt = sample["prompt"]
        truth = sample["label"]
        result = main.analyze(prompt, use_llm_judge=False)
        predicted = "malicious" if result.is_malicious else "safe"

        if truth == "malicious" and predicted == "malicious":
            tp += 1
        elif truth == "safe" and predicted == "safe":
            tn += 1
        elif truth == "safe" and predicted == "malicious":
            fp += 1
            misclassified.append({"type": "FP", "prompt": prompt, "score": result.risk_score})
        else:
            fn += 1
            misclassified.append({"type": "FN", "prompt": prompt, "score": result.risk_score})

    total = tp + fp + tn + fn
    accuracy = (tp + tn) / total
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0

    print("=" * 60)
    print(f"Adversarial Benchmark — {total} samples")
    print("=" * 60)
    print(f"  True Positive  (TP) = {tp}")
    print(f"  False Positive (FP) = {fp}")
    print(f"  True Negative  (TN) = {tn}")
    print(f"  False Negative (FN) = {fn}")
    print("-" * 60)
    print(f"  Accuracy  = {accuracy:.3f}")
    print(f"  Precision = {precision:.3f}")
    print(f"  Recall    = {recall:.3f}")
    print(f"  F1 Score  = {f1:.3f}")
    print(f"  Threshold = {THRESHOLD:.3f}")
    print("=" * 60)

    if misclassified:
        print("\nMisclassified samples:")
        for m in misclassified[:10]:
            preview = m["prompt"][:60].replace("\n", " ")
            print(f"  [{m['type']}] score={m['score']:>3} | {preview}")

    summary = {
        "total": total,
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "threshold": THRESHOLD,
        "passed": f1 >= THRESHOLD,
    }
    (ROOT / "benchmark" / "report.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    if f1 < THRESHOLD:
        print(f"\n❌ FAIL — F1 {f1:.3f} < threshold {THRESHOLD:.3f}")
        return 1
    print(f"\n✅ PASS — F1 {f1:.3f} ≥ {THRESHOLD:.3f}")
    return 0


if __name__ == "__main__":
    sys.exit(main_run())
