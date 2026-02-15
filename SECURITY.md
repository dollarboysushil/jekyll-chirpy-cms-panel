# Security Implementation Guide

## 🔒 Security Features Implemented

Your CMS application now includes multiple layers of security to protect your sensitive data and prevent common attacks.

### 1. **Rate Limiting**

Protects against brute force attacks and abuse:

- **Login endpoint**: 5 attempts per 15 minutes per IP
- **Image uploads**: 20 uploads per 5 minutes per IP
- **Draft updates**: 60 updates per minute per IP
- **Publishing**: 10 publishes per hour per IP

All rate-limited responses include `X-RateLimit-*` headers and `Retry-After` header.

### 2. **Security Headers**

Multiple security headers are automatically added to all responses:

- **X-Frame-Options**: `DENY` - Prevents clickjacking attacks
- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-XSS-Protection**: `1; mode=block` - Enables browser XSS protection
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Permissions-Policy**: Disables unnecessary browser features (camera, microphone, etc.)
- **Content-Security-Policy**: Restricts resource loading to trusted sources
- **Strict-Transport-Security**: Forces HTTPS in production (HSTS)

### 3. **Input Validation & Sanitization**

All user inputs are validated and sanitized:

- **Filename validation**: Prevents directory traversal and invalid characters
- **UUID validation**: Ensures valid draft/resource IDs
- **Image validation**: Type checking, size limits (10MB max)
- **String sanitization**: Prevents XSS attacks
- **Draft data validation**: Type checking, length limits

### 4. **Authentication Security**

- **JWT tokens**: Secure token-based authentication
- **HTTP-only cookies**: Prevents XSS token theft
- **Secure flag**: Enabled in production for HTTPS-only cookies
- **SameSite**: Set to 'lax' to prevent CSRF attacks
- **Token expiration**: 7-day expiration for sessions
- **Login delays**: 1-second delay on failed login attempts

### 5. **Environment Variable Protection**

- **`.env` in .gitignore**: Prevents accidental commits of secrets
- **Startup validation**: Checks for required environment variables
- **Minimum requirements**: Enforces password and secret key length

### 6. **Additional Security Measures**

- **Powered-By header removal**: Hides Next.js version information
- **Request size limits**: 2MB body size limit for server actions
- **Error handling**: Sanitized error messages (no sensitive data leakage)
- **Middleware protection**: All routes require authentication except login
- **Image cleanup**: Uploaded images are deleted after publish/delete

## 🚨 Important Security Reminders

### 1. **Never Commit Secrets**

Your `.env` file contains sensitive credentials. It's already in `.gitignore`, but double-check:

```bash
git status
```

If `.env` appears, immediately add it to `.gitignore` and remove it from git history.

### 2. **Use Strong Passwords**

Update your `ADMIN_PASSWORD` to be:

- At least 12 characters long
- Mix of uppercase, lowercase, numbers, and symbols
- Not a common password or dictionary word

### 3. **Rotate Tokens Regularly**

Consider rotating these periodically:

- `GITHUB_TOKEN`
- `AUTH_SECRET`
- `ADMIN_PASSWORD`

### 4. **Monitor Rate Limits**

Check your application logs for rate limit hits. Excessive hits may indicate:

- An attack attempt
- A misconfigured client
- Need to adjust rate limits

### 5. **HTTPS Only in Production**

Always deploy with HTTPS enabled. Vercel provides this automatically.

### 6. **Database Security**

Your Postgres connection:

- Uses SSL by default (`sslmode=require`)
- Should only be accessible from Vercel
- Credentials should never be shared

### 7. **GitHub Token Permissions**

Your `GITHUB_TOKEN` should have:

- ✅ `repo` access (for writing posts)
- ❌ No admin permissions
- ❌ No access to other repositories

Consider using a fine-grained token with minimal permissions.

## 🔍 Security Best Practices

### Environment Variables on Vercel

When deploying to Vercel:

1. **Add all environment variables** in Vercel Dashboard
2. **Never hardcode secrets** in your code
3. **Use different secrets** for preview vs production deployments
4. **Enable Vercel Authentication** for additional protection

### Monitoring

Consider adding:

- Error tracking (e.g., Sentry)
- Uptime monitoring
- Log aggregation (Vercel provides basic logs)

### Regular Updates

Keep dependencies updated:

```bash
npm audit
npm update
```

## ⚠️ Current Limitations

### In-Memory Rate Limiting

Rate limiting currently uses in-memory storage, which:

- ✅ Works well for single-instance deployments
- ❌ Resets on server restart
- ❌ Not shared across serverless function instances

**For production at scale**, consider:

- Vercel KV (Redis-based)
- Upstash Redis
- Vercel Edge Config

### Single Password Authentication

Current authentication uses a single admin password. Consider upgrading to:

- Multiple user accounts
- OAuth integration
- Two-factor authentication (2FA)

## 📋 Security Checklist

Before going to production:

- [ ] Strong `ADMIN_PASSWORD` (12+ characters)
- [ ] Long `AUTH_SECRET` (32+ characters)
- [ ] All secrets in Vercel environment variables
- [ ] `.env` never committed to git
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] GitHub token has minimal required permissions
- [ ] Database credentials secured and SSL enabled
- [ ] Regular dependency updates scheduled
- [ ] Error monitoring enabled
- [ ] Backup strategy in place

## 🛡️ Incident Response

If you suspect a security breach:

1. **Immediately rotate all secrets**:
   - `ADMIN_PASSWORD`
   - `AUTH_SECRET`
   - `GITHUB_TOKEN`
   - Database password

2. **Review access logs** in Vercel Dashboard

3. **Check for unauthorized**:
   - Posts in your GitHub repository
   - Drafts in your database
   - Uploaded images in Blob storage

4. **Update and redeploy** your application

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Security](https://vercel.com/docs/security)
- [Next.js Security](https://nextjs.org/docs/pages/building-your-application/configuring/security-headers)

---

**Last Updated**: Security features implemented on February 15, 2026
