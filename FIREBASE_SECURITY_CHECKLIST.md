# Firebase RTDB Security Checklist (cafe-adisyon-2bcf0)

## 1) Immediate mitigation (no app refactor)
1. Open Firebase Console -> Realtime Database -> Rules.
2. Paste content of firebase-rtdb-rules-compat-temporary.json.
3. Publish rules.
4. Test login and order flow on COFFE.html.

## 2) Proper production hardening (recommended)
1. Implement Firebase Authentication and role claims (admin/garson).
2. Paste content of firebase-rtdb-rules-secure.json.
3. Publish rules.
4. Verify admin screens, stock, reports, and table operations.

## Notes
- Temporary rules reduce blast radius by closing root read/write and limiting exposed paths.
- Secure rules require authenticated users and role claims.
- Without auth, secure rules will block app data access.
