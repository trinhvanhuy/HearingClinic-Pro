# Hearing Clinic Mobile App

React Native mobile/tablet application for the Hearing Clinic System.

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
   - `EXPO_PUBLIC_PARSE_APP_ID`: Your Parse application ID
   - `EXPO_PUBLIC_PARSE_SERVER_URL`: Your Parse Server URL

## Development

Start the Expo development server:
```bash
npm start
```

Then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your device

## Building

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Features

- ✅ Authentication (Login)
- ✅ Client Management (CRUD, Search)
- ✅ Hearing Reports (CRUD)
- ✅ Reminders Management
- ✅ Contact Client (Phone/Email via Linking)

## Tech Stack

- React Native
- Expo
- TypeScript
- React Navigation
- React Query
- Parse SDK

