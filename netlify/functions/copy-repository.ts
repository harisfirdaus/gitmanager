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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const body = JSON.parse(event.body || '{}') as CopyRepoRequestBody;
      const { sourceOwner, sourceRepo, newName, isPrivate, userToken } = body;

      if (!userToken) {
        return { statusCode: 401, body: JSON.stringify({ message: 'User authentication token is missing.' }) };
      }
      if (!sourceOwner || !sourceRepo || !newName) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields: sourceOwner, sourceRepo, newName' }) };
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(newName)) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Invalid repository name. Use only alphanumeric characters, periods, hyphens, or underscores.' }) };
      }

  try {
    const body = JSON.parse(event.body || '{}') as CopyRepoRequestBody;
    const { sourceOwner, sourceRepo, newName, isPrivate, userToken } = body;

    if (!userToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'User authentication token is missing.' }),
      };
    }

    if (!sourceOwner || !sourceRepo || !newName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields: sourceOwner, sourceRepo, newName' }),
      };
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(newName)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid repository name. Use only alphanumeric characters, periods, hyphens, or underscores.' }),
      };
    }

    const octokit = new Octokit({ auth: userToken });

    const { data: authenticatedUser } = await octokit.users.getAuthenticated();
    const newRepoOwnerLogin = authenticatedUser.login;

    const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
      name: newName,
      private: isPrivate,
      description: `Copied from ${sourceOwner}/${sourceRepo} by ${newRepoOwnerLogin}`,
    });

    try {
      await octokit.repos.createUsingTemplate({
        template_owner: sourceOwner,
        template_repo: sourceRepo,
        owner: newRepoOwnerLogin,
        name: newRepo.name,
        private: newRepo.private,
        description: newRepo.description || `Copied from ${sourceOwner}/${sourceRepo}`,
        include_all_branches: true,
      });
      
      return {
        statusCode: 201, 
        body: JSON.stringify({
          message: `Repository '${newRepoOwnerLogin}/${newRepo.name}' created and content copied successfully from template.`,
          newRepository: {
            name: newRepo.name,
            owner: newRepoOwnerLogin,
            html_url: `https://github.com/${newRepoOwnerLogin}/${newRepo.name}`,
            isPrivate: newRepo.private,
          },
        }),
      };

    } catch (templateError: any) {
      console.warn('Failed to create repository using template:', templateError.message);
      return {
        statusCode: 201, 
        body: JSON.stringify({
          message: `Repository '${newRepoOwnerLogin}/${newRepo.name}' created, but failed to copy content using template. The new repository is empty. Error: ${templateError.message}`,
          newRepository: {
            name: newRepo.name,
            owner: newRepoOwnerLogin,
            html_url: `https://github.com/${newRepoOwnerLogin}/${newRepo.name}`,
            isPrivate: newRepo.private,
          },
        }),
      };
    }

  } catch (error: any) {
    console.error('Error in copy-repository function:', error);
    let errorMessage = 'Failed to copy repository.';
    if (error.message) {
      errorMessage = error.message;
    }
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }

    return {
      statusCode: error.status || 500,
      body: JSON.stringify({
        message: errorMessage,
      }),
    };
  }
};

export { handler }; 