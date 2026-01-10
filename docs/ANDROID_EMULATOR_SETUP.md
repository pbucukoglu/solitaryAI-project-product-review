# Android Emulator Setup Guide

## Quick Start

You should have an Android emulator (AVD) configured in Android Studio.

### Starting the Emulator

**Option 1: From Command Line (PowerShell)**
```powershell
emulator -avd YOUR_AVD_NAME
```

**Option 2: From Android Studio**
1. Open Android Studio
2. Click on "Device Manager" (or "More Actions" → "Virtual Device Manager")
3. Find your AVD in the list
4. Click the ▶️ play button
5. Wait for emulator to boot (1-2 minutes)

### Running Expo App on Emulator

Once the emulator is running:

1. **Start Expo development server:**
   ```powershell
   cd mobile
   npm start
   ```

2. **Press `a` in the terminal** when you see the Expo menu, OR

3. **Run directly:**
   ```powershell
   cd mobile
   npx expo start --android
   ```

The app will automatically:
- Detect the running emulator
- Install Expo Go (if needed)
- Launch the app
- Use API URL: `http://10.0.2.2:8080` (automatically configured)

### Verifying Emulator is Running

Check if emulator is running:
```powershell
adb devices
```

You should see:
```
List of devices attached
emulator-5554    device
```

If you see "device", the emulator is ready! ✅

### Troubleshooting

**Emulator won't start:**
- Make sure Android Studio is closed (or emulator is not already running)
- Check if virtualization is enabled in BIOS (Intel VT-x or AMD-V)
- Try restarting Android Studio

**Expo can't find emulator:**
- Make sure emulator is fully booted (wait for home screen)
- Run `adb devices` to verify connection
- Try: `adb kill-server` then `adb start-server`

**App won't connect to backend:**
- Make sure backend is running on port 8080
- The emulator automatically uses `http://10.0.2.2:8080` (no configuration needed)
- Check backend logs to see if requests are coming through

### Creating a New Emulator (Optional)

If you need a different emulator:

1. Open Android Studio
2. Go to "Device Manager" (or "More Actions" → "Virtual Device Manager")
3. Click "Create Device"
4. Select a device (e.g., Pixel 5, Pixel 6)
5. Select a system image (API 33 or 34 recommended)
6. Click "Finish"

### Performance Tips

- **Allocate more RAM:** In AVD settings, increase RAM to 2-4GB
- **Use x86_64 images:** Faster than ARM images
- **Enable hardware acceleration:** In AVD settings → Advanced → Graphics: Hardware - GLES 2.0

---

**Your current setup:**
- ✅ Android SDK installed
- ✅ ADB working
- ✅ Emulator configured: YOUR_AVD_NAME
- ✅ Ready to run Expo app!

