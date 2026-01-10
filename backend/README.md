# Product Review Backend

Spring Boot REST API backend for the Product Review Application.

## Features

- Product listing with pagination, sorting, and filters (category/search/minRating/price range)
- Review system (create/update/delete) with validation
- Aggregated product metrics (average rating, review count)
- Helpful votes on reviews (device-based)
- Groq-powered AI:
  - Review summary endpoint (language-aware)
  - Batch translation endpoint
- Resilience:
  - AI fallbacks (LOCAL summary when AI is unavailable)
  - Caching for expensive AI operations

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- (Optional) PostgreSQL for production

## Setup

### 1) Configure environment variables (Groq)

Copy `backend/.env.example` to `backend/.env` and set:

- `GROQ_API_KEY` (required for AI summary/translation)
- `GROQ_MODEL` (optional)

If `GROQ_API_KEY` is missing/invalid, AI endpoints will fall back (where applicable).

### 2) Build

```bash
mvn clean install
```

### 3) Run

```bash
mvn spring-boot:run
```

API base URL:

- `http://localhost:8080`

## API Endpoints

### Products

- `GET /api/products`
  - Query params:
    - `page`, `size`
    - `sortBy`, `sortDir`
    - `category`, `search`
    - `minRating`, `minPrice`, `maxPrice`
- `GET /api/products/{id}`
- `GET /api/products/{id}/review-summary?lang=en&limit=30`
  - Groq-powered summary when available
  - Falls back to LOCAL summary when AI is unavailable

### Reviews

- `GET /api/reviews/product/{productId}`
  - Query params: `page`, `size`, `sortBy`, `sortDir`, `minRating`
- `POST /api/reviews`
  - Body: `{ productId, comment, rating (1-5), reviewerName?, deviceId }`
- `PUT /api/reviews/{reviewId}`
- `DELETE /api/reviews/{reviewId}?deviceId=...`
- `POST /api/reviews/{reviewId}/helpful?deviceId=...`

### Translation (Groq)

- `POST /api/translate`
  - Body: `{ lang, texts: string[] }`

## Database

By default, the application uses H2 in-memory database for development. 
The database is initialized with sample products on startup.

Access H2 Console at: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:productreviewdb`
- Username: `sa`
- Password: (empty)

### PostgreSQL (optional)

This repo also supports a PostgreSQL profile (recommended for production-like setup).

- Start PostgreSQL (from repo root): `docker-compose up -d`
- Run backend with profile:
  - Windows PowerShell: `$env:SPRING_PROFILES_ACTIVE="postgres"; mvn spring-boot:run`
  - Mac/Linux: `SPRING_PROFILES_ACTIVE=postgres mvn spring-boot:run`

### DBeaver (optional)

To inspect PostgreSQL:

- Host: `localhost`
- Port: `5432`
- Database/User/Password: from your docker-compose/env config

## Testing

Run tests:
```bash
mvn test
```

## Production

To use PostgreSQL in production, update `application.properties` and uncomment the PostgreSQL configuration section.

Recommended production settings:

- Set JDBC URL/username/password
- Configure `SPRING_PROFILES_ACTIVE=prod`
- Configure Groq env vars on the host (do not commit secrets)
