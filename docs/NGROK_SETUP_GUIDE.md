# Ngrok Setup Guide

**Date:** 2025-01-13  
**Purpose:** Expose localhost to internet for webhook testing and local development

> **💡 Quick Start:** Xem `docs/NGROK_QUICK_START.md` để bắt đầu nhanh trong 4 bước!

---

## Overview

Ngrok creates secure tunnels to your localhost, allowing you to:
- Test webhooks from external services (Supabase, payment gateways, etc.)
- Share your local development server with team members
- Test mobile apps against local backend
- Debug production-like scenarios locally

---

## Installation

### Option 1: Download Binary (Recommended)

1. **Download Ngrok:**
   - Visit: https://ngrok.com/download
   - Download for Windows/Mac/Linux
   - Extract to a folder (e.g., `C:\ngrok` or `/usr/local/bin`)

2. **Add to PATH (Optional but Recommended):**
   - Windows: Add ngrok folder to System Environment Variables → Path
   - Mac/Linux: Move to `/usr/local/bin` or add to `~/.bashrc`/`~/.zshrc`

### Option 2: Using Package Manager

**Windows (Chocolatey):**
```powershell
choco install ngrok
```

**Mac (Homebrew):**
```bash
brew install ngrok/ngrok/ngrok
```

**Linux (Snap):**
```bash
snap install ngrok
```

---

## Setup (Free Account)

### Step 1: Create Free Account

**Mục đích:** Tạo tài khoản Ngrok miễn phí để lấy authtoken

1. Go to https://dashboard.ngrok.com/signup
2. Sign up with email (free tier available)
3. Verify email

**Kết quả:** Bạn có tài khoản Ngrok miễn phí

### Step 2: Get Auth Token

**Mục đích:** Lấy mã xác thực để kết nối Ngrok với tài khoản của bạn

1. Login to https://dashboard.ngrok.com
2. Go to: **Your Authtoken** (https://dashboard.ngrok.com/get-started/your-authtoken)
3. Copy your authtoken (dạng: `2abc123def456...`)

**Kết quả:** Bạn có authtoken để cấu hình Ngrok

### Step 3: Configure Ngrok

**Mục đích:** Cấu hình Ngrok với authtoken để xác thực tài khoản

Run in terminal:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

**Thay `YOUR_AUTH_TOKEN` bằng:** Authtoken bạn đã copy ở Step 2

**Ví dụ:**
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pq_6R7s8T9u0V1w2X3y4Z5
```

**Kết quả:** 
- Ngrok đã được cấu hình với tài khoản của bạn
- Config file được tạo tại:
  - Windows: `%USERPROFILE%\.ngrok2\ngrok.yml`
  - Mac/Linux: `~/.ngrok2/ngrok.yml`

**Lưu ý:** Chỉ cần làm 1 lần, sau đó dùng mãi mãi

---

## Basic Usage

### Start Tunnel (Port 3000 - Vite Dev Server)

```bash
ngrok http 3000
```

This will:
- Create a public URL (e.g., `https://abc123.ngrok-free.app`)
- Forward all traffic to `http://localhost:3000`
- Show a web interface at `http://127.0.0.1:4040` for request inspection

### Start Tunnel with Custom Domain (Paid Feature)

```bash
ngrok http 3000 --domain=your-custom-domain.ngrok-free.app
```

### Start Tunnel with Subdomain (Free Tier)

```bash
ngrok http 3000 --subdomain=myapp
# URL: https://myapp.ngrok-free.app
```

**Note:** Free tier subdomains are random. Custom subdomains require paid plan.

---

## Advanced Configuration

### Create Config File

Create/edit `~/.ngrok2/ngrok.yml` (or `%USERPROFILE%\.ngrok2\ngrok.yml`):

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN

tunnels:
  web:
    addr: 3000
    proto: http
    bind_tls: true  # Force HTTPS
    
  api:
    addr: 3001
    proto: http
    bind_tls: true
    
  webhook:
    addr: 3000
    proto: http
    bind_tls: true
    inspect: false  # Disable web interface
```

### Use Named Tunnel

```bash
ngrok start web
# or
ngrok start web api
```

---

## Integration with Vite Dev Server

### Option 1: Manual Start (2 terminals)

**Mục đích:** Chạy Vite và Ngrok riêng biệt

1. **Terminal 1:** Start Vite dev server:
   ```bash
   npm run dev
   ```
   - App chạy tại: `http://localhost:3000`

2. **Terminal 2:** Start Ngrok tunnel:
   ```bash
   ngrok http 3000
   ```
   - Ngrok tạo public URL (ví dụ: `https://abc123.ngrok-free.app`)
   - URL này forward về `localhost:3000`

3. **Sử dụng:** Copy Ngrok URL để cấu hình webhooks

### Option 2: Script Integration (Recommended - 1 command)

**Mục đích:** Tự động chạy cả Vite và Ngrok cùng lúc

```bash
npm run dev:ngrok
```

**Script này sẽ:**
- ✅ Start Vite dev server trên port 3000
- ✅ Start Ngrok tunnel forward về port 3000
- ✅ Hiển thị public URL
- ✅ Lưu URL vào file `.ngrok-url`

**Ưu điểm:** Chỉ cần 1 lệnh, không cần 2 terminals

**Xem chi tiết:** `scripts/start-dev-with-ngrok.js`

---

## Webhook Testing

### Supabase Edge Functions Webhooks

1. Start Ngrok:
   ```bash
   ngrok http 3000
   ```

2. Copy Ngrok URL (e.g., `https://abc123.ngrok-free.app`)

3. In Supabase Dashboard:
   - Go to **Database** → **Webhooks**
   - Create new webhook
   - Set URL: `https://abc123.ngrok-free.app/api/webhook`
   - Configure events (INSERT, UPDATE, DELETE)

4. Test webhook by triggering the event

### Payment Gateway Webhooks

1. Start Ngrok:
   ```bash
   ngrok http 3000
   ```

2. Configure webhook URL in payment gateway:
   - Stripe: `https://abc123.ngrok-free.app/api/stripe-webhook`
   - PayPal: `https://abc123.ngrok-free.app/api/paypal-webhook`

3. Test payment flow

---

## Ngrok Web Interface

When Ngrok is running, access the web interface at:
- **URL:** http://127.0.0.1:4040
- **Features:**
  - View all HTTP requests/responses
  - Replay requests
  - Inspect headers and body
  - Export requests

**Useful for:**
- Debugging webhook payloads
- Inspecting API calls
- Testing request/response flows

---

## Environment Variables

### Add to `.env.local`

```env
# Ngrok Configuration
NGROK_ENABLED=true
NGROK_PORT=3000
NGROK_SUBDOMAIN=myapp  # Optional, requires paid plan
```

### Use in Code

```typescript
const NGROK_URL = import.meta.env.VITE_NGROK_URL || 'http://localhost:3000';
```

---

## Scripts

### Start Dev with Ngrok

```bash
npm run dev:ngrok
```

This will:
1. Start Vite dev server
2. Start Ngrok tunnel
3. Display Ngrok URL
4. Keep both running

### Stop Ngrok

```bash
npm run ngrok:stop
```

---

## Troubleshooting

### Issue: "ngrok: command not found"

**Solution:**
- Add Ngrok to PATH
- Or use full path: `C:\ngrok\ngrok.exe http 3000`

### Issue: "ERR_NGROK_108" - Too many connections

**Solution:**
- Free tier has connection limits
- Wait a few minutes
- Or upgrade to paid plan

### Issue: "ERR_NGROK_3200" - Invalid authtoken

**Solution:**
- Re-run: `ngrok config add-authtoken YOUR_AUTH_TOKEN`
- Check token in dashboard

### Issue: Webhook not receiving requests

**Solution:**
1. Check Ngrok is running: http://127.0.0.1:4040
2. Verify webhook URL is correct (use HTTPS)
3. Check firewall/antivirus isn't blocking
4. Verify local server is running on correct port

---

## Security Considerations

### ⚠️ Important Notes

1. **Public Access:**
   - Ngrok URLs are publicly accessible
   - Anyone with the URL can access your localhost
   - Use random URLs (don't share publicly)

2. **HTTPS:**
   - Ngrok provides HTTPS by default
   - Always use HTTPS URLs for webhooks

3. **Authentication:**
   - Add authentication to webhook endpoints
   - Verify webhook signatures (Stripe, PayPal, etc.)

4. **Rate Limiting:**
   - Free tier has rate limits
   - Consider paid plan for production testing

---

## Free Tier Limitations

- **Connection Time:** 2 hours max per session
- **Connections:** Limited concurrent connections
- **Bandwidth:** Limited bandwidth
- **Subdomain:** Random subdomain (not custom)
- **Request Inspection:** Available

**Upgrade to paid plan for:**
- Custom domains
- Reserved subdomains
- Longer sessions
- More bandwidth
- Priority support

---

## Best Practices

1. **Use for Development Only:**
   - Don't use Ngrok for production
   - Use proper domain and SSL for production

2. **Rotate URLs:**
   - Ngrok URLs change each restart (free tier)
   - Update webhook URLs when restarting

3. **Monitor Requests:**
   - Use Ngrok web interface to monitor traffic
   - Check for unexpected requests

4. **Clean Up:**
   - Stop Ngrok when not in use
   - Don't leave tunnels open unnecessarily

---

## Integration Examples

### Supabase Webhook

```typescript
// pages/api/webhook.ts
export async function POST(request: Request) {
  // Verify webhook signature
  const signature = request.headers.get('x-supabase-signature');
  // ... verify signature
  
  const payload = await request.json();
  // ... handle webhook
}
```

### Stripe Webhook

```typescript
// pages/api/stripe-webhook.ts
import Stripe from 'stripe';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = request.headers.get('stripe-signature')!;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  
  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      // ... handle payment
      break;
  }
}
```

---

## Quick Reference

```bash
# Start tunnel
ngrok http 3000

# Start with custom subdomain (paid)
ngrok http 3000 --subdomain=myapp

# Start with config
ngrok start web

# View web interface
# Open: http://127.0.0.1:4040

# Stop tunnel
# Press Ctrl+C in terminal
```

---

## Resources

- **Ngrok Docs:** https://ngrok.com/docs
- **Dashboard:** https://dashboard.ngrok.com
- **Pricing:** https://ngrok.com/pricing
- **Community:** https://ngrok.com/community

---

**END OF GUIDE**
