# SpiceDB Viewer

<p align="center">
  <img src="public/logo-rounded.png" alt="SpiceDB Viewer logo" width="240" />
</p>

<p align="center">
  <img alt="TanStack Start" src="https://img.shields.io/badge/TanStack%20Start-000000?style=flat&logo=tanstack&logoColor=white" />
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=0B1720" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white" />
  <img alt="Bun" src="https://img.shields.io/badge/Bun-runtime-000000?style=flat&logo=bun&logoColor=white" />
  <img alt="SpiceDB" src="https://img.shields.io/badge/SpiceDB-graph%20viewer-60D7CF?style=flat" />
</p>

A TanStack Start app for inspecting and managing a SpiceDB schema and relationship graph.

## Screenshots

### Schema graph

![Schema graph view](public/screenshots/schema-graph.png)

### Relationship graph

![Relationship graph view](public/screenshots/relationship-graph.png)

### Node search

![Relationship graph search](public/screenshots/search.png)

## Features

- Visualize reflected SpiceDB definitions, relations, permissions, caveats, and dependencies.
- Switch to a concrete relationship graph exported from SpiceDB.
- Search nodes, inspect metadata, refresh the graph, and delete individual or bulk relationships.
- Connect through gRPC or REST with secure and local-insecure modes.

## Run

```bash
bun install
bun run dev
```

Open `http://localhost:3010`.

## Required environment

```bash
SPICEDB_ENDPOINT=localhost:50051
SPICEDB_TOKEN=your-token
SPICEDB_PROTOCOL=grpc # or rest
SPICEDB_SECURITY=insecure-localhost # or secure
SPICEDB_RELATIONSHIP_EXPORT_LIMIT=1000
```

## Commands

```bash
bun run check
bun run test
bun run build
```
