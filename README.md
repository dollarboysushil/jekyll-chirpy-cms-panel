# Jekyll CMS Panel

A modern, self-hosted CMS panel for managing Jekyll blog posts with a rich text editor, image optimization, and seamless GitHub integration.

## Features

- 📝 **Rich Text Editor** - Tiptap-based Medium-style editor
- 🖼️ **Image Optimization** - Automatic WebP conversion with Sharp
- 💾 **Auto-Save** - Content saved every 5 seconds
- 🚀 **GitHub Publishing** - One-click publish to Jekyll blog
- 🔒 **Secure Authentication** - Token-based auth with middleware
- 📦 **Vercel Integration** - Postgres database and Blob storage
- 🎨 **Clean UI** - Tailwind CSS with responsive design

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: Vercel Postgres
- **Storage**: Vercel Blob
- **Editor**: Tiptap
- **Styling**: Tailwind CSS
- **GitHub**: Octokit
- **Image Processing**: Sharp
- **Markdown**: Turndown

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Vercel Postgres (auto-injected by Vercel)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# Vercel Blob (auto-injected by Vercel)
BLOB_READ_WRITE_TOKEN=

# GitHub Integration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=your_jekyll_repo_name

# Authentication
ADMIN_PASSWORD=your_secure_password
AUTH_SECRET=your_random_secret_key
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 3. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scope: `repo` (Full control of private repositories)
4. Copy the token and add to `.env`

### 4. Initialize Database

Run the setup endpoint to create database tables:

```bash
# After deploying to Vercel or running locally
curl http://localhost:3000/api/setup
# or visit in browser: http://localhost:3000/api/setup
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Deploy to Vercel

```bash
vercel
```

Or push to GitHub and connect with Vercel dashboard.

## Usage

### Creating a Post

1. Login with your admin password
2. Click "New Draft"
3. Start writing in the editor
4. Add title, slug, category, and tags
5. Upload images by dragging/dropping or clicking the image icon
6. Content auto-saves every 5 seconds
7. Click "Publish" when ready

### Publishing Flow

When you publish a post:

1. Drafts are converted from Tiptap JSON to Markdown
2. Images are uploaded to GitHub (`assets/img/posts/`)
3. Jekyll frontmatter is generated automatically
4. Post file is created in `_posts/` directory
5. Temporary images are deleted from Vercel Blob
6. Vercel auto-rebuilds your Jekyll blog

### Jekyll Frontmatter Format

```yaml
---
title: "Post Title"
date: 2025-02-15 14:30:00 +0545
categories: [Category]
tags: [tag1, tag2, tag3]
image:
  path: /assets/img/posts/slug/cover.webp
  alt: "Alt text"
---
```

## Project Structure

```
panel/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── drafts/        # Draft CRUD operations
│   │   ├── images/        # Image upload
│   │   └── setup/         # Database initialization
│   ├── drafts/            # Drafts list page
│   ├── editor/[id]/       # Editor page
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/
│   ├── editor/            # Tiptap editor components
│   ├── ui/                # Reusable UI components
│   └── DraftCard.tsx      # Draft list item
├── lib/
│   ├── db.ts              # Database operations
│   ├── storage.ts         # Blob storage operations
│   ├── github.ts          # GitHub API integration
│   ├── image-processor.ts # Image optimization
│   ├── jekyll-generator.ts # Markdown generation
│   └── auth.ts            # Authentication
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── middleware.ts          # Route protection

```

## API Routes

### Authentication

- `POST /api/auth/login` - Login with password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify authentication

### Drafts

- `GET /api/drafts` - List all drafts
- `POST /api/drafts` - Create new draft
- `GET /api/drafts/[id]` - Get single draft
- `PATCH /api/drafts/[id]` - Update draft
- `DELETE /api/drafts/[id]` - Delete draft
- `POST /api/drafts/[id]/publish` - Publish to GitHub

### Images

- `POST /api/images/upload` - Upload and optimize image

### Setup

- `GET /api/setup` - Initialize database tables

## Security Features

- ✅ JWT-based authentication with httpOnly cookies
- ✅ Middleware protection for all routes
- ✅ GitHub token stored server-side only
- ✅ Input validation and sanitization
- ✅ Secure password verification

## Image Processing

Images are automatically:

- Converted to WebP format (85% quality)
- Resized to max width of 1200px
- Optimized for web delivery
- Uploaded to Vercel Blob (temporary)
- Moved to GitHub on publish
- Deleted from Blob after successful publish

## Troubleshooting

### Database Connection Error

Ensure Vercel Postgres environment variables are set correctly.

### GitHub Upload Failed

- Check GitHub token has `repo` scope
- Verify repository owner and name are correct
- Ensure repository exists and is accessible

### Image Upload Failed

- Check Vercel Blob token is set
- Ensure image file is valid
- Check file size (keep under 4MB)

### Auto-save Not Working

- Check browser console for errors
- Verify authentication token is valid
- Ensure draft ID is correct

## Development

### Adding New Tiptap Extensions

Edit `components/editor/TiptapEditor.tsx`:

```typescript
import NewExtension from "@tiptap/extension-new";

// Add to extensions array
const editor = useEditor({
  extensions: [
    // ... existing extensions
    NewExtension,
  ],
});
```

### Customizing Jekyll Frontmatter

Edit `lib/jekyll-generator.ts` to modify the frontmatter format.

### Changing Editor Styles

Edit `app/globals.css` under the "Tiptap Editor Styles" section.

## License

MIT

## Support

For issues and questions, please create an issue on GitHub.

---

Built with ❤️ using Next.js 14, Vercel, and Jekyll
