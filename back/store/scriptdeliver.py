import os
import random
from datetime import datetime, timedelta
from faker import Faker
import pandas as pd

NUM_DELIVERIES = 350
NUM_ROUTES = 5  # define number of routes

OUT_DIR = "outputsched_csv"
os.makedirs(OUT_DIR, exist_ok=True)

def write_csv(name: str, rows: list[dict]):
    """Write a list of dictionaries to a CSV file."""
    df = pd.DataFrame(rows)
    df.to_csv(os.path.join(OUT_DIR, f"{name}.csv"), index=False)

fake = Faker()
random.seed(42)
Faker.seed(42)

# -----------------------------------------------------------------
# Read existing Schedules.csv
schedules_path = os.path.join(OUT_DIR, "Schedules.csv")
if not os.path.exists(schedules_path):
    raise FileNotFoundError("Schedules.csv not found in outputsched_csv directory.")

schedules_df = pd.read_csv(schedules_path)
schedules = schedules_df.to_dict(orient="records")

# -----------------------------------------------------
# DELIVERY RECORDS generation (ensuring trigger compatibility)
deliveries = []
for i in range(NUM_DELIVERIES):
    order_id = i + 1

    # Pick a random schedule so that the delivery is valid
    sched = random.choice(schedules)
    courier_id = sched["courier_id"]
    work_date = sched["work_date"]

    # Parse shift start and end times from the schedule:
    shift_start = datetime.strptime(sched["shift_start"], "%Y-%m-%d %H:%M:%S")
    shift_end = datetime.strptime(sched["shift_end"], "%Y-%m-%d %H:%M:%S")
    # Generate a random delivery time within the courier's shift:
    delta_seconds = int((shift_end - shift_start).total_seconds())
    random_seconds = random.randint(0, delta_seconds)
    deliv_time = shift_start + timedelta(seconds=random_seconds)

    route_id = random.randint(1, NUM_ROUTES)
    
    deliveries.append({
        "delivery_id": order_id,
        "order_id": order_id,
        "courier_id": courier_id,
        "route_id": route_id,
        "delivery_date": work_date,  # Must match a schedule's work_date
        "delivery_time": deliv_time.strftime("%Y-%m-%d %H:%M:%S")
    })

# Write the generated deliveries under the filename "deliveriers.csv"
write_csv("deliveriers", deliveries)