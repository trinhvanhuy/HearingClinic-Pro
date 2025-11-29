# Hearing Clinic Backend

Parse Server backend for the Hearing Clinic System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - `PARSE_APP_ID`: Your Parse application ID
   - `PARSE_MASTER_KEY`: A secure master key (change this!)
   - `PARSE_SERVER_URL`: The URL where Parse Server will be accessible
   - `DATABASE_URI`: MongoDB connection string

## Running with Docker

1. Start services:
```bash
docker-compose up -d
```

2. Access Parse Dashboard:
   - URL: http://localhost:1337/dashboard
   - Username: admin (default)
   - Password: admin (default - change this!)

3. Stop services:
```bash
docker-compose down
```

## Running Locally (without Docker)

1. Make sure MongoDB is running locally or accessible

2. Update `.env` with your MongoDB connection string

3. Start the server:
```bash
npm run dev
```

The server will be available at http://localhost:1337/parse

## Cloud Code

Cloud Code functions are located in `src/cloud/main.js`. They include:
- Auto-filling `fullName` for Client objects
- Validating required fields
- Updating client's `lastVisitDate` after creating a hearing report
- Auto-setting reminder status based on due date

## Security

- Change the default `PARSE_MASTER_KEY` in production
- Change the default Parse Dashboard credentials
- Configure proper CLPs (Class Level Permissions) for production
- Use environment variables for all sensitive configuration

