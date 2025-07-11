# LeadDesk Authenticated Uploads Implementation Recap

## Overview
This document summarizes the implementation of authenticated uploads for the LeadDesk workflow. The goal was to ensure that every POST request to the backend webhook route includes the current Supabase authenticated user’s user_id as a top-level property in the JSON payload, and to prevent uploads if the user is not signed in.

---

## Technical Approach
- **Client-side authentication** is managed using Supabase's JS client and a custom `useUsers` hook.
- **API route authentication** is handled by extracting the Supabase access token from the `Authorization` header (sent by the client) or, as a fallback, from cookies.
- **User ID inclusion:** The API route injects the authenticated user's `user_id` into the payload sent to the external webhook.
- **Loading state:** The "Enrich Lead" button shows a loading spinner and disables itself while processing.

---

## Key Changes

### 1. `components/lead-enrichment-form.tsx`
- Before making the POST request to `/api/submit-leaddesk`, the client retrieves the current Supabase session and access token.
- The access token is sent in the `Authorization` header (`Bearer ...`).
- The fetch call includes `credentials: "include"` to send cookies as well.
- The Enrich Lead button uses an `isEnriching` state to show a loading spinner and prevent duplicate submissions.
- The upload is prevented if no user is signed in.

### 2. `app/api/submit-leaddesk/route.ts`
- The API route checks for the `Authorization` header. If present, it uses the access token to authenticate the user with Supabase.
- If the header is not present, it falls back to cookie-based authentication.
- If authentication fails, a 401 Unauthorized response is returned.
- If successful, the API route injects the `user_id` into the payload and forwards it to the external webhook.

### 3. Supporting Files
- `utils/supabase-client.ts` and `utils/supabase.ts` provide the Supabase client setup for client and server/API usage, respectively.
- The `useUsers` hook manages client-side auth state and exposes the current user.

---

## How It Works
1. **User logs in** via the frontend using Supabase Auth.
2. **User uploads a file or batch** via the Lead Enrichment form.
3. **Client retrieves the access token** and sends it in the `Authorization` header with the POST request.
4. **API route authenticates the user** using the access token (or cookies as fallback).
5. **API route injects the user_id** into the payload and forwards it to the external webhook.
6. **If not authenticated,** the API route returns a 401 error and the upload is prevented.
7. **The Enrich Lead button** shows a loading spinner while processing and is disabled to prevent duplicate submissions.

---

## Example Payload Sent to Webhook
```
{
  "user_id": "user-uuid-from-supabase",
  "filename": "uploaded_file.csv",
  "rows": [ /* array of practice objects */ ]
}
```

---

## Notes
- This approach is compatible with client-side Supabase Auth (session in localStorage) and does not require Supabase Auth Helpers for Next.js, but using those helpers is recommended for full SSR support.
- All changes are backward-compatible and do not remove any existing components.

---

## For Future Developers
- If you migrate to SSR or want to support server-side rendering, consider using [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs) to store sessions in cookies.
- Always ensure the access token is sent with API requests that require authentication.
- For any new API routes requiring authentication, follow the same pattern: check for the `Authorization` header and use the token to authenticate with Supabase. 