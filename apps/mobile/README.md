# SOFO Sync - Mobile Guide 📱

SOFO Sync is designed for instant cross-device pairing between PC/Laptop and Mobile phones.

---

## ⚡ Method 1: Instant Mobile Web & Camera Scan (No Installation Needed)

The easiest way to use SOFO Sync on any iPhone or Android phone without installing any app:

### Steps:
1. Make sure your Mobile phone and PC/Laptop are connected to the **same Wi-Fi network**.
2. On your Laptop/PC, open **[http://localhost:3000](http://localhost:3000)** and click **"📱 1. Generate QR Code"**.
3. On your Mobile phone browser, open **`http://<YOUR_PC_IP>:3000`** (e.g. `http://192.168.1.5:3000`).
4. Tap **"📷 2. Camera Scan"** on your mobile screen -> Tap **"📷 Start Camera Scanner"**.
5. Point your mobile phone camera at the QR Code displayed on your PC screen!
6. **Done!** Devices are instantly linked & authenticated with real-time Whiteboard touch drawing, collaborative docs, file vault, and AI copilot.

---

## 📱 Method 2: React Native / Expo Native Mobile App (`@sofo-sync/mobile`)

If you want to run the native Android / iOS application package inside `apps/mobile`:

### Prerequisites:
- Install **Expo Go** app on your phone from App Store or Google Play Store.

### Commands:
```bash
# Navigate to mobile package
cd apps/mobile

# Start Expo dev server
npx expo start
```

Scan the printed Expo QR code using the Expo Go app to launch the native SOFO Sync mobile client.
