# Contributing to Jekyll Chirpy CMS Panel

Thank you for considering contributing to this project! We welcome contributions from everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue on GitHub with:

- A clear, descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, browser, Node version)

### Suggesting Features

We love feature suggestions! Please create an issue with:

- A clear description of the feature
- Why this feature would be useful
- Any examples of similar features elsewhere

### Pull Requests

1. **Fork the repository**

   ```bash
   git fork https://github.com/dollarboysushil/CMS.git
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments where necessary
   - Test your changes thoroughly

4. **Commit your changes**

   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/AmazingFeature
   ```

6. **Open a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Include screenshots for UI changes

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/CMS.git
cd CMS

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
npm run dev
```

## Code Style Guidelines

- **TypeScript**: Use TypeScript for all new code
- **Components**: Use functional components with hooks
- **Naming**: Use descriptive names for variables and functions
- **Comments**: Add comments for complex logic
- **Formatting**: Code will be formatted automatically (if configured)

## Testing

Before submitting a PR, test your changes:

- Create a new draft
- Edit existing drafts
- Publish a draft to GitHub
- Upload and manage images
- Test on different screen sizes
- Check browser console for errors

## Areas We Need Help With

- 🎨 **UI/UX Improvements** - Better designs and user experience
- 📱 **Mobile Responsiveness** - Improve mobile editing experience
- 🧪 **Testing** - Add unit and integration tests
- 📝 **Documentation** - Improve docs and add tutorials
- 🌍 **Localization** - Add support for multiple languages
- ⚡ **Performance** - Optimize loading and performance
- 🔒 **Security** - Identify and fix security issues

## Questions?

Feel free to open an issue with the `question` label or start a discussion.

## Code of Conduct

Be respectful and inclusive. We're all here to learn and build something useful together.

---

Thank you for contributing! 🎉
