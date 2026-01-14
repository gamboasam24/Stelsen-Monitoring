# 📍 Location Tracking with Profile Image Marker - Implementation Guide

## ✅ What Was Implemented

### 1. **Database Table: `user_locations`**
   - Stores each user's location (longitude, latitude)
   - Tracks location name and timestamps
   - Automatically created on first use

### 2. **Backend API: `location.php`**
   - **POST**: Save/Update user location
   - **GET**: Retrieve user location(s)
   - Admin can view all users' locations
   - Users can only view their own location

### 3. **Frontend Map Updates**
   - Profile image appears as location marker
   - Pulsing blue radar effect around marker
   - Automatically saves location to database
   - Fallback to initial letter if no profile image

---

## 🗄️ Database Setup

### Option 1: Automatic (Recommended)
The table is **automatically created** when you first access the location feature. No manual setup needed!

### Option 2: Manual Setup
If you prefer to create it manually, run this SQL:

```sql
CREATE TABLE IF NOT EXISTS user_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    location_name VARCHAR(255) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES login(login_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Or import the SQL file:
```bash
mysql -u your_username -p your_database < create_user_locations_table.sql
```

---

## 🎨 How It Works

### 1. **Profile Image Marker**
When you open the "My Location" tab:
- ✅ Your profile image appears as a circular marker
- ✅ Blue pulsing radar effect surrounds it
- ✅ If no profile image: Shows first letter of your email
- ✅ Marker updates when you move

### 2. **Location Tracking**
- **On Page Load**: Automatically gets your current location and saves it
- **Manual Update**: Click the location button (top-right) to update
- **Continuous**: Location saves every time you use the GeolocateControl

### 3. **Data Stored**
Each location record includes:
- User ID
- Longitude (decimal, 7 places)
- Latitude (decimal, 7 places)
- Location name (optional)
- Timestamps (created_at, updated_at)

---

## 🔧 API Endpoints

### Save/Update Location
```javascript
POST /backend/location.php
Content-Type: application/json

{
  "longitude": 120.9842,
  "latitude": 14.5995,
  "location_name": "Office" // optional
}

Response:
{
  "status": "success",
  "message": "Location updated",
  "data": {
    "longitude": 120.9842,
    "latitude": 14.5995,
    "location_name": "Office"
  }
}
```

### Get Your Location
```javascript
GET /backend/location.php

Response:
{
  "status": "success",
  "location": {
    "id": 1,
    "user_id": 5,
    "longitude": 120.9842,
    "latitude": 14.5995,
    "location_name": "Office",
    "updated_at": "2026-01-14 08:45:00",
    "email": "user@example.com",
    "profile_image": "data:image/jpeg;base64,..."
  }
}
```

### Get Specific User Location (Admin Only)
```javascript
GET /backend/location.php?user_id=5

Response: (same as above)
```

### Get All Users' Locations (Admin Only)
```javascript
GET /backend/location.php?user_id=all

Response:
{
  "status": "success",
  "locations": [
    {
      "id": 1,
      "user_id": 5,
      "longitude": 120.9842,
      "latitude": 14.5995,
      "location_name": "Office",
      "updated_at": "2026-01-14 08:45:00",
      "email": "user1@example.com",
      "profile_image": "..."
    },
    {
      "id": 2,
      "user_id": 6,
      "longitude": 121.0123,
      "latitude": 14.6234,
      "location_name": "Site A",
      "updated_at": "2026-01-14 08:50:00",
      "email": "user2@example.com",
      "profile_image": "..."
    }
  ]
}
```

---

## 🎯 Features

### ✅ User Features
1. **Profile Image as Marker**: Your photo shows on the map
2. **Radar Effect**: Pulsing blue circle for visibility
3. **Auto-Save**: Location automatically saved on page load
4. **Manual Update**: Click locate button to refresh position
5. **Privacy**: Can only see your own location

### ✅ Admin Features
1. **View All Users**: See all team members' locations
2. **Real-time Updates**: Locations update when users move
3. **Profile Integration**: Each marker shows user's profile image
4. **Location History**: Track when users updated their location

---

## 🔒 Security Features

1. **Authentication Required**: Must be logged in
2. **User Isolation**: Regular users can only access their own location
3. **Admin Privileges**: Only admins can view all locations
4. **Foreign Key Constraints**: Automatic cleanup when user is deleted
5. **Prepared Statements**: SQL injection protection

---

## 🎨 Customization

### Change Marker Size
In `user-dashboard.jsx`, find the marker code and adjust:
```jsx
className="w-12 h-12"  // Change to w-16 h-16 for larger
```

### Change Radar Color
Find the radar div:
```jsx
bg-blue-500  // Change to bg-green-500, bg-red-500, etc.
```

### Disable Radar Effect
Remove or comment out this line:
```jsx
<div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-500 opacity-30 animate-ping"></div>
```

### Add Location Name
When updating location, include a name:
```javascript
saveLocationToBackend(longitude, latitude, "Office Building");
```

---

## 🧪 Testing

### Test 1: Profile Image Marker
1. Go to "My Location" tab
2. Your profile image should appear as a marker
3. Blue radar should pulse around it

### Test 2: Location Save
1. Open browser console (F12)
2. Go to "My Location" tab
3. Look for: `Location saved: {status: "success", ...}`
4. Check database: `SELECT * FROM user_locations;`

### Test 3: Location Update
1. Click the locate button (top-right, compass icon)
2. Move around or change device location
3. Console should show: `Location saved:...`
4. Database should update with new coordinates

### Test 4: Admin View All (Admin Only)
```javascript
// In admin dashboard, add this test:
fetch('/backend/location.php?user_id=all', {
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log('All locations:', data));
```

---

## 📊 Database Queries

### View All Locations
```sql
SELECT 
    ul.*,
    l.email,
    l.profile_image IS NOT NULL as has_profile_image
FROM user_locations ul
JOIN login l ON ul.user_id = l.login_id
ORDER BY ul.updated_at DESC;
```

### Find Users Near a Location
```sql
SELECT 
    l.email,
    ul.longitude,
    ul.latitude,
    ul.location_name,
    ul.updated_at,
    (6371 * acos(cos(radians(14.5995)) 
        * cos(radians(ul.latitude)) 
        * cos(radians(ul.longitude) - radians(120.9842)) 
        + sin(radians(14.5995)) 
        * sin(radians(ul.latitude)))) AS distance_km
FROM user_locations ul
JOIN login l ON ul.user_id = l.login_id
HAVING distance_km < 5
ORDER BY distance_km;
```

### Location Update History
```sql
-- Note: Current implementation only stores latest location per user
-- To track history, you'd need to remove the WHERE clause in UPDATE
-- and always INSERT new records
```

---

## 🚀 Future Enhancements (Optional)

### 1. **Location History Trail**
Show user's path over time:
```jsx
<Source type="geojson" data={pathData}>
  <Layer type="line" paint={{ "line-color": "#0000ff" }} />
</Source>
```

### 2. **Multiple Users on Admin Map**
Show all team members at once:
```jsx
{allUserLocations.map(loc => (
  <Marker key={loc.user_id} longitude={loc.longitude} latitude={loc.latitude}>
    <img src={loc.profile_image} className="w-8 h-8 rounded-full" />
  </Marker>
))}
```

### 3. **Geofencing**
Alert when users enter/leave specific areas:
```javascript
const isInGeofence = (lat, lng, centerLat, centerLng, radiusKm) => {
  // Calculate distance and check if within radius
};
```

### 4. **Location Sharing**
Allow users to share their location with specific team members

### 5. **Offline Support**
Cache last known location using localStorage

---

## 📝 Summary

✅ **Database**: `user_locations` table (auto-created)
✅ **Backend**: `location.php` API (POST to save, GET to retrieve)
✅ **Frontend**: Profile image marker with radar effect
✅ **Security**: User isolation + admin privileges
✅ **Features**: Auto-save + manual update + real-time tracking

**Your location tracking system is now fully operational!** 🎉
