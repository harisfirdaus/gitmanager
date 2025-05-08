import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { Octokit } from '@octokit/rest';

interface CopyRepoRequestBody {
  sourceOwner: string;
  sourceRepo: string;
  newName: string;
  isPrivate: boolean;
  userToken: string;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log('[copy-repository] Function invoked. Raw event body:', event.body);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  let body: CopyRepoRequestBody;
  try {
    body = JSON.parse(event.body || '{}') as CopyRepoRequestBody;
  } catch (parseError: any) {
    console.error('[copy-repository] Error parsing event body:', parseError);
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid request body: ' + parseError.message }) };
  }
  
  const { sourceOwner, sourceRepo, newName, isPrivate, userToken } = body;
  console.log('[copy-repository] Parsed body parameters:', { sourceOwner, sourceRepo, newName, isPrivate, tokenExists: !!userToken });

  if (!userToken) {
    console.warn('[copy-repository] Validation failed: User token missing.');
    return { statusCode: 401, body: JSON.stringify({ message: 'User authentication token is missing.' }) };
  }
  if (!sourceOwner || !sourceRepo || !newName) {
    console.warn('[copy-repository] Validation failed: Missing required fields.', { sourceOwner, sourceRepo, newName });
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields: sourceOwner, sourceRepo, newName' }) };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(newName)) {
    console.warn('[copy-repository] Validation failed: Invalid repository name.', { newName });
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid repository name. Use only alphanumeric characters, periods, hyphens, or underscores.' }) };
  }

  let octokit: Octokit;
  let authenticatedUserLogin: string = '[unknown_user]'; // Default value

  try {
    console.log('[copy-repository] Inside try block. Initializing Octokit.');
    octokit = new Octokit({ auth: userToken });

    const { data: authenticatedUser } = await octokit.users.getAuthenticated();
    authenticatedUserLogin = authenticatedUser.login;
    console.log('[copy-repository] Authenticated user:', authenticatedUserLogin);

    const createParams = {
      template_owner: sourceOwner,
      template_repo: sourceRepo,
      owner: authenticatedUserLogin,
      name: newName,
      private: isPrivate,
      description: `Copied from ${sourceOwner}/${sourceRepo} by ${authenticatedUserLogin}. Original template: ${sourceOwner}/${sourceRepo}`,
      include_all_branches: true,
    };
    console.log('[copy-repository] Attempting octokit.repos.createUsingTemplate with params:', createParams);

    const { data: createdRepoFromTemplate } = await octokit.repos.createUsingTemplate(createParams);
    
    console.log('[copy-repository] createUsingTemplate successful. Response:', { name: createdRepoFromTemplate.name, html_url: createdRepoFromTemplate.html_url });
      
    return {
      statusCode: 201, 
      body: JSON.stringify({
        message: `Repository '${authenticatedUserLogin}/${createdRepoFromTemplate.name}' created successfully using template '${sourceOwner}/${sourceRepo}'.`,
        newRepository: {
          name: createdRepoFromTemplate.name,
          owner: createdRepoFromTemplate.owner?.login || authenticatedUserLogin,
          html_url: createdRepoFromTemplate.html_url,
          isPrivate: createdRepoFromTemplate.private,
        },
      }),
    };

  } catch (error: any) {
    console.error('!!! [copy-repository] ERROR CAUGHT !!! Raw error object:', error);
    console.log('!!! [copy-repository] Error details:', { 
        message: error.message, 
        status: error.status, 
        response_data: error.response?.data 
    });

    const localNewName = newName || "[unknown new name]";
    const localSourceOwner = sourceOwner || "[unknown source owner]";
    const localSourceRepo = sourceRepo || "[unknown source repo]";
    const localUserLogin = authenticatedUserLogin; // Will use the fetched login or default

    let errorMessage = 'Failed to copy repository due to an unexpected error.';
    let statusCode = error.status || 500;

    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message; // Prefer GitHub's error message
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // More specific error messages based on status and content
    if (statusCode === 422 && errorMessage.toLowerCase().includes("name already exists")) {
        errorMessage = `A repository named '${localNewName}' already exists on the account '${localUserLogin}'. Please choose a different name.`;
    } else if (statusCode === 403 && errorMessage.toLowerCase().includes("must be a template repository")) {
        errorMessage = `The repository '${localSourceOwner}/${localSourceRepo}' must be marked as a template repository to be copied. Please check its settings on GitHub.`;
    } else if (statusCode === 404) { 
        errorMessage = `Could not find the template repository '${localSourceOwner}/${localSourceRepo}' or you may not have access. Please ensure it exists and is marked as a template.`;
    } else if (statusCode === 401) {
        errorMessage = "Authentication failed. Please ensure your GitHub token is valid and has the necessary permissions (scope 'repo').";
    }


    return {
      statusCode: statusCode,
      body: JSON.stringify({
        message: errorMessage,
      }),
    };
  }
};

export { handler };