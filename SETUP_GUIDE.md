# 🚀 Setup Guide - Product Review Application

Complete step-by-step guide to set up and run the Product Review Application with PostgreSQL database.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Software

1. **Java 17 or higher** - [Download Java](https://adoptium.net/)
   - Verify installation: `java -version`
   - Should show Java 17 or higher

2. **Maven 3.6+** - [Download Maven](https://maven.apache.org/download.cgi)
   - Verify installation: `mvn --version`
   - Should show Maven 3.6 or higher

3. **Node.js 16+ and npm** - [Download Node.js](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`
   - Should show Node.js 16+ and npm 8+

4. **Docker Desktop** - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
   - **⚠️ Important:** Docker is required for PostgreSQL database
   - **Alternative:** You can use H2 in-memory database (no Docker needed) - see Step 2.5
   - Verify installation: `docker --version`
   - Make sure Docker Desktop is running before starting PostgreSQL

5. **Git** - [Download Git](https://git-scm.com/downloads)
   - Verify installation: `git --version`

### Optional Software

6. **Android Studio** (for Android emulator) - [Download Android Studio](https://developer.android.com/studio)
   - Required if you want to run the app on an Android emulator
   - Includes Android SDK and emulator

7. **DBeaver** (for database inspection) - [Download DBeaver](https://dbeaver.io/download/)
   - Optional tool to view and manage PostgreSQL database
   - Not required for running the application

8. **Expo Go app** (for physical device testing) - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - Optional: Only needed if testing on a physical device
   - Not needed if using Android emulator

---

## 🔧 Installation Guide

### Is Docker Required?

**Short Answer: No, Docker is optional.**

You have two options:

1. **PostgreSQL with Docker** (Recommended for production-like setup)
   - Requires Docker Desktop installation
   - Persistent database that survives restarts
   - Can be inspected with DBeaver
   - Better for demonstrating real database setup

2. **H2 In-Memory Database** (Quick start, no Docker needed)
   - No installation required
   - Data resets when backend restarts
   - Perfect for quick testing
   - See Step 2.5 for instructions

**Choose based on your needs:**
- **For quick testing:** Use H2 (skip Docker installation)
- **For production demo or DBeaver inspection:** Use PostgreSQL with Docker

### Installing Docker Desktop

**⚠️ Only install Docker if you want to use PostgreSQL database.** You can skip this section if using H2.

#### Windows Installation:

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop
   - Click "Download for Windows"
   - Save the installer file (`Docker Desktop Installer.exe`)

2. **Run the Installer:**
   - Double-click `Docker Desktop Installer.exe`
   - Follow the installation wizard
   - Check "Use WSL 2 instead of Hyper-V" if prompted (recommended)
   - Click "Ok" when installation completes

3. **Restart Your Computer:**
   - Docker will prompt you to restart
   - Save your work and restart

4. **Launch Docker Desktop:**
   - After restart, Docker Desktop should start automatically
   - If not, find "Docker Desktop" in Start Menu and launch it
   - Wait for Docker to start (you'll see a whale icon in system tray)
   - Status should show "Docker Desktop is running"

5. **Verify Installation:**
   - Open PowerShell
   - Run: `docker --version`
   - You should see: `Docker version XX.XX.X, build ...`
   - Run: `docker-compose --version`
   - You should see: `Docker Compose version vX.X.X`

6. **Troubleshooting:**
   - If Docker doesn't start, check Windows features:
     - Go to: Control Panel → Programs → Turn Windows features on or off
     - Enable "Virtual Machine Platform" and "Windows Subsystem for Linux" (if using WSL 2)
   - If port 5432 is already in use:
     - Check: `netstat -ano | findstr :5432`
     - Stop the service using port 5432 or change PostgreSQL port in `docker-compose.yml`

#### Mac Installation:

1. **Download Docker Desktop:**
   - Go to: https://www.docker.com/products/docker-desktop
   - Click "Download for Mac"
   - Choose version for Intel Chip or Apple Silicon (M1/M2)
   - Save the `.dmg` file

2. **Install Docker:**
   - Open the downloaded `.dmg` file
   - Drag Docker icon to Applications folder
   - Open Applications folder and double-click Docker
   - Enter your password when prompted

3. **Complete Setup:**
   - Follow the setup wizard
   - Docker Desktop will start automatically
   - Wait for Docker to start (whale icon in menu bar)

4. **Verify Installation:**
   - Open Terminal
   - Run: `docker --version`
   - Run: `docker-compose --version`

#### Linux Installation:

1. **Install Docker Engine:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install docker.io docker-compose
   
   # Or follow official guide: https://docs.docker.com/engine/install/ubuntu/
   ```

2. **Start Docker Service:**
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Add User to Docker Group (optional, to avoid sudo):**
   ```bash
   sudo usermod -aG docker $USER
   # Log out and log back in for changes to take effect
   ```

4. **Verify Installation:**
   ```bash
   docker --version
   docker-compose --version
   ```

**Important Notes:**
- Docker Desktop must be **running** before using `docker-compose` commands
- On Windows/Mac, make sure Docker Desktop is started (check system tray/menu bar)
- If Docker is not running, you'll get errors like "Cannot connect to Docker daemon"

### Installing Other Prerequisites

**Java 17+:**
- Download from: https://adoptium.net/
- Select "Temurin 17 (LTS)" or higher
- Install and verify: `java -version`

**Maven:**
- Download from: https://maven.apache.org/download.cgi
- Extract and add `bin` folder to PATH
- Verify: `mvn --version`

**Node.js:**
- Download from: https://nodejs.org/
- Install LTS version (includes npm)
- Verify: `node --version` and `npm --version`

**Android Studio:**
- Download from: https://developer.android.com/studio
- Install with Android SDK
- Create an Android Virtual Device (AVD) for emulator

**DBeaver (Optional):**
- Download from: https://dbeaver.io/download/
- Install and launch
- See `docs/DBeaver_Connection_Guide.md` for connection setup

---

## 🗄️ Step 1: Database Setup

**Choose your database option:**

### Option A: PostgreSQL with Docker (Recommended)

**⚠️ Prerequisites:** Docker Desktop must be installed and running (see Installation Guide above).

#### 1.1 Start PostgreSQL with Docker Compose

**Before starting, make sure Docker Desktop is running:**
- **Windows:** Check system tray for Docker whale icon
- **Mac:** Check menu bar for Docker icon
- **Linux:** Verify Docker service is running: `sudo systemctl status docker`

**Start PostgreSQL:**

**Windows (PowerShell):**
```powershell
# Navigate to project root (where docker-compose.yml is located)
cd C:\Users\pelin\Documents\GitHub\solitaryAI-project-product-review

# Start PostgreSQL
docker-compose up -d
```

**Mac/Linux (Bash):**
```bash
# Navigate to project root (where docker-compose.yml is located)
cd /path/to/solitaryAI-project-product-review

# Start PostgreSQL
docker-compose up -d
```

**What this does:**
- Downloads PostgreSQL 15 image (first time only)
- Starts a PostgreSQL container named `product-review-postgres`
- Creates database, user, and password from environment variables (see chat for defaults)
- Exposes port: `5432` to your host machine
- Creates a persistent volume for data (data survives container restarts)

**Note:** Database credentials are configured via environment variables. Default values are provided in chat.

**Expected output:**
```
Creating network "solitaryai-project-product-review_default" ... done
Creating product-review-postgres ... done
```

#### 1.2 Verify PostgreSQL is Running

**Windows (PowerShell):**
```powershell
docker ps
```

**Mac/Linux (Bash):**
```bash
docker ps
```

**You should see:**
```
CONTAINER ID   IMAGE                  STATUS         PORTS                    NAMES
xxxxxxxxxxxx   postgres:15-alpine    Up X seconds   0.0.0.0:5432->5432/tcp   product-review-postgres
```

**If container is not running:**
```bash
# Check logs for errors
docker-compose logs postgres

# Restart if needed
docker-compose restart
```

#### 1.3 (Optional) Connect with DBeaver

See `docs/DBeaver_Connection_Guide.md` for detailed DBeaver setup instructions.

**Quick Connection Settings:**
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** Set via `POSTGRES_DB` environment variable
- **Username:** Set via `POSTGRES_USER` environment variable
- **Password:** Set via `POSTGRES_PASSWORD` environment variable

**If DBeaver cannot connect:**
- Make sure Docker container is running: `docker ps`
- Verify port 5432 is not blocked by firewall
- Check connection settings match exactly above
- See Troubleshooting section for more help

### Option B: H2 In-Memory Database (No Docker Required)

**Skip to Step 2.5** to use H2 database instead. This is perfect if you:
- Don't want to install Docker
- Just want to test the application quickly
- Don't need persistent data or DBeaver inspection

**Note:** With H2, data is lost when backend restarts, but it's perfect for quick development and testing.

### 1.3 (Optional) Connect with DBeaver

See `docs/DBeaver_Connection_Guide.md` for detailed DBeaver setup instructions.

**Quick Connection Settings:**
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** Set via `POSTGRES_DB` environment variable
- **Username:** Set via `POSTGRES_USER` environment variable
- **Password:** Set via `POSTGRES_PASSWORD` environment variable

---

## ⚙️ Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

**Windows (PowerShell):**
```powershell
cd backend
```

**Mac/Linux (Bash):**
```bash
cd backend
```

### 2.2 Build the Project

**Windows (PowerShell):**
```powershell
mvn clean install
```

**Mac/Linux (Bash):**
```bash
mvn clean install
```

This will download all dependencies and compile the project. First build may take 2-5 minutes.

### 2.3 Run Backend with PostgreSQL Profile

**Windows (PowerShell):**
```powershell
# Option 1: Use quotes around the -D parameter
mvn spring-boot:run "-Dspring-boot.run.profiles=postgres"

# Option 2: Use environment variable (recommended for PowerShell)
$env:SPRING_PROFILES_ACTIVE="postgres"; mvn spring-boot:run
```

**Mac/Linux (Bash):**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

**Alternative (using environment variable - works on all platforms):**
```bash
# Windows PowerShell
$env:SPRING_PROFILES_ACTIVE="postgres"; mvn spring-boot:run

# Mac/Linux Bash
SPRING_PROFILES_ACTIVE=postgres mvn spring-boot:run
```

You should see:
- Flyway migrations running (V1, V2, V3)
- Database tables created
- Demo data seeded
- Output: `Started ProductReviewApplication in X.XXX seconds`

✅ **Backend is running at:** `http://localhost:8080`

### 2.4 Verify Backend is Running

Open your browser and navigate to:
```
http://localhost:8080/api/products
```

You should see a JSON response with 10 demo products. If you see JSON, the backend is working correctly!

**Keep this terminal window open** - the backend needs to keep running.

### 2.5 (Optional) Run with H2 for Quick Development

If you want to use H2 in-memory database (data resets on restart):

**Windows (PowerShell):**
```powershell
# Option 1: Use quotes around the -D parameter
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"

# Option 2: Use environment variable (recommended for PowerShell)
$env:SPRING_PROFILES_ACTIVE="dev"; mvn spring-boot:run
```

**Mac/Linux (Bash):**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## 📱 Step 3: Mobile Application Setup

### 3.1 Open a New Terminal Window

Keep the backend terminal running, open a new terminal window/tab.

### 3.2 Navigate to Mobile Directory

**Windows (PowerShell):**
```powershell
cd mobile
```

**Mac/Linux (Bash):**
```bash
cd mobile
```

### 3.3 Install Dependencies

**Windows (PowerShell):**
```powershell
npm install
```

**Mac/Linux (Bash):**
```bash
npm install
```

This will install all required packages including `expo-constants`. First installation may take 2-5 minutes.

### 3.4 Configure API URL

The app automatically detects the environment, but you may need to update it for physical device testing.

**Edit:** `mobile/config/api.js`

**For Android Emulator (default):**
- The app automatically uses `http://10.0.2.2:8080` when running on an emulator
- No changes needed if testing on emulator

**For Physical Device (Expo Go):**
1. Find your computer's IP address:
   - **Windows:** Run `ipconfig` and look for "IPv4 Address" under "Wireless LAN adapter Wi-Fi"
   - **Mac/Linux:** Run `ifconfig` or `ip addr` and look for your network interface IP
   
2. Update `mobile/config/api.js`:
   ```javascript
   // In the getApiBaseUrl function, replace:
   return 'http://YOUR_COMPUTER_IP:8080'; // REPLACE WITH YOUR COMPUTER'S IP
   // With your actual IP, e.g.:
   return 'http://192.168.1.100:8080';
   ```

**Important:** 
- For Expo Go, your phone and computer must be on the same Wi-Fi network
- Make sure your firewall allows connections on port 8080
- The backend must be running and accessible from your network

### 3.5 Start the Development Server

**Windows (PowerShell):**
```powershell
npm start
```

**Mac/Linux (Bash):**
```bash
npm start
```

You should see:
- A QR code in the terminal
- Options to press keys (a for Android, i for iOS, etc.)
- Console log showing: `API Base URL: http://10.0.2.2:8080` (or your configured URL)

---

## 🎯 Step 4: Run the Mobile App

### Option 1: Android Emulator (Recommended for PC Demo)

1. **Open Android Studio**
2. **Start an emulator:**
   - Click on "Device Manager" (or AVD Manager)
   - Click the play button next to an emulator (or create one if you don't have any)
   - Wait for the emulator to start (may take 1-2 minutes)

3. **In the terminal where `npm start` is running, press `a`**

4. The app will automatically open in the emulator! ✅

### Option 2: Expo Go on Physical Device

1. **Install Expo Go app** on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Make sure your phone and computer are on the same Wi-Fi network**

3. **In the terminal where `npm start` is running, you'll see a QR code**

4. **Open Expo Go app** on your phone and scan the QR code**

5. The app will load on your phone! ✅

---

## 🧪 Step 5: Test the Application

### Quick Demo Script (2-3 minutes)

1. **View Product List**
   - You should see 10 products with prices and ratings
   - Try scrolling to see infinite scroll in action
   - Pull down to refresh the list

2. **View Product Details**
   - Tap on any product (e.g., "iPhone 15 Pro")
   - See product description, price, average rating, and review count
   - Scroll down to see existing reviews (if any)

3. **Add a Review**
   - Tap the "➕ Add Review" button
   - Enter your name (optional)
   - Select a rating (1-5 stars)
   - Write a review comment (minimum 10 characters)
   - Tap "Submit Review"
   - You'll see a success message
   - The product detail screen will automatically refresh showing your new review

4. **Verify Review Aggregation**
   - Go back to the product list
   - Notice the average rating and review count have updated
   - Tap the product again to see all reviews

5. **Test Search/Filter** (if implemented in UI)
   - Use any search or filter features
   - Verify pagination works

---

## 📦 Step 6: Build APK for Distribution

### Prerequisites for APK Build

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo (create free account if needed):**
   ```bash
   eas login
   ```

3. **Configure build (first time only):**
   ```bash
   cd mobile
   eas build:configure
   ```
   This will update `eas.json` if needed (already configured in this project).

### Build APK

**For Preview/Testing APK:**
```bash
cd mobile
eas build --platform android --profile preview
```

**For Production APK:**
```bash
cd mobile
eas build --platform android --profile production
```

**Important:** Before building, update `mobile/app.json`:
```json
"extra": {
  "apiUrl": "http://YOUR_PRODUCTION_API_URL:8080"
}
```

Replace `YOUR_PRODUCTION_API_URL` with your production backend URL (e.g., `https://api.yourdomain.com` or your server's IP address).

### Build Process

1. **Wait for build to complete** (5-10 minutes)
   - Build happens on Expo's servers
   - You'll see progress in the terminal

2. **Download the APK**
   - You'll receive a download link when build completes
   - Or check: https://expo.dev/accounts/[your-account]/builds

3. **Install APK**
   - **Emulator:** Drag and drop the APK file onto the emulator window
   - **Physical device:** 
     - Transfer APK to device via USB, email, or cloud storage
     - Enable "Install from Unknown Sources" in Android settings
     - Open the APK file to install

### APK Verification Checklist

Before sharing the APK with your employer, verify:

- [ ] APK installs successfully on Android device/emulator
- [ ] App launches without crashes
- [ ] API base URL is correctly configured for production/employer's network
- [ ] Product list loads and displays correctly
- [ ] Product details screen works
- [ ] Adding a review works and refreshes the screen
- [ ] Review aggregation (average rating, count) updates correctly
- [ ] No console errors in development build
- [ ] App icon and splash screen display correctly

---

## 🔧 Troubleshooting

### Docker Issues

**Problem: "docker: command not found"**
- **Solution:** 
  - Docker is not installed or not in PATH
  - Install Docker Desktop (see Installation Guide above)
  - Verify: `docker --version`
  - **Alternative:** Use H2 database instead (no Docker needed) - see Step 2.5

**Problem: "Cannot connect to Docker daemon"**
- **Solution:**
  - Docker Desktop is not running
  - **Windows/Mac:** Launch Docker Desktop from Start Menu/Applications
  - Wait for Docker to fully start (whale icon should be visible)
  - Verify: `docker ps` should work without errors
  - **Linux:** Start Docker service: `sudo systemctl start docker`

**Problem: "Port 5432 is already allocated"**
- **Solution:**
  - Another service is using port 5432
  - **Windows:** Check what's using the port: `netstat -ano | findstr :5432`
  - **Mac/Linux:** Check: `lsof -i :5432` or `sudo netstat -tulpn | grep 5432`
  - Stop the conflicting service or change PostgreSQL port in `docker-compose.yml`

### Database Issues

**Problem: "Connection refused" when starting backend with postgres profile**
- **Solution:** 
  1. **First, verify Docker is running:**
     ```bash
     docker ps
     ```
     If this fails, Docker is not running - start Docker Desktop first.
  
  2. **Check if PostgreSQL container is running:**
     ```bash
     docker ps
     ```
     You should see `product-review-postgres` container. If not, start it:
     ```bash
     docker-compose up -d
     ```
  
  3. **Check container logs for errors:**
     ```bash
     docker-compose logs postgres
     ```
  
  4. **Verify port 5432 is accessible:**
     ```bash
     # Windows PowerShell
     Test-NetConnection -ComputerName localhost -Port 5432
     
     # Mac/Linux
     nc -zv localhost 5432
     ```

**Problem: DBeaver cannot connect to PostgreSQL**
- **Solution:**
  1. **Verify PostgreSQL container is running:**
     ```bash
     docker ps
     ```
     Container `product-review-postgres` must be running.
  
  2. **Check if port 5432 is exposed:**
     ```bash
     docker-compose ps
     ```
     Should show `0.0.0.0:5432->5432/tcp`
  
  3. **Test connection from command line:**
     ```bash
     # Windows (if you have psql installed)
     psql -h localhost -p 5432 -U $POSTGRES_USER -d $POSTGRES_DB
     
     # Or use Docker to test:
     docker exec -it product-review-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
     ```
  
  4. **Verify connection settings in DBeaver:**
     - Host: `localhost` (not `127.0.0.1` or IP address)
     - Port: `5432`
     - Database: Check `POSTGRES_DB` environment variable
     - Username: Check `POSTGRES_USER` environment variable
     - Password: Check `POSTGRES_PASSWORD` environment variable
  
  5. **Check Windows Firewall:**
     - Windows may block port 5432
     - Add exception for Docker or PostgreSQL
     - Or temporarily disable firewall to test
  
  6. **Restart PostgreSQL container:**
     ```bash
     docker-compose restart
     ```

**Problem: "Database does not exist"**
- **Solution:** 
  - Check `POSTGRES_DB` environment variable matches your database name
  - Restart container: `docker-compose down && docker-compose up -d`
  - Check container logs: `docker-compose logs postgres`

**Problem: Flyway migrations fail**
- **Solution:**
  - Check database is empty or migrations haven't run before
  - If needed, reset: `docker-compose down -v` (⚠️ deletes all data)
  - Then: `docker-compose up -d`
  - Wait for container to be healthy before starting backend

### Backend Issues

**Problem: "mvn: command not found"**
- **Solution:** Install Maven and add it to your PATH
- Windows: Add Maven `bin` folder to System Environment Variables → Path
- Mac/Linux: Install via homebrew (`brew install maven`) or download from Apache

**Problem: "java: command not found"**
- **Solution:** Install Java 17+ and verify with `java -version`

**Problem: Port 8080 already in use**
- **Solution:** 
  - Stop the application using port 8080
  - Or change the port in `backend/src/main/resources/application-postgres.properties`: `server.port=8081`

**Problem: Backend starts but API returns 404**
- **Solution:** Make sure you're accessing `http://localhost:8080/api/products` (with `/api` prefix)

**Problem: "Profile 'postgres' not found" or "Unknown lifecycle phase"**
- **Solution:** Make sure you're using the correct command with profile flag:
  ```powershell
  # Windows PowerShell (use quotes or environment variable)
  mvn spring-boot:run "-Dspring-boot.run.profiles=postgres"
  # OR
  $env:SPRING_PROFILES_ACTIVE="postgres"; mvn spring-boot:run
  
  # Mac/Linux Bash
  mvn spring-boot:run -Dspring-boot.run.profiles=postgres
  ```
  
  **Note:** PowerShell requires quotes around the `-D` parameter, or use the environment variable approach instead.

### Mobile App Issues

**Problem: "npm: command not found"**
- **Solution:** Install Node.js from nodejs.org

**Problem: "Cannot connect to backend"**
- **Solution:** 
  - Verify backend is running (`http://localhost:8080/api/products`)
  - Check API URL in `mobile/config/api.js`
  - For emulator: Should be `http://10.0.2.2:8080`
  - For Expo Go: Use your computer's IP address (both devices on same Wi-Fi)
  - Check Windows Firewall allows connections on port 8080

**Problem: "expo-constants module not found"**
- **Solution:** 
  ```bash
  cd mobile
  npm install
  ```

**Problem: Expo Go shows "Project is incompatible with this version of Expo Go"**
- **Solution:** The project uses Expo SDK 54. Make sure your Expo Go app is up to date. If the issue persists, use an emulator or build an APK.

**Problem: Product detail screen doesn't refresh after adding review**
- **Solution:** This should be fixed. The screen uses `useFocusEffect` to reload when returning from AddReview screen. If it doesn't work, check that you've installed dependencies: `npm install` in mobile directory.

**Problem: Build errors or dependency conflicts**
- **Solution:**
  ```bash
  cd mobile
  rm -rf node_modules package-lock.json
  npm install
  ```

**Problem: Emulator not starting**
- **Solution:**
  - Open Android Studio → AVD Manager
  - Create a new virtual device if you don't have one
  - Make sure you have enough disk space (emulators need ~2GB)

---

## 📚 Additional Resources

### API Documentation

The backend provides the following endpoints:

**Products:**
- `GET /api/products` - List all products (supports pagination, sorting, filtering)
  - Query params: `page`, `size`, `sortBy`, `sortDir`, `category`, `search`
- `GET /api/products/{id}` - Get product details with reviews

**Reviews:**
- `POST /api/reviews` - Create a new review
  - Body: `{ productId, comment, rating (1-5), reviewerName (optional) }`
- `GET /api/reviews/product/{productId}` - Get reviews for a product

### Database Information

**PostgreSQL (Production):**
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** Set via `POSTGRES_DB` environment variable
- **Username:** Set via `POSTGRES_USER` environment variable
- **Password:** Set via `POSTGRES_PASSWORD` environment variable
- **Tables:** `products`, `reviews`
- **Indexes:** Optimized for read-heavy patterns (product_id, created_at, category)

**H2 (Development - Optional):**
- **URL:** `http://localhost:8080/h2-console`
- **JDBC URL:** `jdbc:h2:mem:productreviewdb`
- **Username:** `sa`
- **Password:** (leave empty)

### Project Configuration

- **Backend port:** 8080 (configurable in `application-*.properties`)
- **API base path:** `/api`
- **Database profiles:** 
  - `dev` - H2 in-memory (data resets on restart)
  - `postgres` - PostgreSQL with Flyway migrations

---

## 🚫 Out of Scope

This project intentionally **does NOT include** the following features:

- ❌ **Authentication & Authorization** - No user login, JWT tokens, or session management
- ❌ **User Accounts or Roles** - No user registration, profiles, or role-based access
- ❌ **Payments or Checkout** - No payment processing, shopping cart, or order management
- ❌ **Admin Dashboard** - No admin interface, user management, or analytics dashboard

These features are explicitly excluded to keep the project focused on core backend logic, REST API design, data modeling, and mobile UI/UX.

---

## ✅ Quick Start Checklist

### Prerequisites Installation
- [ ] Java 17+ installed and verified (`java -version`)
- [ ] Maven 3.6+ installed and verified (`mvn --version`)
- [ ] Node.js 16+ installed and verified (`node --version`)
- [ ] Git installed and verified (`git --version`)
- [ ] (Optional) Docker Desktop installed and running (only if using PostgreSQL)
- [ ] (Optional) Android Studio installed (only if using Android emulator)

### Database Setup (Choose One)
- [ ] **Option A - PostgreSQL:** Docker Desktop running
- [ ] **Option A - PostgreSQL:** PostgreSQL started (`docker-compose up -d`)
- [ ] **Option A - PostgreSQL:** Container verified (`docker ps`)
- [ ] **Option B - H2:** Skipped Docker setup (will use H2 in Step 2.5)

### Backend Setup
- [ ] Navigated to `backend` directory
- [ ] Backend dependencies installed (`mvn clean install`)
- [ ] Backend server running:
  - [ ] PostgreSQL profile: `mvn spring-boot:run -Dspring-boot.run.profiles=postgres`
  - [ ] OR H2 profile: `mvn spring-boot:run -Dspring-boot.run.profiles=dev`
- [ ] Backend API accessible (`http://localhost:8080/api/products` shows JSON)

### Mobile Setup
- [ ] Navigated to `mobile` directory
- [ ] Mobile dependencies installed (`npm install`)
- [ ] API URL configured in `mobile/config/api.js` (if using physical device)
- [ ] Mobile development server running (`npm start`)
- [ ] App running on emulator or device

### Verification
- [ ] Can view product list
- [ ] Can view product details
- [ ] Can add reviews
- [ ] Reviews refresh automatically
- [ ] (Optional) Database accessible via DBeaver

---

## 🎓 Next Steps

Once the application is running:

1. Explore the codebase structure
2. Inspect database with DBeaver
3. Test on different devices/emulators
4. Build APK for distribution
5. Deploy backend to a cloud service (Heroku, AWS, etc.) for production APK

---

## 📝 Notes

- **Database:** PostgreSQL data persists in Docker volume. To reset: `docker-compose down -v`
- **Flyway Migrations:** Run automatically on backend startup with `postgres` profile
- **API URL:** Automatically detects emulator vs physical device, but may need manual IP for physical device
- **CORS:** Enabled for all origins in development (configure for production)
- **Mobile SDK:** Expo SDK 54

---

**Need help?** Check the individual README files in `backend/README.md` and `mobile/README.md` for more specific information.
