# Admin Login Troubleshooting Guide

## 🔐 Default Admin Credentials

- **Email:** `admin@hotel.com`
- **Password:** `admin123`

---

## ✅ How to Fix "Invalid Login Credentials" Error

The system now automatically creates the admin account when you first load the page. If you're seeing "Invalid login credentials", follow these steps:

### Solution 1: Use the Built-in Fix Button
1. Try to login with admin@hotel.com / admin123
2. When you see the "Invalid login credentials" error
3. Click the **"Create Admin Account"** button that appears in the error message
4. Wait for the success message
5. Click "Sign In" again

### Solution 2: Refresh the Page
1. Refresh your browser (F5 or Ctrl+R)
2. The system will automatically try to create the admin account
3. Wait a few seconds
4. Try logging in with admin@hotel.com / admin123

### Solution 3: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the "Console" tab
3. Look for messages about admin account creation
4. You should see: "Admin account setup: {...}"
5. If you see an error, the admin account creation failed

---

## 🔍 What's Happening Behind the Scenes

When you load the application:

1. **Automatic Admin Creation**: The app calls `/create-admin` endpoint
2. **Supabase Auth**: Creates a user in Supabase Authentication
3. **User Profile**: Stores admin profile in the database with role='admin'
4. **Confirmation**: Logs success or error to browser console

---

## 🛠️ Manual Admin Creation (Advanced)

If the automatic methods don't work, you can create an admin manually:

### Method 1: Using the API Endpoint
Open your browser console and run:

```javascript
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3e6b123f/create-admin', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(console.log);
```

### Method 2: Using Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"**
4. Enter:
   - Email: admin@hotel.com
   - Password: admin123
   - Auto Confirm User: ✅ Yes
5. Click **"Create User"**
6. Copy the new user's UUID
7. Go to **Table Editor** → **kv_store_3e6b123f**
8. Click **"Insert Row"**
9. Add:
   - key: `user:UUID_YOU_COPIED`
   - value: `{"id":"UUID_YOU_COPIED","email":"admin@hotel.com","name":"Hotel Administrator","role":"admin"}`
10. Click **"Save"**

---

## 📊 Verifying Admin Account

### Check in Supabase Dashboard:

1. **Authentication → Users**: Should see admin@hotel.com
2. **Table Editor → kv_store_3e6b123f**: Should see a row with key starting with `user:` containing role='admin'

### Check in Browser Console:

After page load, you should see:
```
Admin account setup: {message: "Admin account created successfully", email: "admin@hotel.com", userId: "..."}
```

---

## ❓ Common Issues

### Issue: "User already exists" but login fails
**Solution:** The user exists in Supabase Auth but the profile wasn't created
- Use the "Create Admin Account" button - it will create the profile

### Issue: Can login but get "Admin access required" error
**Solution:** User exists but doesn't have admin role
- Go to Supabase Dashboard → Table Editor → kv_store_3e6b123f
- Find the user's profile row
- Change `"role":"guest"` to `"role":"admin"`

### Issue: Nothing happens when clicking "Create Admin Account"
**Solution:** Check browser console for errors
- There might be a network error
- Your Supabase credentials might be incorrect
- Try refreshing the page

---

## 🎯 Alternative: Create Guest Account First

If you can't get admin login working, you can:

1. Switch to **Guest Portal**
2. Create a regular guest account
3. In Supabase Dashboard, find that user
4. Change their role from 'guest' to 'admin' in the kv_store
5. Sign out and sign back in
6. Switch to **Admin Portal**
7. Login with your account

---

## 📞 Still Having Issues?

If none of these solutions work:

1. Check that your Supabase project is active
2. Verify environment variables are set correctly
3. Check browser console for JavaScript errors
4. Try in an incognito/private browser window
5. Clear browser cache and cookies

---

## ✨ Once Logged In

After successful admin login, you'll have access to:
- 📊 **Dashboard**: Overview of hotel operations
- 👥 **Guest Check-ins**: Process today's arrivals
- 🏨 **Room Management**: Full CRUD for rooms and room types
- 📅 **Booking Overview**: View and manage all reservations

Enjoy your Hotel Management System!
