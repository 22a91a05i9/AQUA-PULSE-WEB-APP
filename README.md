# Aqua Pulse — Aquaculture Monitoring Platform

Aqua Pulse is a role-based monitoring and operations platform built for aquaculture (pond/farm) operators. It provides real-time monitoring, device management, alerts and emergency flows, analytics, and scheduled reports. The project includes a React + TypeScript frontend and a FastAPI + SQLAlchemy backend, and is designed to run locally (SQLite) or in production using PostgreSQL, MQTT brokers, and container orchestration.

---

## Key features
- Role-based web UI for Agents, Managers and Owners (separate workspaces)
- Device and site management (register devices, assign to sites)
- Live monitoring / streaming of sensor readings
- Alerting and emergency workflows (SMS, push notifications, calls)
- Scheduled and on-demand report generation
- Analytics / charts built into the dashboard
- Optional MQTT-based ingestion for device data

---

## Repo layout (top-level)
- Frontend/ — Vite + React + TypeScript UI (pages, components, assets)
- backend/
  - app/ — FastAPI application code: routers, models, services, MQTT listener
  - requirements.txt — Python dependencies
  - dockerfile — backend image build
- aqua_iot.db — default local SQLite DB (used for quick local testing)
- README.md — this file

Important files:
- `backend/app/main.py` — FastAPI app factory and lifecycle (startup tasks, scheduler)
- `backend/app/core/config.py` — environment-based settings (list of supported env vars)
- `backend/app/mqtt_consumer.py` — MQTT listener (optional)
- `backend/app/seed_data.py` & `backend/app/bootstrap_db.py` — DB seeding and bootstrap helpers
- `Frontend/src/App.tsx` — client entry and role routing
- `Frontend/package.json` — frontend dependencies and scripts

---

## Getting started — development (short path)

Prerequisites:
- Node 20+, npm (for frontend)
- Python 3.12+, virtualenv
- (Optional) Docker for container-based runs

Steps:

1. Clone
```bash
git clone https://github.com/22a91a05i9/AQUA-PULSE-WEB-APP.git
cd AQUA-PULSE-WEB-APP
```

2. Run backend (local SQLite dev)
```bash
# create and activate virtualenv
python -m venv .venv
source .venv/bin/activate

cd backend
pip install -r requirements.txt

# (Optional) bootstrap the database and seed defaults:
python app/bootstrap_db.py

# run the API:
uvicorn app.main:app --host 0.0.0.0 --port 8000
# health: http://localhost:8000/health
```

3. Run frontend
```bash
cd Frontend
npm ci
cp .env.example .env          # adjust VITE_API_BASE_URL if needed
npm run dev
# open http://localhost:5173
```

---

## Environment variables (important)
Most runtime configuration is in `backend/app/core/config.py`. The backend reads settings from an `.env` file (or environment). Key variables you will likely need to set:

- APP_ENV — `development` or `production`
- DATABASE_URL — default `sqlite:///./aqua_iot.db` (switch to Postgres for production; e.g. `postgresql://user:pass@host:5432/dbname`)
- SECRET_KEY — JWT and session secret (change for production)
- ACCESS_TOKEN_EXPIRE_MINUTES — auth expiry
- DEFAULT_MANAGER_EMAIL / DEFAULT_MANAGER_PASSWORD — seeded manager user
- MQTT_ENABLED — `true`/`false` to enable MQTT ingestion
- MQTT_BROKER / MQTT_PORT / MQTT_TOPIC — broker details when MQTT_ENABLED=true
- FRONTEND_BASE_URL — base URL used in push/emergency links
- ONESIGNAL_APP_ID / ONESIGNAL_REST_API_KEY — for push notifications
- TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_PHONE — for SMS/calls
- EMERGENCY_PUSH_ENABLED / EMERGENCY_SMS_ENABLED / EMERGENCY_CALL_ENABLED — enable/disable notification channels
- CORS_ORIGINS / TRUSTED_HOSTS — networking/hosts/CORS

Example minimal `.env` for local dev:
```env
APP_ENV=development
DATABASE_URL=sqlite:///./aqua_iot.db
SECRET_KEY=change-me-local
MQTT_ENABLED=False
FRONTEND_BASE_URL=http://localhost:5173
CORS_ORIGINS=*
TRUSTED_HOSTS=*
```

---

## Database & schema notes
- Default development database: SQLite file `aqua_iot.db` at repository root.
- On startup `backend/app/main.py` runs checks and will call schema patches and seed logic when the schema is present. There is also a `bootstrap_db.py` script to create initial tables and seed default manager/user data — check that file for explicit usage.
- For production use PostgreSQL (set DATABASE_URL). Ensure `SECRET_KEY` and default credentials are changed for production (the config enforces this for `APP_ENV=production`).

---

## MQTT & live ingestion
An MQTT consumer is included (`backend/app/mqtt_consumer.py`). To enable:
- Set `MQTT_ENABLED=true` in the backend environment and configure `MQTT_BROKER`, `MQTT_PORT`, and `MQTT_TOPIC`.
- The FastAPI app will start the MQTT listener on startup. The MQTT topic default is `aqua/+/+/readings` (configurable).

---

## API overview
All API routers are mounted under the `/api` prefix in `backend/app/main.py`. Major router modules:
- `auth` — authentication/session management
- `agent`, `manager`, `owner` — role-specific endpoints and management
- `readings` — ingesting and querying sensor readings
- `analytics` — analytics endpoints used by charts and dashboards
- `reports` — scheduling and generating reports
- `emergencies`, `push`, `user_settings` — emergency flows, push notifications and per-user settings
Check the router modules under `backend/app/routers` for the full list of endpoints and request/response shapes.

---

## Docker / deployment
Two Dockerfiles exist:
- `backend/dockerfile` — builds the backend (Python 3.12-slim + uvicorn)
- `Frontend/dockerfile` — multi-stage build for the frontend and Nginx static hosting

Basic container build + run:
```bash
# backend
cd backend
docker build -t aquapulse-backend .
docker run -p 8000:8000 --env-file .env aquapulse-backend

# frontend
cd Frontend
docker build -t aquapulse-frontend .
docker run -p 5173:5173 aquapulse-frontend
```

For production, prefer:
- PostgreSQL or managed DB (DATABASE_URL)
- Proper secrets management (do not store SECRET_KEY in plaintext)
- External object storage or artifact hosting for report exports
- A reverse proxy (nginx / ingress) and TLS termination
- Kubernetes or other orchestrator for scaling background schedulers and MQTT consumers

---

## Development tips & troubleshooting
- If you get "Database schema is not ready" on startup: run `python backend/app/bootstrap_db.py` or inspect `backend/app/schema_patches.py` and `seed_data.py` to apply and seed schema.
- Logs: run uvicorn with `--reload` in dev, and check server logs for scheduled report generation and MQTT listener startup messages.
- If enabling push/notifications, verify `FRONTEND_BASE_URL` and Onesignal/Twilio keys are correct.
- Frontend: Vite hot-reloads. Update `VITE_API_BASE_URL` when running frontend against a remote backend.

---

## Contributing
- Open an issue for design/feature requests or bugs.
- Keep PRs small and focused: fix one issue or add one feature per PR.
- Add tests for backend features where appropriate; include type checks and linting in frontend changes.

---

## Contact & license
- This repository currently does not include an explicit license file — add `LICENSE` to declare terms before publishing.
- For questions about implementation details, check the router modules in `backend/app/routers/` and the UI pages in `Frontend/src/Agent-Page`, `Frontend/src/Manager-Page`, and `Frontend/src/Owner-Page`.
