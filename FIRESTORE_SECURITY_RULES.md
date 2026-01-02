# Firestore Security Rules for Analytics

Add these rules to your Firebase Console → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin email check function
    function isAdmin() {
      return request.auth != null && request.auth.token.email == 'nilamroychoudhury216@gmail.com';
    }
    
    // Analytics collection - write for authenticated users, read for admin only
    match /analytics/{document=**} {
      // Anyone can write analytics events (no sensitive data)
      allow create: if true;
      
      // Only admin can read analytics data
      allow read: if isAdmin();
      
      // No updates or deletes allowed
      allow update, delete: if false;
    }
    
    // Homestays collection (existing rules)
    match /homestays/{homestay} {
      // Allow read for everyone
      allow read: if true;
      
      // Allow create for authenticated users
      allow create: if request.auth != null;
      
      // Allow update/delete only for owner or admin
      allow update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.createdBy || isAdmin());
    }
    
    // Customers collection (existing rules)
    match /customers/{customer} {
      allow read: if isAdmin();
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }
  }
}
```

## How to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **form-ca7cc**
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace the existing rules with the rules above
6. Click **Publish** to apply changes

## Security Features

### Analytics Collection
- ✅ **Create (Write)**: Public - Anyone can track events (no authentication required)
- ✅ **Read**: Admin only - Only admin email can view analytics data
- ❌ **Update/Delete**: Disabled - Data cannot be modified or deleted through client

### Why Allow Public Writes?
- Analytics tracking needs to work for anonymous visitors
- No sensitive data is stored (only event types, timestamps, and homestay names)
- Prevents blocking user experience if authentication fails
- Real-time tracking without authentication overhead

### Protection Measures
1. **Read-Only for Admin**: Only admin can view the collected data
2. **No Updates**: Once written, data cannot be modified
3. **No Deletes**: Prevents tampering with historical data
4. **Indexed Queries**: Firestore automatically optimizes timestamp queries

## Testing Security Rules

### Test in Firebase Console
1. Go to Firestore Database → Rules
2. Click on **Rules Playground**
3. Test these scenarios:

```javascript
// Test 1: Anonymous user creating analytics event
Location: /databases/(default)/documents/analytics/test123
Operation: create
Auth: Unauthenticated
Result: ✅ Should ALLOW

// Test 2: Anonymous user reading analytics
Location: /databases/(default)/documents/analytics/test123
Operation: get
Auth: Unauthenticated
Result: ❌ Should DENY

// Test 3: Admin reading analytics
Location: /databases/(default)/documents/analytics/test123
Operation: get
Auth: nilamroychoudhury216@gmail.com
Result: ✅ Should ALLOW

// Test 4: User trying to update analytics
Location: /databases/(default)/documents/analytics/test123
Operation: update
Auth: Any
Result: ❌ Should DENY
```

## Firestore Indexes (Optional)

For better query performance, add these indexes:

### Analytics Collection
```
Collection: analytics
Fields:
  - timestamp (Descending)
  - eventType (Ascending)
  
Query scopes: Collection
```

### How to Add Indexes
1. Firebase Console → Firestore Database → Indexes
2. Click **Add Index**
3. Collection ID: `analytics`
4. Add fields: `timestamp` (Descending), `eventType` (Ascending)
5. Query scope: Collection
6. Click **Create**

Or wait for Firebase to suggest indexes when you run queries - it will show a link in the console logs.

## Monitoring & Limits

### Keep Track Of:
- **Document count** in analytics collection (Firebase free tier: 50k reads/day)
- **Storage usage** (each event ~100-200 bytes)
- **Query costs** (admin dashboard queries)

### Cost Estimation (Free Tier)
- 1 million events/month ≈ 200 MB storage (well within free 1 GB)
- Admin viewing dashboard 100 times/day ≈ 3,000 reads/month (within 50k/day)
- Creating events is free (write costs included in bundle)

### Data Retention Strategy
Consider implementing Cloud Functions to:
- Archive analytics older than 6 months
- Delete analytics older than 1 year
- Generate monthly reports

## Troubleshooting

### "Permission Denied" Error
- Verify admin email in security rules matches exactly
- Check if rules are published (not just saved)
- Ensure user is authenticated when accessing admin panel
- Clear browser cache and re-login

### Analytics Not Being Tracked
- Check browser console for errors
- Verify Firebase connection is active
- Check if write rules are too restrictive
- Ensure `serverTimestamp()` is working

### Dashboard Not Loading Data
- Verify admin is logged in with correct email
- Check read permissions in security rules
- Ensure Firestore indexes are created
- Check for console errors in browser

---

**Important**: These rules balance security with functionality. Analytics tracking works for all users, but only admin can view the data.
