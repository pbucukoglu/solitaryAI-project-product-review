# Demo Mode Guide

## Overview

The Product Review App includes a comprehensive **offline-first demo mode** that automatically activates when the backend API is unreachable. This ensures the app remains fully functional for demonstrations and testing, even without network connectivity.

## How Demo Mode Works

### Automatic Fallback
- **API Timeout**: All API calls have a 7-second timeout
- **Graceful Degradation**: When API calls fail, the app automatically switches to demo mode
- **Seamless UX**: Users see a non-intrusive banner indicating demo mode is active
- **Persistent State**: Demo mode preference is saved and persists across app restarts

### Visual Indicators
When in demo mode, you'll see:
- **Demo Banner**: Yellow banner at the top with "Demo mode — showing sample data (offline)"
- **Try Again Button**: Allows users to attempt reconnection to live API
- **Consistent UI**: All features remain functional with demo data

## Features Available in Demo Mode

### ✅ Fully Functional
- **Product browsing** with 12 realistic demo products
- **Product filtering** (category, rating, price range)
- **Product sorting** (newest, price, rating, name)
- **Search functionality** (multi-term, case-insensitive)
- **Image galleries** with swipeable carousels
- **Review system** (add, edit, delete reviews)
- **Rating distribution charts**
- **Favorites/wishlist** functionality
- **Relative time display** for reviews

### 🔄 Automatic Reconnection
- When network connectivity is restored, tap "Try again" in the demo banner
- The app tests the connection and switches back to live API if successful
- All demo data is replaced with live data

## Base URL Configuration

### Accessing Settings
1. Open the app
2. Tap the **settings icon** (⚙️) in the top-right corner of the Product List screen
3. This opens the Settings screen

### Configuring Base URL
1. **Current URL**: Displays the currently configured backend URL
2. **Input Field**: Enter your backend URL (e.g., `http://YOUR_COMPUTER_IP:8080`)
3. **Test Connection**: Validates the URL and shows connection status
   - 🟢 Green checkmark = Connection successful
   - 🔴 Red X = Connection failed
4. **Save URL**: Persists the URL to device storage
5. **Reset to Default**: Resets to `http://localhost:8080`

### URL Format Tips
- **Local Development**: `http://localhost:8080` or `http://127.0.0.1:8080`
- **Network Device**: `http://YOUR_COMPUTER_IP:8080`
- **Production**: `https://your-api-domain.com`
- **No trailing slash**: Don't end URLs with `/`

## Testing Offline Functionality

### Quick Test (Airplane Mode)
1. **Start the app** with network connectivity
2. **Enable airplane mode** on your device
3. **Navigate the app** - it will automatically switch to demo mode
4. **Test all features** - they should work with demo data
5. **Disable airplane mode** and tap "Try again" to reconnect

### Network Simulation
1. **Configure an invalid base URL** in Settings
2. **Test connection** - it should fail
3. **Use the app** - demo mode activates automatically
4. **Fix the URL** and test connection again
5. **Tap "Try again"** to restore live functionality

## Demo Data Details

### Products
- **12 realistic products** across 6 categories
- **Multiple images** per product (3-5 URLs)
- **Realistic pricing** and descriptions
- **Varied ratings** and review counts

### Categories
- Electronics (MacBook Pro, Sony Headphones, iPad Air, Galaxy Watch)
- Clothing (Levi's Jeans, Winter Jacket)
- Books (The Great Gatsby, Atomic Habits)
- Home & Kitchen (Instant Pot, Coffee Maker)
- Sports & Outdoors (Nike Shoes, Yoga Mat)

### Reviews
- **Realistic review content** with varied ratings
- **Relative timestamps** (e.g., "2 days ago", "3 weeks ago")
- **Device-based ownership** for edit/delete functionality
- **Rating distribution** matching real-world patterns

## Technical Implementation

### API Service Layer
- **7-second timeout** on all API calls
- **Automatic fallback** to demo data on failure
- **Demo mode state management** via AsyncStorage
- **Connection testing** with health check endpoint

### Data Management
- **In-memory demo data** for immediate access
- **Local state updates** for reviews (adds/edits/deletes)
- **Automatic recalculation** of product ratings
- **Persistent favorites** via AsyncStorage

### Error Handling
- **Silent fallback** - no error dialogs for demo mode
- **Clear user feedback** via demo banner
- **Retry mechanisms** for reconnection attempts
- **Graceful degradation** of features

## Troubleshooting

### Demo Mode Won't Activate
- **Check network connectivity** - demo mode only activates when API fails
- **Verify timeout** - ensure API calls are timing out (7 seconds)
- **Test with invalid URL** - configure an invalid base URL to force demo mode

### Can't Reconnect to Live API
- **Verify base URL** is correct and accessible
- **Check network connectivity** - ensure device has internet access
- **Test connection manually** - use the "Test Connection" button in Settings
- **Restart the app** - sometimes a fresh start helps

### Demo Data Issues
- **Restart the app** - resets demo data to original state
- **Clear app cache** - resolves corrupted data issues
- **Check storage permissions** - ensure AsyncStorage is working

## Development Notes

### Adding New Demo Products
Edit `mobile/data/demoData.js`:
```javascript
export const demoProducts = [
  // Add new products here
  {
    id: 13,
    name: "New Product",
    description: "Product description",
    category: "Electronics",
    price: 99.99,
    averageRating: 4.2,
    reviewCount: 25,
    imageUrls: ["https://example.com/image1.jpg"]
  }
];
```

### Customizing Demo Mode
- **Modify timeout** in `mobile/services/api.js` (currently 7000ms)
- **Change banner styling** in `mobile/components/DemoBanner.js`
- **Adjust fallback logic** in `mobile/services/demoService.js`

## Summary

The demo mode provides a **complete, production-ready offline experience** that:
- ✅ Works without any backend connectivity
- ✅ Maintains full feature parity with live mode
- ✅ Provides smooth transitions between online/offline states
- ✅ Offers easy configuration for different environments
- ✅ Includes realistic data for demonstrations and testing

This makes the app ideal for:
- **Client demonstrations** without network dependencies
- **Development and testing** in various network conditions
- **Offline scenarios** and poor connectivity environments
- **Quick setup** without requiring backend infrastructure
