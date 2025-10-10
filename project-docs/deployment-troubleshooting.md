# Deployment Troubleshooting Guide

## Submission Failure: "Failed to submit enrichment job"

### Quick Checklist

- [ ] Environment variable `LEADDESK_DISPATCHER_WEBHOOK_URL` is set on Vercel
- [ ] Webhook URL is accessible and working
- [ ] Supabase environment variables are correct
- [ ] User authentication is working
- [ ] n8n dispatcher is running and accessible

### Step 1: Check Environment Variables on Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Required variables:
```
LEADDESK_DISPATCHER_WEBHOOK_URL=https://your-n8n-instance.com/webhook/leaddesk-dispatcher
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Test the Webhook URL Manually

```bash
curl -X POST https://your-n8n-instance.com/webhook/leaddesk-dispatcher \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Test Practice",
    "address": "123 Test St",
    "user_id": "test-user-id"
  }'
```

**Expected Response:**
```json
{
  "status": "accepted",
  "correlation_id": "uuid-here"
}
```

### Step 3: Check Vercel Logs

1. Go to **Vercel Dashboard → Your Project → Deployments**
2. Click on the latest deployment
3. Click **Functions** tab
4. Look for logs from `/api/search-practices`

**Look for these log messages:**
```
✅ User authenticated: [user-id]
Submitting job to dispatcher: { companyName, address, user_id }
Dispatcher response status: [status-code]
```

### Step 4: Common Error Messages and Solutions

#### Error: "Dispatcher webhook URL not configured"
```json
{ "success": false, "error": "Dispatcher webhook URL not configured" }
```

**Cause:** Environment variable `LEADDESK_DISPATCHER_WEBHOOK_URL` is not set

**Fix:** 
1. Add the environment variable on Vercel
2. Redeploy the application

#### Error: "Please sign in to submit jobs"
```json
{ "success": false, "error": "Please sign in to submit jobs" }
```

**Cause:** User authentication failed

**Fix:**
1. Ensure user is logged in
2. Check Supabase environment variables are correct
3. Verify Supabase project is accessible from Vercel

#### Error: "Failed to submit enrichment job: 404 Not Found"
```json
{ "success": false, "error": "Failed to submit enrichment job: 404 Not Found" }
```

**Cause:** Webhook URL is incorrect or n8n workflow is not active

**Fix:**
1. Verify webhook URL in n8n
2. Ensure n8n workflow is active
3. Check n8n is accessible from internet (not localhost)

#### Error: "Invalid response from dispatcher"
```json
{ "success": false, "error": "Invalid response from dispatcher..." }
```

**Cause:** n8n is responding but not in the expected format

**Fix:**
1. Ensure n8n dispatcher returns: `{ status: "accepted", correlation_id: "uuid" }`
2. Check n8n workflow output format

#### Error: "Request timeout"
```json
{ "success": false, "error": "Request timeout..." }
```

**Cause:** n8n dispatcher took longer than 6 minutes to respond

**Fix:**
1. Check n8n workflow for slow nodes
2. Ensure n8n is running and responding quickly
3. Consider optimizing the dispatcher workflow

### Step 5: Test Authentication Flow

Create a test endpoint to verify authentication:

```typescript
// app/api/test-auth/route.ts
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'No auth token' }, { status: 401 });
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  
  return Response.json({
    authenticated: !!data.user,
    user: data.user?.id,
    error: error?.message
  });
}
```

Test it:
```bash
curl https://your-app.vercel.app/api/test-auth \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Step 6: Enable Debug Mode

Add more logging to `/api/search-practices/route.ts`:

```typescript
// After line 47
console.log('🔧 DEBUG INFO:', {
  hasDispatcherUrl: !!dispatcherUrl,
  dispatcherUrlLength: dispatcherUrl?.length,
  envKeys: Object.keys(process.env).filter(k => k.includes('LEADDESK')),
});
```

This will help you see if the environment variable is actually loaded.

### Step 7: Verify n8n Dispatcher is Working

Check your n8n instance:
1. Go to n8n dashboard
2. Find the "LeadDesk Dispatcher" workflow
3. Check if it's **Active** (toggle should be ON)
4. Click **Executions** to see if it's receiving requests
5. Test the webhook directly in n8n

### Environment Variable Checklist for Vercel

```bash
# Required for frontend
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Required for API routes
LEADDESK_DISPATCHER_WEBHOOK_URL=https://your-n8n.app/webhook/leaddesk-dispatcher

# Optional but recommended
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # For admin operations
```

### Quick Test Script

Run this in your browser console on the deployed site:

```javascript
// Test if environment variables are accessible
fetch('/api/search-practices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  },
  body: JSON.stringify({
    query: 'Test Practice 123 Main St'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### After Fixing

Once you've updated environment variables:
1. **Redeploy** on Vercel (or wait for auto-deploy)
2. **Clear browser cache** (Ctrl+Shift+R / Cmd+Shift+R)
3. **Test submission** with a real practice name

### Still Not Working?

Check:
1. **Network tab** in browser DevTools during submission
2. **Console tab** for JavaScript errors
3. **Vercel Function logs** for server-side errors
4. **n8n execution logs** to see if requests are reaching n8n
5. **Supabase logs** to verify authentication is working

### Contact Information

If issue persists, collect:
- Vercel function logs
- Browser console errors
- Network request/response
- n8n execution logs
- Supabase auth logs

