# SA Connect - Project Architecture & Execution Plan

## 1. Project Goal
Build a robust .NET 8 Web API with a React (Vite) frontend to fetch, store, and display live South Australian Country Fire Service (CFS) incident data. This project demonstrates enterprise-level .NET backend architecture and API integration.

## 2. Tech Stack
* **Backend:** .NET 8 Web API
* **Database:** Entity Framework Core (using SQLite for local development)
* **Background Worker:** .NET `IHostedService` (BackgroundService)
* **Data Source:** `https://data.eso.sa.gov.au/prod/cfs/criimson/cfs_current_incidents.json`
* **Frontend:** React (Vite) with a mapping library (e.g., Leaflet)

## 3. Core Rules for AI (STRICT COMPLIANCE)
1.  **Do not build the entire app at once.** Wait for the user to specify which phase to execute.
2.  **Write clean, documented code.** Include XML comments for API endpoints.
3.  **Explain the "Why".** When providing code, briefly explain the design pattern used (e.g., Repository pattern, Dependency Injection) so the user can defend it in an interview.
4.  **Never delete existing code** unless explicitly told to refactor.

## 4. Execution Phases (To be completed one by one)

### Phase 1: Foundation & Database
* Initialize the .NET 8 Web API project.
* Analyze the CFS JSON endpoint.
* Create a `CfsIncident` C# model mapping to the JSON fields.
* Set up `AppDbContext` using EF Core and SQLite.
* Provide terminal commands to run initial migrations.

### Phase 2: Data Ingestion
* Create an `IncidentSyncService` inheriting from `BackgroundService`.
* Configure it to run every 10 minutes.
* Use `HttpClient` to fetch the live JSON.
* Parse the JSON and save new incidents to the SQLite database using EF Core. Avoid duplicating existing records based on the Incident Number.

### Phase 3: API Endpoints
* Create `IncidentsController`.
* Implement a `GET /api/incidents` endpoint to return all stored data.
* Implement a `GET /api/incidents/active` endpoint filtering by status.
* Ensure Swagger UI is functioning for testing.

### Phase 4: Frontend Integration
* Initialize the React (Vite) project in a separate folder.
* Create a dashboard component to fetch data from the local .NET API.
* Display the incidents on a map using their latitude/longitude coordinates.