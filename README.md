# Jekyll Chirpy CMS Panel 🚀

A modern, cloud-based CMS panel for managing [Jekyll Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) blog posts. Edit, manage, and publish your blog posts from anywhere without the need for local Jekyll installation. Hosted entirely on Vercel's free tier with seamless GitHub integration.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dollarboysushil/Jekyll-chirpy-cms-panel)

## ✨ Why This CMS?

**No more local editing!** This CMSsolves the pain of editing Jekyll blogs locally by providing:

- ☁️ **100% Cloud-Based** - Edit from anywhere, any device
- 🆓 **Completely Free** - Hosted on Vercel's generous free tier
- 📝 **Rich Text Editor** - Medium-style WYSIWYG editing with Tiptap
- 🖼️ **Smart Image Management** - Automatic WebP conversion & GitHub upload
- 💾 **Auto-Save** - Never lose your work (saves every 5 seconds)
- 🚀 **One-Click Publishing** - Direct publish to GitHub Pages
- 🔒 **Secure** - Token-based authentication with comprehensive security features
- 🎨 **Clean UI** - Modern, responsive design with Tailwind CSS

## 🎬 Demo

![Jekyll Chirpy CMS Panel Demo](https://via.placeholder.com/800x450/4F46E5/FFFFFF?text=Demo+Screenshot)

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│    Vercel    │─────▶│   GitHub    │
│  (Editor)   │      │  (Next.js)   │      │   (Blog)    │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├─▶ Postgres (Drafts)
                            └─▶ Blob Storage (Temp Images)
```

## 🚀 Quick Start

### Prerequisites

1. A GitHub account with a Jekyll Chirpy blog repository
2. A Vercel account (free tier)
3. That's it! No local dependencies needed.

### One-Click Deploy

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Follow the setup wizard below

### Manual Setup

#### 1. Clone & Deploy

```bash
git clone https://github.com/dollarboysushil/CMS.git
cd CMS
```

Deploy to Vercel:

```bash
npm i -g vercel
vercel
```

#### 2. Enable Vercel Postgres

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database** → **Postgres**
4. Click **Connect** - This auto-injects all database environment variables

#### 3. Enable Vercel Blob Storage

1. In the same **Storage** tab
2. Click **Create** → **Blob**
3. This auto-injects `BLOB_READ_WRITE_TOKEN`

#### 4. Create GitHub Personal Access Token

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Name it: `Jekyll CMS Panel`
4. Select scope: ✅ **repo** (Full control of repositories)
5. Click **Generate token** and copy it

#### 5. Configure Environment Variables

Go to **Settings** → **Environment Variables** in Vercel and add:

```env
# GitHub Integration (Required)
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO_OWNER=your-github-username
GITHUB_REPO_NAME=your-blog-repo-name

# Authentication (Required)
ADMIN_PASSWORD=your_secure_password
AUTH_SECRET=generate_with_openssl_rand_base64_32
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

#### 6. Initialize Database

After deployment, visit:

```
https://your-app.vercel.app/api/setup
```

This creates the necessary database tables.

#### 7. Login & Start Writing!

Visit your app URL and login with your `ADMIN_PASSWORD`.

## 📖 Features in Detail

### Rich Text Editor

- **Tiptap-powered** WYSIWYG editor
- Headings, bold, italic, lists, code blocks, blockquotes
- Link insertion and editing
- Image upload via drag-and-drop or paste
- Markdown source view for power users

### Image Management

- **Automatic optimization**: WebP conversion at 85% quality
- **Smart resizing**: Max width 1200px for web performance
- **Organized structure**: Images stored in `assets/img/post_media/`
- **Temporary storage**: Uses Vercel Blob until published
- **Auto-cleanup**: Removes temp files after publishing

### Publishing Workflow

1. **Write** - Create drafts with rich text editor
2. **Preview** - See how it looks before publishing
3. **Publish** - One-click publish to GitHub
   - Converts HTML to Markdown
   - Uploads images to GitHub
   - Generates Jekyll frontmatter
   - Creates post file in `_posts/`
   - Triggers GitHub Pages rebuild

### Three Views for Every Post

- **All Posts** - See everything at a glance
- **Drafts** - Work-in-progress posts
- **Published** - Live posts on your blog

### Security Features

- JWT authentication with httpOnly cookies
- Rate limiting on all endpoints
- Input validation and sanitization
- Security headers (CSP, HSTS, etc.)
- Middleware route protection

## 🗂️ Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/              # Login, logout, verify
│   │   ├── drafts/            # CRUD operations for drafts
│   │   │   └── [id]/
│   │   │       └── publish/   # Publish draft to GitHub
│   │   ├── images/            # Image upload & optimization
│   │   ├── posts/             # Fetch & manage GitHub posts
│   │   ├── github-image/      # GitHub image proxy
│   │   └── setup/             # Database initialization
│   ├── home/                  # Main dashboard (all posts)
│   ├── editor/[id]/           # Rich text editor
│   ├── posts/[filename]/      # View published posts
│   └── login/                 # Authentication
├── components/
│   ├── editor/                # Tiptap editor components
│   │   ├── TiptapEditor.tsx   # Main editor
│   │   ├── Toolbar.tsx        # Editor toolbar
│   │   └── AutoSave.tsx       # Auto-save logic
│   ├── ui/                    # Reusable UI components
│   └── DraftCard.tsx          # Post card component
├── lib/
│   ├── db.ts                  # Database operations
│   ├── storage.ts             # Vercel Blob operations
│   ├── github.ts              # GitHub API integration
│   ├── image-processor.ts     # Sharp image optimization
│   ├── jekyll-generator.ts    # Markdown & frontmatter
│   ├── markdown-converter.ts  # HTML ↔ Markdown
│   ├── auth.ts                # JWT authentication
│   ├── validation.ts          # Input validation
│   └── rate-limit.ts          # Rate limiting
├── types/
│   └── index.ts               # TypeScript type definitions
└── middleware.ts              # Route protection

```

## 🔧 Tech Stack

| Category      | Technology                |
| ------------- | ------------------------- |
| **Framework** | Next.js 14 (App Router)   |
| **Language**  | TypeScript                |
| **Database**  | Vercel Postgres (Neon)    |
| **Storage**   | Vercel Blob               |
| **Editor**    | Tiptap (ProseMirror)      |
| **Styling**   | Tailwind CSS              |
| **GitHub**    | Octokit REST API          |
| **Images**    | Sharp (WebP conversion)   |
| **Markdown**  | Turndown, Unified, Remark |
| **Auth**      | JWT (Jose)                |
| **Hosting**   | Vercel (Free Tier)        |

## 📋 API Routes

### Authentication

- `POST /api/auth/login` - Login with password
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/verify` - Check auth status

### Drafts

- `GET /api/drafts` - List all drafts
- `POST /api/drafts` - Create new draft
- `GET /api/drafts/[id]` - Get draft by ID
- `PATCH /api/drafts/[id]` - Update draft
- `DELETE /api/drafts/[id]` - Delete draft
- `POST /api/drafts/[id]/publish` - Publish to GitHub

### Posts

- `GET /api/posts` - List GitHub posts
- `GET /api/posts/[filename]` - Get post content
- `PUT /api/posts/[filename]` - Update published post
- `DELETE /api/posts/[filename]` - Delete from GitHub

### Images

- `POST /api/images/upload` - Upload & optimize image
- `GET /api/github-image` - Proxy GitHub images

### Setup

- `GET /api/setup` - Initialize database tables

## 🔐 Security

This CMS implements multiple security layers:

- **Authentication**: JWT tokens with httpOnly cookies
- **Rate Limiting**: Prevents brute force and abuse
- **Input Validation**: Sanitizes all user inputs
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Environment Variables**: Secrets never exposed to client
- **Middleware Protection**: All routes require authentication

See [SECURITY.md](SECURITY.md) for detailed security information.

## 🎨 Customization

### Modify Jekyll Frontmatter

Edit `lib/jekyll-generator.ts`:

```typescript
export function generateJekyllFrontmatter(draft: Draft): string {
  // Customize your frontmatter format here
  const frontmatter = {
    title: draft.title,
    date: formatDate(new Date()),
    categories: [draft.category],
    tags: draft.tags,
    // Add custom fields
  };
  return ..;
}
```

### Add Tiptap Extensions

Edit `components/editor/TiptapEditor.tsx`:

```typescript
import CustomExtension from "@tiptap/extension-custom";

const editor = useEditor({
  extensions: [
    StarterKit,
    Image,
    Link,
    CustomExtension.configure({
      /* options */
    }),
  ],
});
```

### Customize Styles

Edit `app/globals.css` - Look for the "Tiptap Editor Styles" section.

## 🐛 Troubleshooting

### Database Connection Failed

- Ensure Vercel Postgres is properly connected
- Check environment variables are set
- Visit `/api/setup` to initialize tables

### GitHub Push Failed

- Verify GitHub token has `repo` scope
- Check `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` are correct
- Ensure repository exists and is accessible

### Image Upload Failed

- Verify Vercel Blob is enabled
- Check `BLOB_READ_WRITE_TOKEN` is set
- Ensure image is under 10MB

### Auto-Save Not Working

- Check browser console for errors
- Verify you're authenticated
- Check network tab for failed requests

## 📝 Development

### Local Development

```bash
# Clone repository
git clone https://github.com/dollarboysushil/CMS.git
cd CMS

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Jekyll](https://jekyllrb.com/) - Static site generator
- [Chirpy Theme](https://github.com/cotes2020/jekyll-theme-chirpy) - Beautiful Jekyll theme
- [Next.js](https://nextjs.org/) - React framework
- [Vercel](https://vercel.com/) - Hosting platform
- [Tiptap](https://tiptap.dev/) - Rich text editor
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/dollarboysushil/CMS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/dollarboysushil/CMS/discussions)

---

**Built with ❤️ for the Jekyll Chirpy community**

**No more local editing. Write from anywhere. Deploy instantly.**

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

**Built with ❤️ for the Jekyll Chirpy community**

**No more local editing. Write from anywhere. Deploy instantly.**
