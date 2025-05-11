# 18. ─── SCHEDULES  (patched) ──────────────────────────────────────────────
# put this block in place of the old one
# helper formatters ----
import os
import csv
import random

from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from faker import Faker
import pandas as pd   # only for the convenient CSV writer
NUM_SCHEDULES = 89
NUM_COURIERS = 90
OUT_DIR = "outputsched_csv"
os.makedirs(OUT_DIR, exist_ok=True)
def write_csv(name:str, rows:list[dict]):
    """Write a list[dict] to name.csv using the dict keys as header"""
    df = pd.DataFrame(rows)
    df.to_csv(os.path.join(OUT_DIR, f"{name}.csv"), index=False)
fake = Faker()

random.seed(42)
Faker.seed(42)
base_date = datetime.now() - timedelta(days=365)
# -----------------------------------------------------
# 18. ─── SCHEDULES  (final, ISO-safe) ───────────────────────────────────────
def fmt_ts(dt):
    """YYYY-MM-DD HH24:MI:SS — Oracle parses this automatically"""
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def fmt_d(d):
    """YYYY-MM-DD (date only)"""
    return d.strftime("%Y-%m-%d")

schedules = []
for i in range(NUM_SCHEDULES):
    courier_id  = random.randint(1, NUM_COURIERS)
    work_date   = base_date + timedelta(days=random.randint(0, 364))

    shift_start = datetime.combine(work_date.date(),
                                   datetime.min.time()) + timedelta(
                                   hours=random.choice([6, 14, 22]))
    shift_end   = shift_start + timedelta(hours=8)

    schedules.append({
        "courier_id" : courier_id,
        "shift_start": fmt_ts(shift_start),   # e.g. 2025-08-02 06:00:00
        "shift_end"  : fmt_ts(shift_end),     # e.g. 2025-08-02 14:00:00
        "work_date"  : fmt_d(work_date)       # e.g. 2025-08-02
    })

write_csv("Schedules", schedules)

