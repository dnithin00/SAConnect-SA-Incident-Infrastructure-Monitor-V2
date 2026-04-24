# SA Connect - SA Incident Infrastructure Monitor

Single-repo full-stack project for ingesting, storing, analyzing, and visualizing South Australian CFS incident data.

This repository contains:

- `SaConnectApi` - .NET Web API + background data ingestion + SQLite
- `SaConnectWeb` - React (Vite) frontend with Map, List, and Analytics dashboards

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Backend Setup (`SaConnectApi`)](#backend-setup-saconnectapi)
- [Frontend Setup (`SaConnectWeb`)](#frontend-setup-saconnectweb)
- [API Endpoints](#api-endpoints)
- [Feature Walkthrough](#feature-walkthrough)
- [Data Flow](#data-flow)
- [Git Ignore Strategy (Mono-Repo)](#git-ignore-strategy-mono-repo)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## Overview

SA Connect pulls live incident data from the official SA emergency data source, stores it in a local SQLite database, and exposes it through a REST API consumed by a modern React dashboard.

Core goals:

- Periodic ingestion of live CFS incidents
- Deduplication by incident number
- Clean API endpoints for frontend consumption
- Professional UX with map, filtering, drill-down, and analytics

---

## Architecture

- **Ingestion layer** (`SaConnectApi/Services/IncidentSyncService.cs`)
  - Runs in the background every 10 minutes.
  - Fetches live feed via `HttpClient`.
  - Prevents duplicates using `IncidentNo`.

- **Persistence layer** (`SaConnectApi/Data/AppDbContext.cs`)
  - Entity Framework Core + SQLite.
  - Unique index on `IncidentNo`.

- **API layer** (`SaConnectApi/Controllers/IncidentsController.cs`)
  - Exposes incident data for UI.
  - Supports all incidents + single incident lookup.

- **Presentation layer** (`SaConnectWeb/src/pages`)
  - `MapPage.jsx` for spatial view and rich incident details.
  - `ListViewPage.jsx` for card-based filtering/sorting.
  - `AnalyticsPage.jsx` for status/type charts.

---

## Folder Structure

```text
Office/
├── README.md
├── SaConnectApi/
│   ├── Controllers/
│   ├── Data/
│   ├── Models/
│   ├── Services/
│   ├── Migrations/
│   ├── Program.cs
│   └── SaConnectApi.csproj
└── SaConnectWeb/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Tech Stack

### Backend (`SaConnectApi`)

- .NET (ASP.NET Core Web API)
- Entity Framework Core
- SQLite
- Background service (`IHostedService`/`BackgroundService`)
- Swagger / Swashbuckle

### Frontend (`SaConnectWeb`)

- React + Vite
- Axios
- React Router
- Leaflet + React Leaflet
- Recharts
- Lucide React icons

---

## Prerequisites

Install these before running:

- .NET SDK (matching project target)
- Node.js (LTS recommended)
- npm
- Git

Optional:

- SQLite Browser/Viewer for inspecting `saconnect.db`

---

## Quick Start

Open two terminals from repository root (`Office`):

### Terminal 1 - Backend

```bash
cd "SaConnectApi"
dotnet restore
dotnet ef database update
dotnet run
```

Backend URL example: `http://localhost:5258` (or as printed in terminal)

### Terminal 2 - Frontend

```bash
cd "SaConnectWeb"
npm install
npm run dev
```

Frontend URL example: `http://localhost:5173`

---

## Backend Setup (`SaConnectApi`)

### 1) Install dependencies

```bash
dotnet restore
```

### 2) Apply migrations

```bash
dotnet ef database update
```

If needed, generate migration:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 3) Run API

```bash
dotnet run
```

### 4) Test via Swagger

In Development, open:

- `/swagger`

---

## Frontend Setup (`SaConnectWeb`)

### 1) Install dependencies

```bash
npm install
```

### 2) Run dev server

```bash
npm run dev
```

### 3) Production build

```bash
npm run build
```

---

## API Endpoints

Base URL: `http://localhost:5258` (update if your API port differs)

- `GET /api/incidents`
  - Returns all stored incidents.
- `GET /api/incidents/{id}`
  - Returns one incident by database ID.

---

## Feature Walkthrough

### Live Map (`/`)

- Leaflet map centered on Adelaide
- Marker click selects incident
- Expandable detail sidebar with:
  - Type, Location, Status
  - Reported timestamp + elapsed time
  - Optional extra fields (if present)
  - Copy Incident JSON

### Incident List (`/list`)

- Fetches same API dataset
- Compound filtering:
  - Event Type
  - Status
- Sort by Newest/Oldest
- Styled incident cards
- "View on Map" deep-link to map selection

### Analytics (`/analytics`)

- Bar chart: incidents grouped by status
- Pie chart: incident type distribution
- Responsive card-grid layout

---

## Data Flow

1. Background service calls CFS live feed.
2. Payload is normalized and parsed.
3. New incidents are inserted into SQLite (`IncidentNo` dedupe).
4. API serves DB data.
5. React app fetches and renders map/list/analytics views.

---

## Git Ignore Strategy (Mono-Repo)

This repository uses a single root `.gitignore` (`Office/.gitignore`) that covers both:

- `SaConnectApi` (.NET build outputs, EF/local DB artifacts)
- `SaConnectWeb` (Node modules, Vite build outputs)

This keeps commits focused on source code and avoids checking in generated files.

### If you need to force-track a SQLite snapshot temporarily

Use `-f` to override `.gitignore` for a one-off commit:

```bash
git add -f "SaConnectApi/saconnect.db"
```

Then commit as usual. Remove it again later with:

```bash
git rm --cached "SaConnectApi/saconnect.db"
```

---

## Troubleshooting

### Push rejected (`non-fast-forward`)

```bash
git pull --rebase origin main
git push -u origin main
```

### CORS errors from frontend

Ensure backend CORS policy allows:

- `http://localhost:5173`

### Date parsing shows `Unknown`

Frontend uses AU date parsing (`DD/MM/YYYY` and `DD/MM/YYYY HH:mm`) with ACST handling.

### Map not rendering tiles

Confirm:

- `leaflet/dist/leaflet.css` is imported in `src/main.jsx`
- Browser can reach OpenStreetMap tile servers

### Migration/build artifacts polluting Git

Add/verify `.gitignore` entries for:

- `bin/`
- `obj/`
- `*.db`, `*.db-shm`, `*.db-wal`
- frontend `node_modules/`, `dist/`

---

## Roadmap

- Add backend unit/integration tests
- Add API pagination and search endpoints
- Persist richer incident history snapshots
- Add authentication/authorization
- Deploy API + frontend to cloud environment

---

If you want, I can also add:

- a matching root `.gitignore` tuned for both .NET + Vite
- environment-specific setup section (`appsettings`, ports)
- deployment instructions (Docker/Render/Azure).
