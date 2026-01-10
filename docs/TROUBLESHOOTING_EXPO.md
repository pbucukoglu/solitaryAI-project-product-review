# 🔧 Troubleshooting Expo Connection Issues

## Problem: Expo Go cannot connect to backend (timeout error)

### Quick Fixes

1. **Clear Expo Cache and Restart:**
   ```powershell
   cd mobile
   # Stop Expo (Ctrl+C)
   # Clear cache
   npx expo start --clear
   ```

2. **Verify API URL in Console:**
   - When Expo starts, check the console output
   - You should see: `API Base URL: http://YOUR_COMPUTER_IP:8080`
   - If you see a different URL, the config didn't load

3. **Reload Expo Go App:**
   - Shake your phone (or press menu button)
   - Tap "Reload" 
   - OR close Expo Go completely and reopen it
   - Scan QR code again

4. **Check Backend is Accessible:**
   - On your phone's browser, open: `http://YOUR_COMPUTER_IP:8080/api/products`
   - You should see JSON data
   - If not, backend or network issue

5. **Verify Same Wi-Fi Network:**
   - Phone and computer must be on the same Wi-Fi
   - Check phone's Wi-Fi settings
   - Check computer's Wi-Fi: `ipconfig` (should show same network)

6. **Windows Firewall:**
   ```powershell
   # Temporarily disable to test (NOT recommended for production)
   netsh advfirewall set allprofiles state off
   
   # OR add firewall rule (recommended)
   netsh advfirewall firewall add rule name="Spring Boot Backend" dir=in action=allow protocol=TCP localport=8080
   ```

### Common Issues

**Issue: API URL shows `http://10.0.2.2:8080` on physical device**
- **Solution:** `PHYSICAL_DEVICE_IP` in `mobile/config/api.js` is not set correctly
- Update it with your computer's IP: `const PHYSICAL_DEVICE_IP = 'YOUR_COMPUTER_IP';`

**Issue: "Network request failed"**
- Backend is not running
- Firewall blocking port 8080
- Phone and computer on different networks

**Issue: "timeout of 10000ms exceeded"**
- Backend is too slow to respond
- Network connectivity issue
- Increase timeout in `mobile/services/api.js` (line 9)

