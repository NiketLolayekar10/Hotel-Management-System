# Hotel Management System - Setup Guide

## 🏨 Welcome to Your Hotel Management System!

This is a fully functional hotel management application with both **Guest Portal** and **Admin Panel**. All data is stored in your **Supabase database** and will be visible in your Supabase dashboard.

---

## 🔐 Default Admin Credentials

The system automatically creates a default admin account on first load:

- **Email:** `admin@hotel.com`
- **Password:** `admin123`

**Important:** These credentials are displayed on the Admin Portal login screen for your convenience.

---

## 🚀 Quick Start Guide

### For Guests:
1. Click **"Guest Portal"** on the home page
2. Click **"Sign Up"** tab to create a new account
3. Fill in your name, email, and password
4. After signing up, you'll be automatically logged in
5. Search for available rooms by selecting dates
6. Book a room and view your bookings in "My Bookings"

### For Admins:
1. Click **"Admin Portal"** on the home page
2. Sign in with the default credentials above
3. Access the dashboard to:
   - Process today's check-ins
   - Manage rooms and room types
   - View all bookings
   - Cancel any booking

---

## 📊 Viewing Your Data in Supabase Dashboard

All application data is stored in your Supabase database. Here's how to view it:

### 1. Open Your Supabase Dashboard
   - Go to [supabase.com](https://supabase.com)
   - Sign in to your account
   - Select your project

### 2. View Authentication Data
   - Click **"Authentication"** in the left sidebar
   - Click **"Users"** to see all registered users (guests and admins)
   - You'll see the admin account and any guest accounts created

### 3. View Application Data
   - Click **"Table Editor"** in the left sidebar
   - Select the **`kv_store_3e6b123f`** table
   - This table contains all your application data stored as key-value pairs:

#### Data Structure:
| Key Pattern | Description | Example |
|------------|-------------|---------|
| `room_type:rt1` | Room type definitions | Standard Room, Deluxe Room, Suite |
| `room:r101` | Individual room records | Room 101, 102, 103, etc. |
| `booking:b1234567890` | Booking records | Guest reservations |
| `user:uuid` | User profiles | Name, email, role (guest/admin) |
| `initialized` | System initialization flag | true/false |

### 4. Query Your Data
You can use Supabase's SQL Editor to query your data:

```sql
-- View all bookings
SELECT * FROM kv_store_3e6b123f WHERE key LIKE 'booking:%';

-- View all room types
SELECT * FROM kv_store_3e6b123f WHERE key LIKE 'room_type:%';

-- View all rooms
SELECT * FROM kv_store_3e6b123f WHERE key LIKE 'room:%';

-- View all user profiles
SELECT * FROM kv_store_3e6b123f WHERE key LIKE 'user:%';
```

---

## 🎯 Features Overview

### Guest Portal Features:
✅ User registration and authentication  
✅ Search available rooms by date range  
✅ View room details, amenities, and pricing  
✅ Book rooms with automatic price calculation  
✅ View all personal bookings  
✅ Cancel bookings  

### Admin Panel Features:
✅ Secure admin authentication  
✅ Dashboard with quick access to all features  
✅ **Guest Management:** Process today's check-ins  
✅ **Room Management:** Full CRUD for room types and rooms  
✅ **Booking Overview:** View all bookings with status filtering  
✅ Cancel any booking as admin  

---

## 🏗️ Technical Architecture

### Frontend:
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **Vite** for build tooling

### Backend:
- **Supabase Edge Functions** (Hono server)
- **Supabase Authentication**
- **Supabase PostgreSQL** database
- **Key-Value Store** for flexible data storage

### Security:
- Row-level access control via server
- Authenticated API endpoints
- Role-based permissions (guest vs admin)

---

## 📝 Sample Data Included

The system initializes with:

### Room Types:
1. **Standard Room** - $99/night (2 guests max)
2. **Deluxe Room** - $159/night (3 guests max)
3. **Suite** - $249/night (4 guests max)

### Rooms:
- Standard: Rooms 101-104 (Floor 1)
- Deluxe: Rooms 201-203 (Floor 2)
- Suite: Rooms 301-302 (Floor 3)

---

## 🔧 How to Create Additional Admin Accounts

1. Sign up as a guest through the Guest Portal
2. In your Supabase dashboard, go to Authentication > Users
3. Find the new user and copy their UUID
4. Go to Table Editor > kv_store_3e6b123f
5. Find the record with key `user:{UUID}`
6. Edit the `value` field and change `"role": "guest"` to `"role": "admin"`
7. That user can now access the Admin Portal

---

## 🎨 Customization Ideas

- **Add more room types:** Use the Admin Panel's Room Management
- **Modify pricing:** Edit room types in the admin panel
- **Add amenities:** Update room type amenities through the UI
- **Create more rooms:** Add individual rooms to your inventory

---

## 🐛 Troubleshooting

### Admin login not working?
- Make sure you're using the correct credentials: `admin@hotel.com` / `admin123`
- Check that you clicked "Admin Portal" before trying to sign in
- The admin account is created automatically on first page load

### Can't see bookings?
- Make sure you're signed in
- Check that you made a booking first
- Guests only see their own bookings; admins see all bookings

### Room search returns no results?
- Try different date ranges
- Make sure check-out date is after check-in date
- Some rooms might already be booked for those dates

---

## 📧 Need Help?

This is a prototype application built on Figma Make. For production use:
- Change the default admin password
- Add email verification
- Implement payment processing
- Add more robust error handling

---

## ✨ Enjoy Your Hotel Management System!

Your application is now ready to use. All data persists in Supabase and you can manage everything through both the UI and your Supabase dashboard.

Happy hotel managing! 🏨
