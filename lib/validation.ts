/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize filename to prevent directory traversal and invalid characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) {
    throw new Error('Filename cannot be empty');
  }
  
  // Remove any directory traversal attempts
  const sanitized = filename
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim();
  
  if (!sanitized) {
    throw new Error('Invalid filename');
  }
  
  if (sanitized.length > 255) {
    throw new Error('Filename too long (max 255 characters)');
  }
  
  return sanitized;
}

/**
 * Validate and sanitize markdown filename
 */
export function validateMarkdownFilename(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  
  if (!sanitized.endsWith('.md')) {
    throw new Error('Filename must end with .md extension');
  }
  
  // Validate Jekyll date format if present (YYYY-MM-DD-title.md)
  const datePattern = /^\d{4}-\d{2}-\d{2}-/;
  if (datePattern.test(sanitized)) {
    const datePart = sanitized.substring(0, 10);
    const date = new Date(datePart);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format in filename. Use YYYY-MM-DD-title.md');
    }
  }
  
  return sanitized;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): void {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed');
  }
  
  // Max 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 10MB');
  }
  
  if (file.size === 0) {
    throw new Error('File is empty');
  }
}

/**
 * Validate UUID
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  const sanitized = input.trim();
  
  if (sanitized.length > maxLength) {
    throw new Error(`Input too long (max ${maxLength} characters)`);
  }
  
  return sanitized;
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const requiredVars = [
    'POSTGRES_URL',
    'BLOB_READ_WRITE_TOKEN',
    'GITHUB_TOKEN',
    'GITHUB_REPO_OWNER',
    'GITHUB_REPO_NAME',
    'ADMIN_PASSWORD',
    'AUTH_SECRET',
  ];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Validate AUTH_SECRET length
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
    errors.push('AUTH_SECRET must be at least 32 characters long');
  }
  
  // Validate password strength
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 8) {
    errors.push('ADMIN_PASSWORD should be at least 8 characters long');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate draft update data
 */
export function validateDraftUpdate(data: any): void {
  if (data.title !== undefined) {
    if (typeof data.title !== 'string') {
      throw new Error('Title must be a string');
    }
    if (data.title.length > 500) {
      throw new Error('Title too long (max 500 characters)');
    }
  }
  
  if (data.filename !== undefined) {
    validateMarkdownFilename(data.filename);
  }
  
  if (data.slug !== undefined) {
    if (typeof data.slug !== 'string') {
      throw new Error('Slug must be a string');
    }
    if (data.slug.length > 200) {
      throw new Error('Slug too long (max 200 characters)');
    }
  }
  
  if (data.excerpt !== undefined) {
    if (typeof data.excerpt !== 'string') {
      throw new Error('Excerpt must be a string');
    }
    if (data.excerpt.length > 5000) {
      throw new Error('Excerpt too long (max 5000 characters)');
    }
  }
  
  if (data.category !== undefined && data.category !== null) {
    if (typeof data.category !== 'string') {
      throw new Error('Category must be a string');
    }
    if (data.category.length > 100) {
      throw new Error('Category too long (max 100 characters)');
    }
  }
  
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      throw new Error('Tags must be an array');
    }
    if (data.tags.length > 50) {
      throw new Error('Too many tags (max 50)');
    }
    data.tags.forEach((tag: any) => {
      if (typeof tag !== 'string') {
        throw new Error('Each tag must be a string');
      }
      if (tag.length > 50) {
        throw new Error('Tag too long (max 50 characters)');
      }
    });
  }
}
