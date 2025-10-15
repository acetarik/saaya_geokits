# Firebase Security Rules for Land Management

Add these rules to your Firestore security rules to secure the lands collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // Land Management Rules
    match /lands/{landId} {
      // Users can read, write, update, and delete only their own lands
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // Users can create new lands with their own userId
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

This ensures that:
1. Only authenticated users can access the lands collection
2. Users can only see and modify their own land data
3. The userId field must match the authenticated user's ID when creating new lands
4. Prevents users from accessing other users' land information