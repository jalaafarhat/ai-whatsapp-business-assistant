# AI WhatsApp Business Assistant - Complete Setup Guide

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone & Install](#2-clone--install)
3. [Database Setup](#3-database-setup)
4. [Environment Configuration](#4-environment-configuration)
5. [WhatsApp Business API Setup](#5-whatsapp-business-api-setup)
6. [Google AI API Setup](#6-google-ai-api-setup)
7. [Stripe Setup](#7-stripe-setup)
8. [Running the Application](#8-running-the-application)
9. [API Documentation](#9-api-documentation)
10. [Deployment](#10-deployment)
11. [Architecture Overview](#11-architecture-overview)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

Make sure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20.x | JavaScript runtime |
| npm | >= 10.x | Package manager |
| Docker Desktop | Latest | PostgreSQL & Redis containers |
| Git | Latest | Version control |

Optional for production:
- Vercel CLI (frontend deployment)
- Railway CLI (backend deployment)

---

## 2. Clone & Install

### Clone the repository

```bash
git clone https://github.com/jalaafarhat/ai-whatsapp-business-assistant.git
cd ai-whatsapp-business-assistant
```

### Install backend dependencies

```bash
cd apps/backend
npm install --legacy-peer-deps
```

### Install frontend dependencies

```bash
cd apps/frontend
npm install --legacy-peer-deps
```

---

## 3. Database Setup

### Start PostgreSQL and Redis with Docker

From the project root:

```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (user: `postgres`, password: `postgres`, db: `whatsapp_assistant`)
- **Redis** on `localhost:6379`

### Verify containers are running

```bash
docker ps
```

You should see `wa-assistant-db` and `wa-assistant-redis` both with status "healthy".

### Run database migrations

```bash
cd apps/backend
npx prisma migrate dev --name init
```

This creates all the database tables defined in `prisma/schema.prisma`.

### Generate Prisma Client

```bash
npx prisma generate
```

### View database (optional)

```bash
npx prisma studio
```

Opens a web UI at `http://localhost:5555` to browse your database.

---

## 4. Environment Configuration

### Backend (.env)

Create `apps/backend/.env` from the example:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit the `.env` file with your actual values:

```env
# Database (already configured for Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whatsapp_assistant
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth - CHANGE THESE IN PRODUCTION
JWT_SECRET=your-strong-random-secret-min-32-chars
JWT_REFRESH_SECRET=another-strong-random-secret-min-32-chars
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google AI
GOOGLE_API_KEY=your-google-api-key

# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-custom-verify-token
WHATSAPP_APP_SECRET=your-app-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
APP_URL=http://localhost:4200
API_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

### Frontend environment

Edit `apps/frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'http://localhost:3000',
  stripePublishableKey: 'pk_test_your-key',
};
```

---

## 5. WhatsApp Business API Setup

### Step 1: Create a Meta Developer Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app → Select "Business" type
3. Add "WhatsApp" product to your app

### Step 2: Get Your Credentials

From the WhatsApp section in your Meta app dashboard:

- **Phone Number ID**: Found under WhatsApp > API Setup
- **Access Token**: Generate a permanent token (System User → Generate Token)
- **App Secret**: Found under Settings > Basic

### Step 3: Configure Webhook

1. In your Meta app → WhatsApp → Configuration
2. Set Callback URL to: `https://your-api-domain.com/api/v1/webhook/whatsapp`
3. Set Verify Token to the same value as `WHATSAPP_VERIFY_TOKEN` in your .env
4. Subscribe to: `messages`, `messaging_postbacks`

### Step 4: Configure in the App

After starting the backend, go to Settings in the dashboard and enter:
- Phone Number ID
- Access Token
- Business Name

### Testing Locally

For local development, use [ngrok](https://ngrok.com/) to expose your local server:

```bash
ngrok http 3000
```

Then use the ngrok HTTPS URL as your webhook callback URL.

---

## 6. Google AI API Setup

### Step 1: Get an API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key or use existing one

### Step 2: Set in .env

```env
GOOGLE_API_KEY=AIzaSy...your-key
```

### Models Used

| Feature | Model |
|---------|-------|
| Chat summarization | gemini-2.0-flash |
| Reply generation | gemini-2.0-flash |
| Sentiment analysis | gemini-2.0-flash |
| Embeddings (RAG) | text-embedding-004 |

---

## 7. Stripe Setup

### Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your API keys from Developers > API Keys

### Step 2: Create Products & Prices

In Stripe Dashboard → Products, create:

| Plan | Price | Price ID |
|------|-------|----------|
| Starter | $29/month | price_starter_xxx |
| Professional | $79/month | price_professional_xxx |
| Enterprise | $199/month | price_enterprise_xxx |

### Step 3: Set Webhook

1. Developers → Webhooks → Add endpoint
2. URL: `https://your-api-domain.com/api/v1/billing/webhook`
3. Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### Step 4: Configure .env

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 8. Running the Application

### Start Backend

```bash
cd apps/backend
npm run start:dev
```

Backend runs at: **http://localhost:3000**

### Start Frontend

```bash
cd apps/frontend
npm start
```

Frontend runs at: **http://localhost:4200**

### Start Both (from root)

Open two terminals:

```bash
# Terminal 1
cd apps/backend && npm run start:dev

# Terminal 2
cd apps/frontend && npm start
```

### Accessing the App

1. Open **http://localhost:4200**
2. Register a new account (creates organization + admin user)
3. You'll be redirected to the dashboard

---

## 9. API Documentation

Once the backend is running, visit:

**http://localhost:3000/api/docs**

This shows the Swagger UI with all available endpoints:

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/register, /auth/login, /auth/refresh, /auth/logout |
| Users | GET /users/me, GET /users, PATCH /users/:id |
| Organizations | GET /organizations/current, PATCH /organizations/current |
| Chats | GET /chats/:workspaceId, GET /chats/conversation/:id |
| Messages | GET /messages/:conversationId, POST /messages/:conversationId |
| AI | POST /ai/summarize/:id, /ai/sentiment/:id, /ai/generate-reply, /ai/ask |
| WhatsApp | POST /whatsapp/configure, GET/POST /webhook/whatsapp |
| Documents | GET /documents, POST /documents/upload, DELETE /documents/:id |
| Billing | GET /billing/subscription, POST /billing/checkout, /billing/portal |
| Analytics | GET /analytics/dashboard, /analytics/trends |

---

## 10. Deployment

### Frontend → Vercel

```bash
cd apps/frontend
ng build --configuration production
```

Then deploy via Vercel:
1. Connect your GitHub repo to Vercel
2. Set root directory to `apps/frontend`
3. Build command: `npm run build`
4. Output directory: `dist/frontend/browser`
5. Add environment variables

### Backend → Railway

1. Connect your GitHub repo to Railway
2. Set root directory to `apps/backend`
3. Railway auto-detects the Dockerfile
4. Add environment variables in Railway dashboard
5. Add PostgreSQL and Redis plugins

### Backend → Render

1. Create a new Web Service
2. Connect GitHub repo
3. Root directory: `apps/backend`
4. Build command: `npm install --legacy-peer-deps && npx prisma generate && npm run build`
5. Start command: `npx prisma migrate deploy && node dist/main`
6. Add environment variables

### Environment Variables for Production

Remember to set in your hosting provider:
- All variables from `.env.example`
- `NODE_ENV=production`
- `APP_URL=https://your-frontend-domain.com`
- `DATABASE_URL=your-production-db-url`

---

## 11. Architecture Overview

### System Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   Angular    │◄─────►│   NestJS     │◄─────►│ PostgreSQL  │
│  Frontend    │ REST  │   Backend    │ Prisma│  Database   │
│  (Vercel)    │  +WS  │  (Railway)   │       │             │
└─────────────┘       └──────┬───────┘       └─────────────┘
                             │
                    ┌────────┼────────┐
                    │        │        │
              ┌─────▼─┐ ┌───▼───┐ ┌──▼──┐
              │ Redis  │ │Google │ │Meta │
              │ Cache  │ │  AI   │ │ WA  │
              │& Queue │ │ API   │ │ API │
              └────────┘ └───────┘ └─────┘
```

### Backend Module Structure

```
src/
├── main.ts                    # App bootstrap
├── app.module.ts              # Root module
├── config/                    # Environment configs
├── database/                  # Prisma service
├── common/                    # Shared utilities
│   ├── decorators/            # @CurrentUser, @Roles
│   ├── filters/               # Exception filters
│   ├── guards/                # RolesGuard
│   ├── interceptors/          # Transform, Logging
│   └── interfaces/            # Shared types
└── modules/
    ├── auth/                  # JWT authentication
    ├── users/                 # User management
    ├── organizations/         # Multi-tenancy
    ├── chats/                 # Conversations + WebSocket
    ├── messages/              # Message CRUD
    ├── ai/                    # AI services (summary, sentiment, RAG)
    ├── whatsapp/              # WhatsApp Cloud API integration
    ├── documents/             # PDF upload + chunking
    ├── billing/               # Stripe subscriptions
    └── analytics/             # Dashboard stats
```

### Database Schema (Key Relations)

```
Organization ──┬── Users
               ├── Workspaces ── Conversations ── Messages
               ├── Subscription                    ├── AiSummaries
               ├── Documents ── DocumentChunks     └── SentimentAnalyses
               └── UsageRecords

Conversation ── Contact
```

### Frontend Structure

```
src/app/
├── app.component.ts           # Root component
├── app.config.ts              # Providers (HTTP, router)
├── app.routes.ts              # Lazy-loaded routes
├── core/                      # Singleton services
│   ├── services/              # Auth, API, Theme, Notification
│   ├── guards/                # Auth route guard
│   └── interceptors/          # JWT token, error handling
├── features/                  # Feature modules (lazy-loaded)
│   ├── auth/                  # Login, Register
│   ├── dashboard/             # Stats overview
│   ├── chats/                 # WhatsApp-style chat UI
│   ├── analytics/             # Message trends
│   ├── documents/             # RAG document management
│   ├── settings/              # WhatsApp config, theme
│   └── billing/               # Subscription plans
├── shared/                    # Reusable components
└── layout/                    # Main layout with sidenav
```

---

## 12. Troubleshooting

### Docker containers won't start

```bash
# Check if Docker Desktop is running
docker info

# Restart containers
docker-compose -f infrastructure/docker/docker-compose.yml down
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### Database connection refused

- Ensure PostgreSQL container is running: `docker ps`
- Check port 5432 isn't used by another process
- Verify `DATABASE_URL` in `.env`

### Prisma migration fails

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Re-run migration
npx prisma migrate dev
```

### Backend won't start

- Check all required environment variables are set
- Ensure Redis is running on port 6379
- Check for port conflicts on 3000

### Frontend can't connect to backend

- Ensure backend is running on port 3000
- Check CORS: backend allows `http://localhost:4200`
- Verify `environment.ts` has correct `apiUrl`

### WhatsApp webhook not receiving messages

- Ensure your server is publicly accessible (use ngrok for local dev)
- Verify token matches between Meta dashboard and `.env`
- Check webhook subscription is active for "messages"

### AI features not working

- Verify `GOOGLE_API_KEY` is valid
- Check API quota at [Google AI Studio](https://aistudio.google.com/)
- Ensure documents are in "READY" status before querying

---

## Quick Reference Commands

```bash
# Start everything
docker-compose -f infrastructure/docker/docker-compose.yml up -d
cd apps/backend && npm run start:dev
cd apps/frontend && npm start

# Database commands
npx prisma studio          # Visual DB browser
npx prisma migrate dev     # Create migration
npx prisma migrate reset   # Reset DB
npx prisma generate        # Regenerate client

# Docker commands
docker ps                                                    # List containers
docker-compose -f infrastructure/docker/docker-compose.yml logs -f  # View logs
docker-compose -f infrastructure/docker/docker-compose.yml down     # Stop all

# Build for production
cd apps/backend && npm run build
cd apps/frontend && ng build --configuration production
```
