# Bolota Agent

## Overview

Bolota is a modular agent that integrates PubMed and a local medications DB to answer user queries.

## Requirements

- Node 22+
- Docker & docker-compose (optional)
- CSV file: dados_produtos.csv

## Quickstart (local)

1. copy `.env.example` to `.env` and edit.
2. npm install
3. npm run seed
4. npm run dev
5. Open http://localhost:3000/docs

## Quickstart (docker)

1. place `dados_produtos.csv` in project root
2. docker-compose up --build
3. Wait for containers
4. Seed: exec into container and run `npm run seed` or run script in host

## Endpoints

- GET /medications?query=amoxicilina
- GET /pubmed?query=amoxicilina
- POST /webhook/bolota { "sessionId": "...", "message":"Me fale sobre Amoxicilina" }

## Demo Flow (curl)

1. Ask:

```bash
curl -X POST http://localhost:3000/webhook/bolota -H "Content-Type: application/json" -d '{"message":"Me fale sobre Amoxicilina","sessionId":"user1"}'
```
