import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_REPO_OWNER!;
const repo = process.env.GITHUB_REPO_NAME!;

/**
 * Upload a file to GitHub repository
 */
export async function uploadFile(
  path: string,
  content: Buffer | string,
  message: string
): Promise<string> {
  try {
    // Convert content to base64
    const contentBase64 = typeof content === 'string' 
      ? Buffer.from(content).toString('base64')
      : content.toString('base64');

    // Check if file exists to get SHA for update
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      if ('sha' in data) {
        sha = data.sha;
      }
    } catch (error: any) {
      // File doesn't exist, that's fine
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update file
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: contentBase64,
      ...(sha && { sha }),
    });

    return data.commit.sha!;
  } catch (error) {
    console.error('Error uploading file to GitHub:', error);
    throw new Error('Failed to upload file to GitHub');
  }
}

/**
 * Upload an image to GitHub
 */
export async function uploadImage(
  path: string,
  imageBuffer: Buffer
): Promise<void> {
  await uploadFile(path, imageBuffer, `Add image: ${path}`);
}

/**
 * Create or update a blog post
 */
export async function createPost(
  filename: string,
  content: string,
  message: string
): Promise<{ sha: string }> {
  const path = `_posts/${filename}`;
  const sha = await uploadFile(path, content, message);
  return { sha };
}

/**
 * Delete a file from GitHub repository
 */
export async function deleteFile(
  path: string,
  message: string
): Promise<void> {
  try {
    // Get file to get SHA
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    if ('sha' in data) {
      await octokit.repos.deleteFile({
        owner,
        repo,
        path,
        message,
        sha: data.sha,
      });
    }
  } catch (error) {
    console.error('Error deleting file from GitHub:', error);
    throw new Error('Failed to delete file from GitHub');
  }
}

/**
 * Get repository information
 */
export async function getRepoInfo() {
  try {
    const { data } = await octokit.repos.get({
      owner,
      repo,
    });
    return data;
  } catch (error) {
    console.error('Error fetching repo info:', error);
    throw new Error('Failed to fetch repository information');
  }
}

/**
 * Verify GitHub token and repository access
 */
export async function verifyGitHubAccess(): Promise<boolean> {
  try {
    await getRepoInfo();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get all posts from _posts directory
 */
export async function getAllPosts() {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: '_posts',
      ref: 'main', // Explicitly fetch from main branch
    });

    if (!Array.isArray(data)) {
      throw new Error('Expected directory listing');
    }

    // Filter for markdown files and map to post info
    const posts = data
      .filter((file) => file.name.endsWith('.md'))
      .map((file) => ({
        name: file.name,
        path: file.path,
        sha: file.sha,
        url: file.html_url,
        downloadUrl: file.download_url,
      }))
      .sort((a, b) => b.name.localeCompare(a.name)); // Sort by date (newest first)

    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw new Error('Failed to fetch posts from GitHub');
  }
}

/**
 * Get a single post content
 */
export async function getPost(filename: string) {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: `_posts/${filename}`,
      ref: 'main', // Explicitly fetch from main branch
    });

    if (Array.isArray(data) || !('content' in data)) {
      throw new Error('Expected file content');
    }

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    return {
      name: data.name,
      path: data.path,
      sha: data.sha,
      content,
      url: data.html_url,
    };
  } catch (error) {
    console.error('Error fetching post:', error);
    throw new Error('Failed to fetch post from GitHub');
  }
}

/**
 * Update a post in _posts directory
 */
export async function updatePost(filename: string, content: string, commitMessage?: string) {
  try {
    const path = `_posts/${filename}`;
    const message = commitMessage || `Update post: ${filename}`;
    
    const url = await uploadFile(path, content, message);
    return { success: true, url };
  } catch (error) {
    console.error('Error updating post:', error);
    throw new Error('Failed to update post on GitHub');
  }
}
