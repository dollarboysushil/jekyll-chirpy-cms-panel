# 🚀 Quick Start Guide - Jekyll Chirpy CMS Panel

## Get Your Cloud-Based CMS Running in 5 Minutes

This guide will help you deploy your own Jekyll Chirpy CMS Panel on Vercel's free tier.

### What You'll Need

- A GitHub account with a Jekyll Chirpy blog
- A Vercel account (sign up at [vercel.com](https://vercel.com))
- 5 minutes of your time

---

## Step-by-Step Setup

### 1. Deploy to Vercel

**Option A: One-Click Deploy (Recommended)**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dollarboysushil/CMS)

Click the button above and follow the Vercel deployment wizard.

**Option B: Manual Deploy**

```bash
# Clone the repository
git clone https://github.com/dollarboysushil/CMS.git
cd CMS

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 2. Set Up Vercel Postgres

After deployment:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Storage** tab
4. Click **Create Database** → **Postgres**
5. Click **Connect**

✅ This automatically injects all database environment variables!

### 3. Set Up Vercel Blob Storage

In the same **Storage** tab:

1. Click **Create** → **Blob**
2. That's it!

✅ This automatically injects `BLOB_READ_WRITE_TOKEN`!

### 4. Create GitHub Personal Access Token

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Name it: `Jekyll CMS Panel`
4. **Important**: Select scope ✅ **repo** (Full control of repositories)
5. Click **Generate token**
6. **Copy the token** (you won't see it again!)

### 5. Configure Environment Variables

Back in Vercel:

1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables:

```env
# GitHub Integration
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_REPO_OWNER=your-github-username
GITHUB_REPO_NAME=your-jekyll-blog-repo

# Authentication
ADMIN_PASSWORD=Choose_A_Strong_Password_Here
AUTH_SECRET=Generate_this_below
```

**To generate AUTH_SECRET:**

On your local machine, run:

```bash
openssl rand -base64 32
```

Copy the output and paste it as `AUTH_SECRET` value.

**If you don't have OpenSSL**, use any random 32+ character string like:

```
abcdef1234567890ABCDEF1234567890ghijkl
```

3. Click **Save**
4. Vercel will automatically redeploy with new variables

### 6. Initialize Database

After redeployment completes:

Visit: `https://your-app-name.vercel.app/api/setup`

You should see:

```json
{
  "success": true,
  "message": "Database initialized successfully"
}
```

### 7. Login & Start Writing! 🎉

1. Go to your app URL: `https://your-app-name.vercel.app`
2. Login with your `ADMIN_PASSWORD`
3. Click **"New Draft"** to create your first post
4. Start writing!

---

## 📝 Usage Tips

### Creating Your First Post2. **Enable Blob Storage:**

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

##

1. Click **"New Draft"**
2. Fill in the metadata:
   - **Title**: Your post title
   - **Slug**: URL-friendly version (auto-generated)
   - **Category**: e.g., `Tech`, `Blogging`
   - **Tags**: Comma-separated tags
3. Start writing in the rich editor
4. Add images by:
   - Drag & drop into editor
   - Click the image icon in toolbar
   - Paste from clipboard
5. Content auto-saves every 5 seconds ✅

### Publishing Your Post

1. Click **"Publish"** button when ready
2. The CMS will automatically:
   - ✅ Convert HTML to Markdown
   - ✅ Upload images to GitHub (`assets/img/post_media/`)
   - ✅ Generate Jekyll frontmatter
   - ✅ Create post file in `_posts/`
   - ✅ Clean up temporary images
   - ✅ Trigger GitHub Pages rebuild

### Managing Posts

**Three views available:**

- **All Posts** - See everything at once
- **Drafts** - Work-in-progress posts
- **Published** - Live posts on your blog

**Actions:**

- 📝 **Edit** - Click any draft to edit
- 🗑️ **Delete** - Remove published posts from GitHub
- 👁️ **View** - Preview published posts

---

## 🔧 Customization

### Change Jekyll Frontmatter Format

Edit `lib/jekyll-generator.ts` to customize your frontmatter structure.

### Add Custom Editor Features

Edit `components/editor/TiptapEditor.tsx` to add more Tiptap extensions.

### Modify Styles

Edit `app/globals.css` - Look for "Tiptap Editor Styles" section.

---

## 🐛 Common Issues

### "Unauthorized" error

- Check you're logged in
- Try logging out and back in
- Verify `AUTH_SECRET` is set

### Database connection error

- Ensure Postgres is connected in Vercel Storage tab
- Visit `/api/setup` to initialize tables
- Check environment variables are set

### GitHub push failed

- Verify `GITHUB_TOKEN` has `repo` scope
- Check `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` are correct
- Ensure you have write access to the repository

### Images not uploading

- Verify Blob storage is enabled
- Check `BLOB_READ_WRITE_TOKEN` is set
- Ensure image is under 10MB

### Auto-save not working

- Check browser console for errors
- Verify you're authenticated
- Check network tab for failed requests

---

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed features
- Check [SECURITY.md](SECURITY.md) for security best practices
- Star the repository if you find it useful! ⭐

---

## 💡 Pro Tips

1. **Use keyboard shortcuts**:
   - `Ctrl/Cmd + B` for bold
   - `Ctrl/Cmd + I` for italic
   - `Ctrl/Cmd + K` for links

2. **Image optimization**: All images are automatically converted to WebP and resized for optimal web performance

3. **Markdown view**: Click the "Markdown" tab in the editor to see the raw markdown source

4. **Auto-save**: Content is saved every 5 seconds, but you can manually save anytime

5. **Slug auto-generation**: Leave the slug empty to auto-generate from title

---

## 🎉 You're Ready!

Your cloud-based Jekyll CMS is now running. No more local editing, no more Jekyll dependencies.

**Write from anywhere. Deploy instantly. It's that simple.**

Need help? [Open an issue](https://github.com/dollarboysushil/CMS/issues) on GitHub.

---

**You're all set!** 🎉 Install dependencies, configure environment variables, and deploy to Vercel.
