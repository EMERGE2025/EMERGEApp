# 📱 EMERGE PWA (Progressive Web App) Setup Complete!

Your application is now installable as a Progressive Web App! Users can install it on their devices for a native app-like experience.

## ✅ What's Been Configured

### 1. **PWA Package Installation**
- ✅ `next-pwa` installed and configured
- ✅ Service worker will be generated automatically on production build

### 2. **Web App Manifest**
- ✅ `public/manifest.json` created with app metadata
- ✅ Includes app name, description, icons, theme colors
- ✅ Shortcuts for quick access to Risk Map and Admin Dashboard

### 3. **App Icons Generated**
- ✅ `icon-192x192.png` (192x192px)
- ✅ `icon-256x256.png` (256x256px)
- ✅ `icon-384x384.png` (384x384px)
- ✅ `icon-512x512.png` (512x512px)

All icons were generated from your `logo.svg` file.

### 4. **Layout Metadata**
- ✅ PWA meta tags added to `layout.tsx`
- ✅ Apple mobile web app support
- ✅ Theme color configuration (#B92727)
- ✅ Manifest link added

### 5. **Install Prompt Component**
- ✅ Custom install prompt (`InstallPrompt.tsx`) added
- ✅ Shows when app is installable
- ✅ Auto-hides if already installed
- ✅ Positioned above bottom navigation bar

### 6. **Next.js Configuration**
- ✅ `next.config.ts` updated with PWA support
- ✅ Service worker generation configured
- ✅ PWA disabled in development (for easier debugging)

## 🧪 Testing Your PWA

### Local Testing (Development)

```bash
# PWA is disabled in development mode
npm run dev
```

### Production Testing (Required for PWA features)

```bash
# Build the production version
npm run build

# Start the production server
npm start
```

Then open: `http://localhost:3000`

### Testing Installation

#### On Desktop (Chrome/Edge):
1. Open your app in Chrome or Edge
2. Look for the **install icon** (➕ or download icon) in the address bar
3. Click it to install
4. Or use the install banner that appears
5. The app will be installed and can be launched from:
   - Desktop shortcut
   - Start menu (Windows)
   - Applications folder (macOS)
   - Chrome apps (chrome://apps)

#### On Mobile (Android):
1. Open your app in Chrome
2. Tap the **menu icon** (⋮)
3. Select **"Add to Home Screen"** or **"Install app"**
4. Confirm installation
5. App icon will appear on your home screen

#### On Mobile (iOS/Safari):
1. Open your app in Safari
2. Tap the **Share button** (□↑)
3. Scroll and tap **"Add to Home Screen"**
4. Confirm by tapping **"Add"**
5. App icon will appear on your home screen

## 🎨 Features

### Installed App Benefits:
- ✅ **Standalone window** - Runs in its own window without browser UI
- ✅ **Home screen icon** - Quick access like native apps
- ✅ **Offline support** - Basic offline functionality via service worker
- ✅ **Fast loading** - Cached resources for faster startup
- ✅ **App shortcuts** - Jump directly to Risk Map or Admin Dashboard

### Custom Install Prompt:
- Shows automatically when the app is installable
- Can be dismissed temporarily (won't show for 30 days)
- User preference stored in localStorage
- Won't show again if app is already installed
- Matches your app's theme (#B92727)
- Automatically re-appears after 30 days if not installed

## 📝 PWA Files Structure

```
public/
├── manifest.json          # PWA manifest with app metadata
├── icon-192x192.png       # Small icon
├── icon-256x256.png       # Medium icon
├── icon-384x384.png       # Large icon
├── icon-512x512.png       # Extra large icon
├── sw.js                  # Service worker (auto-generated)
└── workbox-*.js           # Workbox files (auto-generated)

src/
├── app/
│   └── layout.tsx         # Updated with PWA metadata
└── components/
    └── InstallPrompt.tsx  # Custom install UI
```

## 🔧 Customization

### Update App Name/Description
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Short Name",
  "description": "Your app description"
}
```

### Change Theme Color
Edit `public/manifest.json`:
```json
{
  "theme_color": "#B92727",
  "background_color": "#ffffff"
}
```

### Disable Install Prompt
Remove `<InstallPrompt />` from `src/app/layout.tsx`

### Change Dismiss Duration
Edit `DISMISS_DURATION` in `src/components/InstallPrompt.tsx`:
```typescript
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
// Or
const DISMISS_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (default)
```

### Clear User Preference (for testing)
Open browser console and run:
```javascript
localStorage.removeItem('pwa-install-dismissed');
```

### Add More Shortcuts
Edit the `shortcuts` array in `public/manifest.json`

## 📱 Screenshots (Optional)

For a better install experience, you can add screenshots:

1. Take screenshots of your app:
   - Desktop: 1280x720px → save as `screenshot-wide.png`
   - Mobile: 750x1334px → save as `screenshot-mobile.png`

2. Place them in the `/public` folder

3. They're already configured in `manifest.json`

## 🚀 Deployment

When deploying to production (Vercel, Netlify, etc.):

1. The service worker will be generated automatically
2. PWA features will be enabled
3. Users will see the install prompt
4. App will be installable

### Important Notes:
- ✅ HTTPS is required for PWA (handled by hosting platforms)
- ✅ Service worker only works in production builds
- ✅ PWA files are gitignored (they're auto-generated)

## 🐛 Troubleshooting

### Install button not showing?
- Make sure you're running a **production build** (`npm run build && npm start`)
- Check that you're using **HTTPS** (or localhost)
- Open DevTools → Application → Manifest to check for errors
- Make sure icons exist and are the correct sizes

### App not working offline?
- Service worker needs time to cache resources
- Visit the app once online, then try offline
- Check DevTools → Application → Service Workers

### Changes not appearing?
- Clear service worker cache: DevTools → Application → Clear storage
- Do a hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Unregister old service worker and reinstall

## 📚 Resources

- [Next.js PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [PWA Builder](https://www.pwabuilder.com/) - Test your PWA
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Audit PWA quality

## ✨ What's Next?

Your app is now installable! Users can:
- Install it on their devices
- Launch it like a native app
- Access it quickly from their home screen
- Use it with basic offline support

Enjoy your new Progressive Web App! 🎉
