#!/usr/bin/env python
"""
Generate random CSV data for the logistics schema.
Author: ChatGPT (o3)
"""

import os
import csv
import random
from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

from faker import Faker
import pandas as pd   # only for the convenient CSV writer

fake = Faker()
random.seed(42)
Faker.seed(42)

# ---------------------------------------------------------------------------
# 1.  ─── CONFIGURE HOW MANY ROWS YOU WANT ───────────────────────────────────
# ---------------------------------------------------------------------------
NUM_CITIES              = 100
NUM_CUSTOMERS           = 500
NUM_SHIPPERS            = 20
NUM_PACKAGES            = 200
NUM_ORDERS              = 400
NUM_VEHICLES            = 80
NUM_COURIERS            = 100
NUM_ROUTES              = 150
NUM_DELIVERIES          = 350          # should be ≤ NUM_ORDERS
NUM_WAREHOUSES          = 15
NUM_EMPLOYEES           = 200
NUM_SCHEDULES           = 400
AVG_TRACKING_PER_DEL    = 3            # statuses / delivery
NUM_FEEDBACK            = 300
NUM_INCIDENTS           = 30

# ---------------------------------------------------------------------------
OUT_DIR = "output_csv"
os.makedirs(OUT_DIR, exist_ok=True)

def write_csv(name:str, rows:list[dict]):
    """Write a list[dict] to name.csv using the dict keys as header"""
    df = pd.DataFrame(rows)
    df.to_csv(os.path.join(OUT_DIR, f"{name}.csv"), index=False)

# Helper to produce Oracle-safe decimals
def money(val):
    return Decimal(val).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

# ---------------------------------------------------------------------------
# 2.  ─── CITIES ─────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
cities = [{"city_id": i+1, "city_name": fake.city()} for i in range(NUM_CITIES)]
write_csv("Cities", cities)

# ---------------------------------------------------------------------------
# 3.  ─── CUSTOMERS ──────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
customers = []
for i in range(NUM_CUSTOMERS):
    customers.append({
        "customer_id": i+1,
        "name": fake.name(),
        "email": fake.unique.email(),
        "phone": fake.phone_number()[:15],
        "city_id": random.randint(1, NUM_CITIES)
    })
write_csv("Customers", customers)

# ---------------------------------------------------------------------------
# 4.  ─── SHIPPERS ───────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
shippers = [{
    "shipper_id": i+1,
    "company_name": fake.company(),
    "contact_number": fake.phone_number()[:15]
} for i in range(NUM_SHIPPERS)]
write_csv("Shippers", shippers)

# ---------------------------------------------------------------------------
# 5.  ─── PACKAGES ───────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
packages = []
for i in range(NUM_PACKAGES):
    l,w,h = [random.randint(5,80) for _ in range(3)]
    packages.append({
        "package_id": i+1,
        "weight": float(money(random.uniform(0.1, 50))),
        "dimensions": f"{l}x{w}x{h} cm",
        "content_description": fake.sentence(nb_words=6)
    })
write_csv("Packages", packages)

# ---------------------------------------------------------------------------
# 6.  ─── ORDERS ─────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
order_rows = []
base_date = datetime.now() - timedelta(days=365)
for i in range(NUM_ORDERS):
    od = base_date + timedelta(days=random.randint(0, 364))
    order_rows.append({
        "order_id"   : i+1,
        "customer_id": random.randint(1, NUM_CUSTOMERS),
        "shipper_id" : random.randint(1, NUM_SHIPPERS),
        "package_id" : random.randint(1, NUM_PACKAGES),
        "order_date" : od.date().isoformat()
    })
write_csv("Orders", order_rows)

# ---------------------------------------------------------------------------
# 7.  ─── VEHICLES ───────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
vehicle_types = ["Van","Truck","Bike","Car"]
statuses = ["Available","In Service","Maintenance"]
vehicles = [{
    "vehicle_id"   : i+1,
    "vehicle_type" : random.choice(vehicle_types),
    "license_plate": fake.unique.license_plate()[:20],
    "status"       : random.choice(statuses)
} for i in range(NUM_VEHICLES)]
write_csv("Vehicles", vehicles)

# ---------------------------------------------------------------------------
# 8.  ─── COURIERS ───────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
couriers = [{
    "courier_id": i+1,
    "name": fake.name(),
    "phone": fake.phone_number()[:15],
    "vehicle_id": random.randint(1, NUM_VEHICLES)
} for i in range(NUM_COURIERS)]
write_csv("Couriers", couriers)

# ---------------------------------------------------------------------------
# 9.  ─── ROUTES ─────────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
routes = []
for i in range(NUM_ROUTES):
    o, d = random.sample(range(1, NUM_CITIES+1), 2)
    routes.append({
        "route_id": i+1,
        "origin_city_id": o,
        "destination_city_id": d,
        "distance_km": float(money(random.uniform(10, 2000)))
    })
write_csv("Routes", routes)

# ---------------------------------------------------------------------------
# 10. ─── DELIVERIES ─────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
deliveries = []
for i in range(NUM_DELIVERIES):
    order_id = i+1                                  
    courier_id = random.randint(1, NUM_COURIERS)
    route_id = random.randint(1, NUM_ROUTES)
    order_date = datetime.fromisoformat(
        order_rows[order_id-1]["order_date"])
    deliv_date = order_date + timedelta(days=random.randint(1,15))
    deliveries.append({
        "delivery_id" : i+1,
        "order_id"    : order_id,
        "courier_id"  : courier_id,
        "route_id"    : route_id,
        "delivery_date": deliv_date.date().isoformat(),
        "delivery_time": (deliv_date + timedelta(
            hours=random.randint(8,18),
            minutes=random.randint(0,59))).strftime("%Y-%m-%d %H:%M:%S")
    })
write_csv("Deliveries", deliveries)

# ---------------------------------------------------------------------------
# 11. ─── TRACKING STATUS ────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
status_steps = ["Processing","Dispatched","In Transit","Out for Delivery","Delivered"]
tracking = []
tid = 1
for d in deliveries:
    curr_time = datetime.fromisoformat(d["delivery_time"])
    for _ in range(random.randint(2, AVG_TRACKING_PER_DEL+2)):
        tracking.append({
            "status_id"  : tid,
            "delivery_id": d["delivery_id"],
            "status"     : random.choice(status_steps),
            "updated_at" : (curr_time - timedelta(
                            hours=random.randint(1,48))
                           ).strftime("%Y-%m-%d %H:%M:%S")
        })
        tid += 1
write_csv("Tracking_Status", tracking)

# ---------------------------------------------------------------------------
# 12. ─── WAREHOUSES ─────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
warehouses = [{
    "warehouse_id": i+1,
    "city_id": random.randint(1, NUM_CITIES),
    "address": fake.address().replace("\n", ", ")
} for i in range(NUM_WAREHOUSES)]
write_csv("Warehouses", warehouses)

# ---------------------------------------------------------------------------
# 13. ─── WAREHOUSE INVENTORY ───────────────────────────────────────────────
# ---------------------------------------------------------------------------
warehouse_inv = []
for wh in warehouses:
    for _ in range(random.randint(20,60)):
        warehouse_inv.append({
            "warehouse_id": wh["warehouse_id"],
            "package_id": random.randint(1, NUM_PACKAGES),
            "quantity": random.randint(1,50)
        })
write_csv("Warehouse_Inventory", warehouse_inv)

# ---------------------------------------------------------------------------
# 14. ─── FEEDBACK ───────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
feedback = [{
    "feedback_id": i+1,
    "order_id": random.randint(1, NUM_ORDERS),
    "rating": random.randint(1,5),
    "COMMENT": fake.sentence(),
    "feedback_date": (base_date + timedelta(days=random.randint(0,364))).date().isoformat()
} for i in range(NUM_FEEDBACK)]
write_csv("Feedback", feedback)

# ---------------------------------------------------------------------------
# 15. ─── PAYMENTS ───────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
pay_methods = ["Credit Card","PayPal","Bank Transfer","Cash"]
payments = [{
    "payment_id": i+1,
    "order_id": i+1,
    "payment_method": random.choice(pay_methods),
    "amount": float(money(random.uniform(20, 1000))),
    "payment_date": (datetime.fromisoformat(
        order_rows[i]["order_date"])
        + timedelta(days=random.randint(0,3))
    ).date().isoformat()
} for i in range(NUM_ORDERS)]
write_csv("Payments", payments)

# ---------------------------------------------------------------------------
# 16. ─── INCIDENTS ──────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
incidents = [{
    "incident_id": i+1,  # Assuming auto-increment or sequence in DB
    "delivery_id": random.randint(1, NUM_DELIVERIES),
    "description": fake.sentence(),
    "reported_at": (datetime.now() - timedelta(days=random.randint(0,90))
                   ).strftime("%Y-%m-%d %H:%M:%S")  # Matches TIMESTAMP(6)
} for i in range(NUM_INCIDENTS)]
write_csv("Incidents", incidents)

# ---------------------------------------------------------------------------
# 17. ─── EMPLOYEES ──────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
roles = ["Manager","Supervisor","Loader","Clerk","Security"]
employees = [{
    "employee_id": i+1,
    "name": fake.name(),
    "role": random.choice(roles),
    "warehouse_id": random.randint(1, NUM_WAREHOUSES)
} for i in range(NUM_EMPLOYEES)]
write_csv("Employees", employees)

# ---------------------------------------------------------------------------
# 18. ─── SCHEDULES ──────────────────────────────────────────────────────────
# ---------------------------------------------------------------------------
schedules = []
for i in range(NUM_SCHEDULES):
    courier_id = random.randint(1, NUM_COURIERS)
    work_date  = base_date + timedelta(days=random.randint(0,364))
    shift_start = datetime.combine(work_date.date(),
                                   datetime.min.time()) + timedelta(
                                   hours=random.choice([6,14,22]))
    shift_end   = shift_start + timedelta(hours=8)
    schedules.append({
        "schedule_id": i+1,
        "courier_id" : courier_id,
        "shift_start": shift_start.strftime("%Y-%m-%d %H:%M:%S"),
        "shift_end"  : shift_end.strftime("%Y-%m-%d %H:%M:%S"),
        "work_date"  : work_date.date().isoformat()
    })
write_csv("Schedules", schedules)

print(f"✅  CSV generation complete. Files are in {os.path.abspath(OUT_DIR)}")
