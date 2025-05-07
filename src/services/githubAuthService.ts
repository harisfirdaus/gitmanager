export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

// Configure your GitHub OAuth app details
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = import.meta.env.VITE_SITE_URL + '/auth-callback.html';

export const githubAuthService = {
  /**
   * Initiate the GitHub OAuth flow by opening a popup window
   */
  initiateOAuth: () => {
    // For the demo, we'll use a very minimal scope
    const scope = 'repo';
    
    // GitHub OAuth authorization URL
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&scope=${scope}`;
    
    // Open popup window for GitHub auth
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const authWindow = window.open(
      authUrl,
      'github-oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Set up message listener for the OAuth response
    return new Promise((resolve, reject) => {
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'github-oauth-success') {
          const code = event.data.code;
          
          try {
            // Exchange the code for a token using Netlify function
            const tokenResponse = await fetch('/.netlify/functions/github-auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code }),
            });

            const data = await tokenResponse.json();
            
            if (data.access_token) {
              window.removeEventListener('message', handleMessage);
              resolve(data.access_token);
            } else {
              reject(new Error('Failed to get access token'));
            }
          } catch (error) {
            reject(error);
          }
        }
      };

      window.addEventListener('message', handleMessage);
    });
  },
  
  /**
   * Get the current user's information using the GitHub API
   */
  getCurrentUser: async (token: string): Promise<GitHubUser> => {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    return await response.json();
  }
};