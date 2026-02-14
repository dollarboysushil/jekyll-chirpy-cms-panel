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
