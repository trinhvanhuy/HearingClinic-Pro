# Hearing Aids Clinic System

A full-stack system for managing hearing aids clinic operations, including client management, hearing reports, and reminders.

## Project Structure

```
hearing-clinic-system/
  backend/          # Parse Server with MongoDB
  webapp/           # React web application
  mobile/           # React Native mobile/tablet app
  shared/           # Shared models and utilities
```

## Tech Stack

- **Backend**: Parse Server (Node.js + Express) with MongoDB
- **Web**: React.js with Vite, TypeScript, TailwindCSS
- **Mobile**: React Native with Expo, TypeScript
- **Deployment**: Docker Compose

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn
- For mobile: Expo CLI (optional, can use `npx expo`)

### Initial Setup

1. Install root dependencies (this will install all workspace dependencies):
```bash
npm install
```

### Backend Setup

1. Navigate to `backend/`
2. Copy `.env.example` to `.env` and configure:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `PARSE_APP_ID`: Your Parse application ID
   - `PARSE_MASTER_KEY`: A secure master key (change the default!)
   - `PARSE_SERVER_URL`: http://localhost:1337/parse
   - `DATABASE_URI`: mongodb://mongo:27017/hearing-clinic-db

3. Start services with Docker:
   ```bash
   docker-compose up -d
   ```

4. Access Parse Dashboard at http://localhost:1337/dashboard
   - Default username: `admin`
   - Default password: `admin` (change this!)

### Web App Setup

1. Navigate to `webapp/`
2. Copy `.env.example` to `.env`:
   ```bash
   cd webapp
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `VITE_PARSE_APP_ID`: Same as backend `PARSE_APP_ID`
   - `VITE_PARSE_SERVER_URL`: http://localhost:1337/parse

3. Run dev server:
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:3000

### Mobile App Setup

1. Navigate to `mobile/`
2. Copy `.env.example` to `.env`:
   ```bash
   cd mobile
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `EXPO_PUBLIC_PARSE_APP_ID`: Same as backend `PARSE_APP_ID`
   - `EXPO_PUBLIC_PARSE_SERVER_URL`: http://localhost:1337/parse
   - **Note**: For physical devices, use your computer's IP address instead of `localhost`

3. Start Expo:
   ```bash
   npm start
   ```
   Then press `i` for iOS simulator, `a` for Android emulator, or scan QR code with Expo Go app.

## Features

- ✅ Authentication & Authorization
- ✅ Client Management (CRUD, Search)
- ✅ Hearing Reports (CRUD, Print)
- ✅ Reminders Management
- ✅ Contact Client (Phone/Email)

## License

MIT

