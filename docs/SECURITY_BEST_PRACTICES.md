# Security Best Practices for Beauty Platform

To ensure the security of the platform and prevent future secret leaks, please follow these guidelines.

## 1. Environment Variable Management
- **Local Dev**: Use `.env.local` for local secrets. This file is ignored by Git recursively.
- **NEVER** commit files ending in `.env`, `.env.local`, or `.env.vercel` to the repository.
- **NEVER** use real secrets in `env.example` or any documentation files. Use placeholders like `YOUR_SECRET_HERE`.

## 2. Supabase Key Types
- **Anon Key** (sb_publishable_...): Publicly accessible, safe for build scripts and frontend.
- **Service Role Key** (sb_secret_...): **CRITICAL SECRET**. Only use in server-side scripts or Edge Functions. NEVER expose in the frontend.

## 3. Secret Rotation
If a secret is leaked:
1. **Rotate immediately** in the provider's dashboard (Supabase, Resend, Vercel).
2. Update the environment variables in Vercel/Supabase.
3. Update local `.env.local`.
4. **DO NOT** document the leaked secret itself in the codebase.

## 4. Pre-push Security Audit
Before pushing code, run the audit script to ensure no secrets are being accidentally committed:
```bash
node scripts/security-audit.js
```

## 5. Cleaning Git History
If a secret was committed to Git:
1. Invalidate the secret immediately.
2. Use **BFG Repo-Cleaner** to purge the string from the history:
   ```bash
   bfg --replace-text passwords.txt
   ```
3. Force push to the remote repository.
