# AI WhatsApp Business Assistant

A production-ready multi-tenant SaaS platform for AI-powered WhatsApp business communication.

## Architecture

```
ai-whatsapp-business-assistant/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   ├── common/   # Shared utilities
│   │   │   ├── config/   # Configuration
│   │   │   └── database/ # Prisma service
│   │   └── prisma/       # Database schema & migrations
│   └── frontend/         # Angular SPA
│       └── src/
│           └── app/
│               ├── core/     # Services, guards, interceptors
│               ├── features/ # Feature modules (lazy-loaded)
│               ├── shared/   # Reusable components
│               └── layout/   # Shell layout
├── packages/
│   └── shared/           # Shared types & validators
├── infrastructure/
│   └── docker/           # Docker Compose configs
└── docs/                 # Documentation
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19, Material, TailwindCSS, RxJS, Signals |
| Backend | NestJS 11, Prisma, PostgreSQL, Redis, Bull |
| AI | Google Gemini API, RAG, Embeddings |
| Integrations | WhatsApp Business Cloud API, Stripe |
| Infrastructure | Docker, Vercel (frontend), Railway (backend) |

## Features

- **Multi-tenant** architecture with organization-based isolation
- **WhatsApp Integration** - receive/send messages, templates, media
- **AI Summarization** - auto-summarize conversations
- **AI Replies** - generate contextual reply suggestions
- **Sentiment Analysis** - understand customer mood
- **RAG Documents** - upload PDFs, ask AI questions about them
- **Smart Tagging** - auto-categorize conversations
- **Analytics Dashboard** - message trends, response rates
- **Subscription Billing** - Stripe integration with plans
- **RBAC** - role-based access control
- **Real-time** - WebSocket for live message updates
- **Dark/Light Mode** - theme toggle

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL 16
- Redis 7
- npm >= 10

### Quick Start with Docker

```bash
# Start PostgreSQL and Redis
npm run docker:up

# Install dependencies
cd apps/backend && npm install
cd ../frontend && npm install

# Setup database
cd apps/backend
cp .env.example .env  # Edit with your keys
npx prisma migrate dev
npx prisma generate

# Start backend
npm run start:dev

# Start frontend (new terminal)
cd apps/frontend
npm start
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_API_KEY` - Google AI API key
- `WHATSAPP_ACCESS_TOKEN` - Meta WhatsApp Business token
- `STRIPE_SECRET_KEY` - Stripe secret key
- `JWT_SECRET` - JWT signing secret

## API Documentation

Once running, visit `http://localhost:3000/api/docs` for Swagger UI.

## Deployment

### Frontend (Vercel)
```bash
cd apps/frontend
ng build --configuration production
# Deploy dist/ to Vercel
```

### Backend (Railway/Render)
```bash
# Use the Dockerfile in apps/backend/
docker build -t wa-assistant-api .
```

## License

MIT
