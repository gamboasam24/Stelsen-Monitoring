This document has been replaced with a redirect stub.
See the archived copy at [docs/archived_docs/MAPBOX_SETUP_GUIDE.md](docs/archived_docs/MAPBOX_SETUP_GUIDE.md).

## ✅ What Was Changed

### 1. **Replaced Google Maps with Mapbox**
   - Removed: `@react-google-maps/api`
   - Using: `react-map-gl` + `mapbox-gl` (already installed in package.json)

### 2. **Code Changes in user-dashboard.jsx**
   - ✅ Changed imports from Google Maps to Mapbox
   - ✅ Updated state from `center` to `viewState` (Mapbox format)
   - ✅ Replaced GoogleMap component with Map component
   - ✅ Added custom marker design (blue circle)
   - ✅ Added NavigationControl (zoom buttons)
   - ✅ Added GeolocateControl (location tracking)

---

## 🔑 Get Your Mapbox Access Token

### Step 1: Create a Mapbox Account
1. Go to [https://www.mapbox.com/](https://www.mapbox.com/)
2. Click **"Sign Up"** (top right)
3. Create a free account (no credit card required for free tier)

### Step 2: Get Your Access Token
1. After signing in, you'll be redirected to your dashboard
2. Your **default public token** will be visible immediately
3. OR go to: [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
4. Copy the **Default public token** (starts with `pk.`)

### Step 3: Add Token to Your Project
1. Open the `.env` file in the root directory
2. Add this line:
   ```
   VITE_MAPBOX_ACCESS_TOKEN=pk.YOUR_TOKEN_HERE
   ```
3. Replace `pk.YOUR_TOKEN_HERE` with your actual token

**Example .env file:**
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAYzhIFa-neVj9mg5scI-UeOZdG2qXw_mg
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZXhhbXBsZSJ9.example_token_string
```

---

## 🚀 Run the Application

1. **Stop the current dev server** (if running)
   - Press `Ctrl + C` in the terminal

2. **Restart the development server:**
   ```bash
   npm run dev
   ```

3. **Test the Map:**
   - Open the app in your browser
   - Navigate to **"My Location"** tab
   - The Mapbox map should load with:
     - ✅ Blue marker at your location
     - ✅ Zoom controls (top-right)
     - ✅ Location button (top-right)

---

## 🎨 Mapbox Features Now Available

### 1. **Custom Marker**
   - Blue circle with white center
   - Cleaner than default Google marker

### 2. **Navigation Controls**
   - Zoom in/out buttons
   - Positioned at top-right

### 3. **Geolocate Control**
   - Automatically find user's location
   - Track location in real-time
   - Click the location button to recenter

### 4. **Map Style**
   - Currently using: `streets-v12` (clean street map)
   - You can change to:
     - `mapbox://styles/mapbox/dark-v11` (dark theme)
     - `mapbox://styles/mapbox/light-v11` (light theme)
     - `mapbox://styles/mapbox/satellite-v9` (satellite view)
     - `mapbox://styles/mapbox/outdoors-v12` (outdoor/terrain)

---

## 🔧 Customization Options

### Change Map Style
In `user-dashboard.jsx`, find this line:
```jsx
mapStyle="mapbox://styles/mapbox/streets-v12"
```

Replace with your preferred style:
```jsx
// Dark theme
mapStyle="mapbox://styles/mapbox/dark-v11"

// Satellite view
mapStyle="mapbox://styles/mapbox/satellite-v9"

// Light theme
mapStyle="mapbox://styles/mapbox/light-v11"
```

### Customize Marker Color
Find the marker div and change the colors:
```jsx
<div className="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg">
  <div className="w-3 h-3 bg-white rounded-full"></div>
</div>
```

Change `bg-blue-500` to:
- `bg-red-500` (red marker)
- `bg-green-500` (green marker)
- `bg-purple-500` (purple marker)
- etc.

### Adjust Initial Zoom Level
In the `viewState` object:
```jsx
const [viewState, setViewState] = useState({
  longitude: 120.9842,
  latitude: 14.5995,
  zoom: 15  // Change this (10 = city level, 15 = street level, 18 = building level)
});
```

---

## 📊 Mapbox Free Tier Limits

✅ **What's Free:**
- 50,000 free map loads per month
- Unlimited map views for mobile apps
- Access to all map styles
- Geocoding API: 100,000 requests/month
- Directions API: 300,000 requests/month

❌ **Paid Features (not needed for this app):**
- Beyond 50,000 loads: $0.30-$5 per 1,000 loads
- Premium map styles
- Advanced routing

**For your monitoring app, the free tier is MORE than enough!**

---

## 🐛 Troubleshooting

### Problem: Map doesn't load / Shows blank screen
**Solution:**
1. Check that `.env` file has the token
2. Restart dev server (`npm run dev`)
3. Clear browser cache (Ctrl + Shift + Delete)
4. Check console for errors (F12)

### Problem: "Invalid access token"
**Solution:**
1. Verify token starts with `pk.`
2. Make sure there are no extra spaces in `.env`
3. Token must be on the Mapbox website under "Access Tokens"

### Problem: Map loads but no marker
**Solution:**
1. Allow location access in browser
2. Check browser console for geolocation errors
3. Try clicking the location button (top-right)

### Problem: Map is too zoomed in/out
**Solution:**
- Adjust the `zoom` value in `viewState` (10-18 range)

---

## 📝 Benefits of Mapbox vs Google Maps

| Feature | Google Maps | Mapbox |
|---------|------------|--------|
| **Free Tier** | 28,000 loads/month | 50,000 loads/month |
| **Customization** | Limited | Highly customizable |
| **Performance** | Good | Excellent |
| **Mobile-friendly** | Yes | Yes (optimized) |
| **Offline Support** | No | Yes (with SDK) |
| **Vector Tiles** | No | Yes (faster) |
| **Dark Mode** | No | Built-in |

---

## 🎯 Next Steps (Optional Enhancements)

1. **Add Location History Markers:**
   ```jsx
   {locationHistory.map(loc => (
     <Marker 
       key={loc.id}
       longitude={loc.longitude} 
       latitude={loc.latitude}
     >
       <div className="w-4 h-4 bg-gray-400 rounded-full" />
     </Marker>
   ))}
   ```

2. **Add Popup on Marker Click:**
   ```jsx
   import { Popup } from 'react-map-gl';
   ```

3. **Draw Routes Between Locations:**
   Use Mapbox Directions API

4. **Add 3D Buildings:**
   ```jsx
   mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
   ```

---

## 📚 Useful Links

- [Mapbox Documentation](https://docs.mapbox.com/)
- [react-map-gl Examples](https://visgl.github.io/react-map-gl/examples)
- [Mapbox Studio (Custom Styles)](https://studio.mapbox.com/)
- [Map Styles Gallery](https://www.mapbox.com/maps)

---

## ✅ Summary

You've successfully migrated from Google Maps to Mapbox! The implementation includes:
- ✅ Better free tier (50k vs 28k loads)
- ✅ Cleaner, customizable UI
- ✅ Better performance with vector tiles
- ✅ Built-in dark mode support
- ✅ More control over styling

**Your map is now ready to use!** 🎉
