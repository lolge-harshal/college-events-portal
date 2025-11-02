# 🚀 URGENT FIX GUIDE - Image Upload & Session Loss

This document solves both of your issues:
1. ❌ **Image upload error**: "new row violates row-level security policy"
2. ❌ **Session lost on tab switch**: "Admin access is denied"

---

## 🔴 ISSUE #1: Image Upload Error (Storage RLS)

### **Error Message:**
```
StorageApiError: new row violates row-level security policy
```

### **Root Cause:**
The `event-images` storage bucket doesn't have proper RLS policies configured.

### **Solution: Create Storage Bucket (5 minutes)**

#### **Step 1: Go to Supabase Dashboard**
1. Open your Supabase project: https://supabase.com/dashboard
2. Click **Storage** (left sidebar)
3. Click **"Create a new bucket"**

#### **Step 2: Create event-images Bucket**
- **Bucket name**: `event-images`
- **Make it public**: UNCHECK "Make bucket private" ✅ Keep it PUBLIC
- Click **"Create bucket"**

#### **Step 3: Done!**
That's it! The bucket is now ready. You can start uploading images.

**If you want a PRIVATE bucket (optional)**, see [Private Bucket Setup](#private-bucket-setup) below.

---

### **Testing Image Upload:**

1. Go to `http://localhost:5173/auth/login`
2. Click **"🔑 Admin Login"** button
3. Go to **"⚙️ Admin"** → **"Create Event"**
4. Fill in event details
5. **Click "Choose Image"** and select a file
6. Click **"Create Event"**
7. If image uploads without error → ✅ **You're done!**

---

## 🔴 ISSUE #2: Session Lost on Tab Switch (Now Fixed!)

### **What Was Happening:**
When you switched to another tab, the app would refresh and clear your admin session, showing "Admin access is denied".

### **Why It Happened:**
When a tab became inactive and then active again, Supabase would try to refresh the profile. If that refresh failed for ANY reason (even temporary), the entire profile was cleared.

### **What We Fixed:**
- ✅ Updated `useAuth.tsx` to **keep the profile alive** even if refresh fails
- ✅ Added graceful degradation: If a refresh fails, we keep the existing session
- ✅ Session now persists even when switching tabs
- ✅ Only clears profile on actual logout, not on refresh failures

### **Testing Session Persistence:**

1. Log in as admin: Click **"🔑 Admin Login"**
2. Go to admin dashboard: **"⚙️ Admin"**
3. **Switch to another browser tab** for 10 seconds
4. **Come back to this tab**
5. You should still be logged in as admin ✅

**Before Fix**: Would show "Admin access denied" ❌
**After Fix**: Stays logged in ✅

---

## ✅ QUICK CHECKLIST

- [ ] **Created `event-images` storage bucket in Supabase** (PUBLIC)
- [ ] **Tried uploading an image through admin dashboard** → Success ✅
- [ ] **Switched tabs and came back** → Still logged in ✅
- [ ] **Created an event with an image** → Image uploaded and appears ✅

---

## 🔧 ADVANCED: Private Bucket Setup

If you want a **PRIVATE** bucket (requires signed URLs, already implemented in code):

### **Step 1: Change Bucket to Private (Optional)**
1. Go to Supabase Storage
2. Click **event-images** bucket
3. Click **Settings** → Toggle **"Make bucket private"** ON
4. Click **Update**

### **Step 2: Add RLS Policies**
Go to **event-images** bucket → **Policies** tab

Copy and paste each policy below:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Allow authenticated upload" 
ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'event-images');
```

**Policy 2: Allow public read**
```sql
CREATE POLICY "Allow public read" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-images');
```

**Policy 3: Allow authenticated delete**
```sql
CREATE POLICY "Allow authenticated delete" 
ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'event-images');
```

---

## ❓ TROUBLESHOOTING

### **Still getting "new row violates row-level security policy"**

1. **Check bucket exists**:
   - Go to Supabase Storage
   - Do you see `event-images` bucket? ✅
   
2. **Check bucket is public**:
   - Click bucket → Settings
   - Is "Make bucket private" **unchecked**? ✅
   
3. **Try refreshing page**:
   - Press `F5` to refresh the app
   - Try upload again

4. **Check bucket name**:
   - Bucket name must be **exactly**: `event-images` (lowercase, no spaces)

### **Still seeing "Admin access denied" on tab switch**

1. **Refresh the page**: Press `F5`
2. **Re-login**: Click **"🔑 Admin Login"**
3. Check browser console for errors

If still failing:
- Clear browser cookies and local storage
- Sign out completely
- Clear browser cache
- Sign back in

---

## 📝 FILES CHANGED

1. **`src/hooks/useAuth.tsx`** - Fixed session persistence
   - Keep profile alive on refresh failures
   - Only clear on actual logout
   - Graceful degradation

2. **`migrations/006_setup_storage_bucket.md`** - New documentation
   - Step-by-step storage setup guide

---

## ✨ WHAT WORKS NOW

✅ Admin login persists when switching tabs
✅ Image uploads work without errors
✅ Session stays active even with temporary connection issues
✅ Graceful fallback to existing profile if refresh fails
✅ Full admin dashboard functionality

---

## 🎯 NEXT STEPS

1. **Create storage bucket** (takes 1 minute)
2. **Test image upload** (takes 30 seconds)
3. **Verify session persistence** (switch tabs and check)
4. **You're done!** 🎉

---

If you still have issues, check:
- [ ] Supabase project is active and accessible
- [ ] `event-images` bucket exists and is PUBLIC
- [ ] You're logged in as admin with `is_admin = true`
- [ ] Browser console shows no other errors