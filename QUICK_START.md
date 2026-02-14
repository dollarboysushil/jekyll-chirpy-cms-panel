# 🚀 Quick Start Guide

## Next Steps to Get Your CMS Running

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Next.js 14
- Tiptap editor
- Vercel Postgres & Blob
- Sharp (image processing)
- Octokit (GitHub integration)
- And more...

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with these variables:

```env
# Vercel Postgres (get these from Vercel dashboard after connecting database)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# Vercel Blob (get this from Vercel dashboard after enabling blob storage)
BLOB_READ_WRITE_TOKEN=

# GitHub Integration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=your_jekyll_blog_repo

# Authentication
ADMIN_PASSWORD=choose_a_secure_password
AUTH_SECRET=generate_random_secret_below
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 3. Create GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Jekyll CMS Panel")
4. Select scope: **`repo`** (Full control of private repositories)
5. Click "Generate token"
6. Copy the token and add it to your `.env` file as `GITHUB_TOKEN`

### 4. Run Locally (Optional - for testing)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel
```

#### Option B: Using GitHub Integration

1. Push this code to a GitHub repository
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in the Vercel dashboard
6. Deploy!

### 6. Set Up Vercel Postgres & Blob

After deploying to Vercel:

1. **Enable Postgres:**
   - Go to your project in Vercel dashboard
   - Click "Storage" tab
   - Click "Create" → "Postgres"
   - This will automatically inject all POSTGRES\_\* environment variables

2. **Enable Blob Storage:**
   - In the same "Storage" tab
   - Click "Create" → "Blob"
   - This will automatically inject BLOB_READ_WRITE_TOKEN

3. **Redeploy** after enabling storage to apply environment variables

### 7. Initialize Database

After Postgres is connected, visit:

```
https://your-app.vercel.app/api/setup
```

This will create all necessary database tables.

### 8. Start Using Your CMS!

1. Visit your deployed URL: `https://your-app.vercel.app`
2. You'll be redirected to `/login`
3. Enter your `ADMIN_PASSWORD`
4. Start creating posts!

## Features Overview

### 📝 Creating a Post

1. Click "New Draft"
2. Enter title, slug, category, tags
3. Write content in the rich text editor
4. Add images by dragging/dropping or clicking image icon
5. Content auto-saves every 5 seconds

### 🚀 Publishing

1. Click "Publish" button when ready
2. The system will:
   - Convert your content to Markdown
   - Upload images to GitHub
   - Create Jekyll post file with proper frontmatter
   - Clean up temporary images
   - Trigger Vercel rebuild of your blog

### 🖼️ Image Handling

- All images are automatically converted to WebP
- Optimized to max 1200px width
- Stored temporarily in Vercel Blob during editing
- Moved to GitHub on publish (`assets/img/posts/`)
- Deleted from Blob after successful publish

## Troubleshooting

### TypeScript Errors Before Installing

The TypeScript errors you see are normal - they'll disappear after running `npm install`.

### Can't Connect to Database

Make sure you've:

1. Created a Postgres database in Vercel
2. Redeployed after adding the database
3. Visited `/api/setup` to initialize tables

### GitHub Upload Fails

Check:

1. GitHub token has `repo` scope
2. Repository owner and name are correct in `.env`
3. You have write access to the repository

### Images Not Uploading

Ensure:

1. Blob storage is enabled in Vercel
2. `BLOB_READ_WRITE_TOKEN` is set
3. Image file size is under 4MB

## File Structure Summary

```
panel.dollarboysushil.com/
├── app/
│   ├── api/               # All API endpoints
│   │   ├── auth/          # Login, logout, verify
│   │   ├── drafts/        # CRUD operations
│   │   ├── images/        # Image upload
│   │   └── setup/         # Database init
│   ├── drafts/            # Drafts list page
│   ├── editor/[id]/       # Rich text editor
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/
│   ├── editor/            # Tiptap editor components
│   ├── ui/                # Button, Input, Card
│   └── DraftCard.tsx      # Draft preview card
├── lib/
│   ├── db.ts              # Postgres operations
│   ├── storage.ts         # Blob operations
│   ├── github.ts          # GitHub API
│   ├── image-processor.ts # WebP conversion
│   ├── jekyll-generator.ts # Markdown generation
│   └── auth.ts            # JWT authentication
├── hooks/
│   ├── useDebounce.ts     # For auto-save
│   └── useAuth.ts         # Auth state management
├── types/
│   └── index.ts           # TypeScript definitions
├── middleware.ts          # Route protection
├── package.json           # Dependencies
└── .env.example           # Environment template
```

## Security Best Practices

✅ Never commit `.env` file to Git
✅ Use strong passwords for `ADMIN_PASSWORD`
✅ Keep GitHub token secure - never expose client-side
✅ Rotate `AUTH_SECRET` periodically
✅ Use HTTPS in production (automatic with Vercel)

## Support

Read the full [README.md](README.md) for detailed documentation.

---

**You're all set!** 🎉 Install dependencies, configure environment variables, and deploy to Vercel.
