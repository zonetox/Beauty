# Development Workflow Guide

**Last Updated:** 2025-01-13

---

## Quick Start

### Standard Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# App runs on: http://localhost:3000
```

### Development with Ngrok (Webhook Testing)

```bash
# Start dev server + Ngrok tunnel
npm run dev:ngrok

# Get Ngrok URL
npm run ngrok:url
```

---

## Development Tools

### 1. Local Development Server

**Command:** `npm run dev`

- **Port:** 3000 (default)
- **URL:** http://localhost:3000
- **Hot Reload:** Enabled
- **Source Maps:** Enabled

### 2. Ngrok Tunnel (Webhook Testing)

**Command:** `npm run dev:ngrok`

**Use Cases:**
- Test Supabase webhooks
- Test payment gateway webhooks
- Share local server with team
- Test mobile apps against local backend

**Features:**
- Public HTTPS URL
- Web interface at http://127.0.0.1:4040
- Request inspection
- Automatic URL detection

**See:** `docs/NGROK_SETUP_GUIDE.md` for detailed setup

### 3. Testing

**Unit Tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

**E2E Tests:**
```bash
npm run test:e2e      # Run E2E tests
npm run test:e2e:ui   # With UI
```

### 4. Build & Preview

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Environment Setup

### Required Environment Variables

Create `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
GEMINI_API_KEY=your-gemini-key
VITE_SENTRY_DSN=your-sentry-dsn
VITE_POSTHOG_API_KEY=your-posthog-key
```

### Sync from Vercel

```bash
# Pull env vars from Vercel
npm run env:pull

# Push env vars to Vercel
npm run env:push

# Check status
npm run env:status
```

---

## Database Development

### Apply Migrations

1. **Via Supabase Dashboard:**
   - Go to SQL Editor
   - Run migration files from `database/migrations/`

2. **Via Supabase CLI:**
   ```bash
   supabase db push
   ```

### Verify Database

```bash
# Run verification scripts
# See: database/verifications/
```

---

## Webhook Testing Workflow

### 1. Start Development Server with Ngrok

```bash
npm run dev:ngrok
```

This will:
- Start Vite dev server on port 3000
- Start Ngrok tunnel
- Display public URL

### 2. Get Ngrok URL

```bash
npm run ngrok:url
```

Or check web interface: http://127.0.0.1:4040

### 3. Configure Webhook

**Supabase:**
- Dashboard → Database → Webhooks
- URL: `https://your-ngrok-url.ngrok-free.app/api/webhook`

**Payment Gateway:**
- Use Ngrok URL for webhook endpoint
- Verify webhook signature in code

### 4. Test Webhook

- Trigger the event
- Check Ngrok web interface for request
- Verify response in logs

---

## Code Quality

### Linting

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

### Type Checking

```bash
npm run type-check    # TypeScript check
```

### All Checks

```bash
npm run check:all     # Run all checks
```

---

## Debugging

### Browser DevTools

- **React DevTools:** Install browser extension
- **Network Tab:** Inspect API calls
- **Console:** View logs and errors

### Sentry Error Tracking

- Errors automatically tracked (if configured)
- View in Sentry dashboard
- Source maps for production debugging

### Ngrok Web Interface

- **URL:** http://127.0.0.1:4040
- **Features:**
  - View all HTTP requests
  - Inspect headers and body
  - Replay requests
  - Export requests

---

## Common Tasks

### Add New Component

1. Create component file: `components/MyComponent.tsx`
2. Add to appropriate page/component
3. Test component
4. Add tests if needed

### Add New API Endpoint

1. Create Edge Function: `supabase/functions/my-function/index.ts`
2. Deploy: `supabase functions deploy my-function`
3. Test with Ngrok if needed

### Add Database Migration

1. Create migration: `database/migrations/YYYYMMDDHHMMSS_description.sql`
2. Apply in Supabase Dashboard
3. Update documentation:
   - `docs/infrastructure/database/schema.md`
   - `docs/infrastructure/database/rls.md`
   - `docs/infrastructure/database/relations.md`

---

## Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### Ngrok Not Working

1. Check Ngrok is installed: `ngrok version`
2. Check authtoken: `ngrok config check`
3. Check firewall/antivirus
4. See: `docs/NGROK_SETUP_GUIDE.md`

### Build Errors

1. Clear cache: `rm -rf node_modules dist`
2. Reinstall: `npm install`
3. Rebuild: `npm run build`

### Database Connection Issues

1. Check env vars: `npm run env:verify:full`
2. Test connection: Visit `/connection-test`
3. Check Supabase dashboard

---

## Best Practices

1. **Always Test Locally First**
   - Run `npm run dev`
   - Test features before committing

2. **Use Ngrok for Webhooks**
   - Don't commit Ngrok URLs
   - Update webhook URLs when restarting

3. **Keep Dependencies Updated**
   ```bash
   npm outdated
   npm update
   ```

4. **Write Tests**
   - Unit tests for utilities
   - Component tests for UI
   - E2E tests for critical flows

5. **Document Changes**
   - Update relevant docs
   - Add comments for complex logic
   - Update completion plan

---

## Resources

- **Ngrok Guide:** `docs/NGROK_SETUP_GUIDE.md`
- **Testing Guide:** `README_TESTING_AND_MONITORING.md`
- **Database Docs:** `docs/infrastructure/database/`
- **Specs:** `specs/`

---

**END OF GUIDE**
