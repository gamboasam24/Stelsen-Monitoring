# 🚀 Quick Start: Mapbox Integration

## Step 1: Get Your Mapbox Token (2 minutes)

1. Go to: https://account.mapbox.com/access-tokens/
2. Sign up for free (no credit card needed)
3. Copy your **Default Public Token** (starts with `pk.`)

---

## Step 2: Add Token to .env File

Open `.env` file and add:

```env
VITE_MAPBOX_ACCESS_TOKEN=pk.YOUR_ACTUAL_TOKEN_HERE
```

**Example:**
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAYzhIFa-neVj9mg5scI-UeOZdG2qXw_mg
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZXhhbXBsZSJ9.example
```

---

## Step 3: Restart Server

```bash
npm run dev
```

**That's it!** 🎉 Navigate to "My Location" tab and the Mapbox map will load.

---

## ✅ What You Get

- ✅ **Better free tier:** 50,000 map loads/month (vs Google's 28,000)
- ✅ **Cleaner UI:** Custom blue marker with controls
- ✅ **Navigation controls:** Zoom in/out buttons
- ✅ **Location tracking:** Auto-locate button
- ✅ **Better performance:** Vector tiles load faster
- ✅ **Dark mode ready:** Multiple built-in themes

---

## 🎨 Quick Customizations

### Change Map Theme
In `user-dashboard.jsx`, find:
```jsx
mapStyle="mapbox://styles/mapbox/streets-v12"
```

Replace with:
- `dark-v11` - Dark theme
- `satellite-v9` - Satellite view
- `light-v11` - Light theme
- `outdoors-v12` - Terrain/outdoor

---

For detailed documentation, see [MAPBOX_SETUP_GUIDE.md](./MAPBOX_SETUP_GUIDE.md)