# 🔌 DBeaver Connection Guide - PostgreSQL

This guide will help you connect DBeaver to the PostgreSQL database running in Docker.

---

## 📋 Prerequisites

1. **Docker Desktop installed and running** - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Docker must be running before starting PostgreSQL
   - Verify: `docker --version` should work
   - Check Docker Desktop is running (whale icon in system tray/menu bar)

2. **PostgreSQL container running** - Start with `docker-compose up -d`
   - Navigate to project root (where `docker-compose.yml` is located)
   - Run: `docker-compose up -d`
   - Verify: `docker ps` should show `product-review-postgres` container

3. **DBeaver installed** - [Download DBeaver](https://dbeaver.io/download/)
   - Install DBeaver Community Edition (free)
   - Launch DBeaver application

---

## 🔧 Step-by-Step Connection Setup

### Step 1: Open DBeaver

Launch DBeaver application.

### Step 2: Create New Database Connection

1. Click **"New Database Connection"** button (plug icon) in the toolbar
   - Or go to: **Database** → **New Database Connection**
   - Or press: `Ctrl+Shift+N` (Windows/Linux) / `Cmd+Shift+N` (Mac)

### Step 3: Select PostgreSQL

1. In the connection wizard, select **PostgreSQL**
2. Click **Next**

### Step 4: Enter Connection Details

Fill in the following information:

**Main Tab:**
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** Set via `POSTGRES_DB` environment variable (default: see chat)
- **Username:** Set via `POSTGRES_USER` environment variable (default: see chat)
- **Password:** Set via `POSTGRES_PASSWORD` environment variable (default: see chat)
- **Show all databases:** Leave unchecked

**Note:** Database credentials are stored in environment variables. Check chat or your local `.env` file for actual values.

**Driver Properties Tab (Optional):**
- No changes needed for basic connection

### Step 5: Test Connection

1. Click **"Test Connection"** button
2. If this is your first PostgreSQL connection, DBeaver will prompt to download the driver
   - Click **"Download"** and wait for download to complete
3. You should see: **"Connected"** message
4. Click **"Finish"**

---

## ✅ Verify Connection

### View Database Structure

1. In the **Database Navigator** panel (left side), expand your connection
2. You should see:
   - **Databases** → (Your database name from `POSTGRES_DB` environment variable)
   - **Schemas** → `public`
   - **Tables:**
     - `products`
     - `reviews`
     - `flyway_schema_history` (Flyway migration tracking)

### View Tables

1. **Refresh the connection first:**
   - Right-click on your database connection → **Refresh**
   - Or press `F5` while connection is selected
   - Wait for refresh to complete

2. **Expand Tables:**
   - Expand **Schemas** → `public` → **Tables**
   - You should see: `flyway_schema_history`, `products`, `reviews`

3. **If tables don't appear:**
   - Right-click on `public` schema → **Refresh**
   - Check if you're connected to the correct database (check your `POSTGRES_DB` environment variable)
   - Verify connection settings match exactly

### View Table Data

1. Expand **Tables** → `products`
2. Right-click on `products` → **View Data**
3. You should see 10 demo products

### View Table Structure

1. Right-click on `products` → **View DDL**
2. You can see the table creation SQL with indexes

---

## 🔍 Useful DBeaver Features

### Execute SQL Queries

1. Right-click on your connection → **SQL Editor** → **New SQL Script**
2. Write your SQL query, e.g.:
   ```sql
   SELECT * FROM products WHERE category = 'Electronics';
   ```
3. Press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac) to execute

### View Indexes

1. Expand **Tables** → `products` → **Indexes**
2. You should see:
   - `idx_products_category`
   - `idx_products_name`
   - `idx_products_created_at`

### Modify Data

1. Right-click on a table → **Edit Data**
2. You can add, edit, or delete rows directly in DBeaver
3. Changes are saved to the database immediately

### Export Data

1. Right-click on a table → **Export Data**
2. Choose format (CSV, JSON, SQL, etc.)
3. Follow the wizard to export

---

## 🐛 Troubleshooting

### Problem: "Connection refused" or "Connection timed out"

**Solutions:**

1. **Verify Docker Desktop is running:**
   - **Windows:** Check system tray for Docker whale icon
   - **Mac:** Check menu bar for Docker icon
   - **Linux:** Check Docker service: `sudo systemctl status docker`
   - If not running, start Docker Desktop first

2. **Verify PostgreSQL container is running:**
   ```bash
   docker ps
   ```
   You should see `product-review-postgres` container with status "Up X seconds/minutes".
   
   **If container is not running:**
   ```bash
   # Start the container
   docker-compose up -d
   
   # Check logs for errors
   docker-compose logs postgres
   ```

3. **Check if port 5432 is exposed:**
   ```bash
   docker-compose ps
   ```
   Should show: `0.0.0.0:5432->5432/tcp`
   
   **If port is not exposed:**
   - Check `docker-compose.yml` has correct port mapping
   - Restart container: `docker-compose restart`

4. **Test port connectivity:**
   ```bash
   # Windows PowerShell
   Test-NetConnection -ComputerName localhost -Port 5432
   
   # Mac/Linux
   nc -zv localhost 5432
   ```
   
   **If connection fails:**
   - Check Windows Firewall settings
   - Add exception for port 5432
   - Or temporarily disable firewall to test

5. **Restart PostgreSQL container:**
   ```bash
   docker-compose restart
   ```
   
   Wait 10-15 seconds for container to be ready, then try connecting again.

### Problem: "Authentication failed"

**Solutions:**
1. Verify credentials match your environment variables:
   - Username: Check `POSTGRES_USER` environment variable
   - Password: Check `POSTGRES_PASSWORD` environment variable
   - Database: Check `POSTGRES_DB` environment variable

2. Check if database was created (replace with your actual values):
   ```bash
   docker exec -it product-review-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt"
   ```

### Problem: "Driver not found"

**Solutions:**
1. DBeaver should prompt to download driver automatically
2. If not, go to: **Window** → **Preferences** → **Connections** → **Drivers** → **PostgreSQL** → **Download/Update**

### Problem: "Database does not exist"

**Solutions:**
1. Verify database name matches your `POSTGRES_DB` environment variable (case-sensitive)
2. Check docker-compose.yml has correct database name
3. Restart container: `docker-compose down && docker-compose up -d`

---

## 📊 Database Schema Overview

### Products Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| description | VARCHAR(1000) | |
| category | VARCHAR(255) | NOT NULL |
| price | NUMERIC(10,2) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_products_category` - For filtering by category
- `idx_products_name` - For search queries
- `idx_products_created_at` - For sorting by date

### Reviews Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PRIMARY KEY |
| product_id | BIGINT | NOT NULL, FOREIGN KEY → products(id) |
| comment | VARCHAR(2000) | NOT NULL |
| rating | INTEGER | NOT NULL, CHECK (1-5) |
| reviewer_name | VARCHAR(255) | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

**Indexes:**
- `idx_reviews_product_id` - For filtering reviews by product
- `idx_reviews_created_at` - For sorting reviews by date
- `idx_reviews_rating` - For rating-based queries

---

## 💡 Tips

1. **Save Connection:** Your connection is automatically saved
2. **Test Before Use:** Always test connection before using
3. **Use SQL Editor:** For complex queries, use SQL Editor instead of visual query builder
4. **Backup Data:** Export important data before making changes
5. **View Execution Plans:** Use "Explain Plan" to optimize queries

---

**Happy Querying!** 🎉

