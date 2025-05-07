/**
 * Get a list of repositories for the authenticated user
 */
export const getRepositories = async (token: string) => {
  const response = await fetch('https://api.github.com/user/repos?sort=updated', {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch repositories: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Get a specific repository by owner and repo name
 */
export const getRepository = async (token: string, owner: string, repo: string) => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch repository: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Get repository contents at a specific path
 */
export const getRepositoryContents = async (
  token: string, 
  owner: string, 
  repo: string, 
  path: string = '',
  branch: string = 'main'
) => {
  const url = path 
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}` 
    : `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  if (!response.ok) {
    // If the repository is empty, GitHub returns a 404 for the root contents
    if (response.status === 404 && !path) {
      return [];
    }
    throw new Error(`Failed to fetch repository contents: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Get a list of branches for the repository
 */
export const getBranches = async (token: string, owner: string, repo: string) => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch branches: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Create a new repository
 */
export const createRepository = async (token: string, data: {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
}) => {
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create repository');
  }
  
  return await response.json();
};

/**
 * Upload a file to a repository
 */
export const uploadFile = async (
  token: string,
  owner: string,
  repo: string,
  path: string,
  file: File,
  message: string,
  branch: string = 'main'
) => {
  // Read the file as a base64 string
  const content = await readFileAsBase64(file);
  
  // GitHub API requires base64 encoding for file content
  const data = {
    message,
    content,
    branch
  };
  
  // Check if the file already exists to determine if we need to update or create
  try {
    const existingFile = await getFileContent(token, owner, repo, path, branch);
    
    if (existingFile) {
      // If file exists, we need to provide the SHA to update it
      data['sha'] = existingFile.sha;
    }
  } catch (error) {
    // File doesn't exist, which is fine for creating a new file
  }
  
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to upload file');
  }
  
  return await response.json();
};

/**
 * Get file content from a repository
 */
const getFileContent = async (
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
) => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to get file content: ${response.statusText}`);
  }
  
  return await response.json();
};

/**
 * Read a file as a base64 encoded string
 */
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Extract the base64 part (remove the data:... prefix)
      const base64Content = result.split(',')[1];
      resolve(base64Content);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};