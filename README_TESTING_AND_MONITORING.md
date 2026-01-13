# Testing & Monitoring Setup Guide

**Last Updated:** 2025-01-13  
**Status:** ✅ **FULLY CONFIGURED**

---

## 📋 Overview

This project includes comprehensive testing and monitoring setup:

1. **Unit Tests** - Jest + React Testing Library
2. **E2E Tests** - Playwright
3. **Error Tracking** - Sentry
4. **Analytics** - PostHog
5. **Performance Monitoring** - Custom hooks + Web Vitals

---

## 🧪 Testing

### Unit Tests

**Framework:** Jest + React Testing Library

**Run Tests:**
```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

**Test Structure:**
```
tests/
  ├── examples/          # Example test templates
  ├── integration/       # Integration tests
  ├── regression/        # Regression tests
  └── e2e/              # E2E tests (Playwright)
components/__tests__/   # Component tests
contexts/__tests__/     # Context tests
lib/__tests__/          # Utility tests
```

**Example Test Files:**
- `tests/examples/component.test.example.tsx` - Component test template
- `tests/examples/hook.test.example.ts` - Hook test template
- `tests/examples/api.test.example.ts` - API test template

### E2E Tests

**Framework:** Playwright

**Run E2E Tests:**
```bash
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run with UI
npm run test:e2e:headed # Run in headed mode
```

**Example E2E Test:**
- `tests/e2e/example.spec.ts` - E2E test template

---

## 🔍 Error Tracking (Sentry)

### Setup

1. **Get Sentry DSN:**
   - Sign up at https://sentry.io
   - Create a project
   - Copy the DSN

2. **Configure Environment Variables:**
   ```env
   VITE_SENTRY_DSN=your-sentry-dsn
   VITE_SENTRY_ORG=your-org-slug
   VITE_SENTRY_PROJECT=your-project-slug
   VITE_SENTRY_AUTH_TOKEN=your-auth-token  # For source maps upload
   ```

3. **Files:**
   - `sentry.client.config.ts` - Sentry client configuration
   - `vite.config.ts` - Sentry Vite plugin for source maps

### Features

- ✅ Automatic error tracking
- ✅ Performance monitoring
- ✅ Session replay (on errors)
- ✅ Source maps upload (production)
- ✅ Error filtering (non-critical errors ignored)

### Usage

Sentry is automatically initialized in `index.tsx`. No additional setup needed.

---

## 📊 Analytics (PostHog)

### Setup

1. **Get PostHog API Key:**
   - Sign up at https://posthog.com (free tier available)
   - Create a project
   - Copy the API key

2. **Configure Environment Variables:**
   ```env
   VITE_POSTHOG_API_KEY=your-posthog-api-key
   VITE_POSTHOG_HOST=https://app.posthog.com  # Optional, defaults to app.posthog.com
   ```

3. **Files:**
   - `lib/analytics.ts` - PostHog integration

### Features

- ✅ Automatic pageview tracking
- ✅ Custom event tracking
- ✅ User identification
- ✅ Conversion tracking
- ✅ Privacy-friendly (respects DNT)

### Usage

```typescript
import { trackEvent, identifyUser, trackConversion } from './lib/analytics.ts';

// Track custom event
trackEvent('button_clicked', { button_name: 'signup' });

// Identify user
identifyUser('user-123', { email: 'user@example.com' });

// Track conversion
trackConversion('purchase', 99.99, { product_id: '123' });

// Track business action
trackBusinessAction('view', businessId);

// Track booking
trackBooking(businessId, serviceId);
```

---

## ⚡ Performance Monitoring

### Setup

**Files:**
- `hooks/usePerformanceMonitoring.ts` - Performance monitoring hooks

### Features

- ✅ Component render time tracking
- ✅ API call performance tracking
- ✅ User interaction performance
- ✅ Web Vitals (LCP, FID, CLS)
- ✅ Slow operation alerts

### Usage

```typescript
import { usePerformanceMonitoring, useWebVitals } from './hooks/usePerformanceMonitoring.ts';

// In component
const MyComponent = () => {
  const { trackApiCall, trackInteraction } = usePerformanceMonitoring('MyComponent');
  
  // Track API call
  const data = await trackApiCall(
    () => fetchData(),
    'fetchData'
  );
  
  // Track interaction
  const handleClick = trackInteraction('button_click', async () => {
    // Your handler
  });
  
  return <button onClick={handleClick}>Click</button>;
};

// Web Vitals (add to App.tsx)
const App = () => {
  useWebVitals();
  // ...
};
```

### Web Vitals

Web Vitals are automatically tracked when `useWebVitals()` is called in `App.tsx`:

- **LCP (Largest Contentful Paint)** - Loading performance
- **FID (First Input Delay)** - Interactivity
- **CLS (Cumulative Layout Shift)** - Visual stability

---

## 📝 Writing Tests

### Component Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent.tsx';

test('renders correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Hook Test Example

```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from './useMyHook.ts';

test('updates state', () => {
  const { result } = renderHook(() => useMyHook());
  
  act(() => {
    result.current.increment();
  });
  
  expect(result.current.value).toBe(1);
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user flow', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
  await expect(page.locator('.result')).toBeVisible();
});
```

---

## 🔧 Configuration

### Jest Configuration

- `jest.config.cjs` - Jest setup
- `tests/setup.ts` - Test setup file

### Playwright Configuration

- `playwright.config.ts` - Playwright setup

### Environment Variables

Add to `.env.local`:

```env
# Sentry
VITE_SENTRY_DSN=your-dsn
VITE_SENTRY_ORG=your-org
VITE_SENTRY_PROJECT=your-project
VITE_SENTRY_AUTH_TOKEN=your-token

# PostHog
VITE_POSTHOG_API_KEY=your-key
VITE_POSTHOG_HOST=https://app.posthog.com
```

---

## 📈 Monitoring Dashboard

### Sentry Dashboard

- View errors: https://sentry.io
- Performance monitoring
- Session replay
- Release tracking

### PostHog Dashboard

- View analytics: https://app.posthog.com
- User behavior
- Conversion funnels
- Feature flags (if enabled)

---

## ✅ Checklist

- [x] Jest + React Testing Library configured
- [x] Playwright E2E tests configured
- [x] Sentry error tracking configured
- [x] PostHog analytics configured
- [x] Performance monitoring hooks created
- [x] Web Vitals tracking enabled
- [x] Example test files created
- [x] Documentation created

---

## 🚀 Next Steps

1. **Add environment variables** to Vercel/production
2. **Write tests** for critical paths
3. **Monitor errors** in Sentry dashboard
4. **Analyze user behavior** in PostHog dashboard
5. **Optimize performance** based on Web Vitals data

---

**END OF GUIDE**
