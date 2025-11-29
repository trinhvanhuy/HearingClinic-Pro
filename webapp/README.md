# Hearing Clinic Web App

React web application for the Hearing Clinic System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

3. Update `.env` with your Parse Server configuration:
   - `VITE_PARSE_APP_ID`: Your Parse application ID
   - `VITE_PARSE_SERVER_URL`: Your Parse Server URL

## Development

Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Build

Build for production:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Features

- ✅ Authentication (Login, Password Reset)
- ✅ Client Management (CRUD, Search)
- ✅ Hearing Reports (CRUD, Print)
- ✅ Reminders Management
- ✅ Contact Client (Phone/Email)

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- React Query
- TailwindCSS
- Parse SDK

