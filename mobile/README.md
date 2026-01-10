# Product Review Mobile App

React Native mobile application for the Product Review system.

## Prerequisites

- Node.js 18+
- npm
- Expo Go (for quick testing) or Android/iOS simulator

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API URL (recommended)

The app reads the backend base URL from `app.json`:

- `expo.extra.apiUrl`

Example:

- Local: `http://YOUR_COMPUTER_IP:8080`
- Production: `https://your-api-domain.com`

Tip:

- If you run on an Android emulator, set `expo.extra.apiUrl` to `http://10.0.2.2:8080`

3. Start the backend server first (see backend README)

4. Run the app:
```bash
npm start
```

Then press `a` for Android or `i` for iOS.

## Building APK

To build an APK for Android:

1. Install Expo CLI globally (if not already):
```bash
npm install -g expo-cli
```

2. Build APK:
```bash
npx expo build:android -t apk
```

Or use EAS Build (recommended):
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

For production builds, make sure `app.json` has the correct `expo.extra.apiUrl`.

## Languages (i18n)

The app supports:

- English (en)
- Turkish (tr)
- Spanish (es)

Language can be changed from the Settings screen and is persisted.

## Demo Mode (Offline)

If the backend API is unreachable, the app automatically falls back to a full offline demo mode.

Behavior:

- The app shows a banner indicating demo mode is active
- Product browsing, filters, favorites, and review interactions remain usable using local demo data
- When the backend becomes reachable again, you can retry and switch back to live data

## Android Emulator

- Start the Expo dev server: `npm start`
- Press `a` to open on Android

## Troubleshooting

### Expo Go cannot connect to backend

Checklist:

- Confirm backend is reachable from the device network
- Ensure `expo.extra.apiUrl` is set correctly (no trailing slash)
- If using a physical device, use your computer IP (same Wi-Fi)
- Windows Firewall must allow inbound TCP on port 8080

If you suspect stale cache:

- Restart Expo with cache clear: `npx expo start --clear`

## Development

- The app uses React Navigation for screen navigation
- Fetch-based API wrapper is used for API calls (with safe JSON parsing and timeouts)
- All screens are in the `screens/` directory
- API base URL configuration is in `app.json` and `config/api.js`
