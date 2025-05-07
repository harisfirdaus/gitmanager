import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderGit2, 
  Search, 
  LayoutGrid, 
  List, 
  Star, 
  GitFork, 
  Upload, 
  Plus 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Header from '../common/Header';
import LoadingSpinner from '../common/LoadingSpinner';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import { getRepositories } from '../../services/githubService';

export interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  private: boolean;
}

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        if (token) {
          const repos = await getRepositories(token);
          setRepositories(repos);
        }
      } catch (error) {
        addToast('Failed to load your repositories', 'error');
        console.error('Error fetching repositories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, [token, addToast]);

  const filteredRepositories = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      JavaScript: 'bg-yellow-400',
      TypeScript: 'bg-blue-500',
      Python: 'bg-blue-600',
      Java: 'bg-orange-600',
      'C#': 'bg-green-600',
      PHP: 'bg-purple-500',
      Ruby: 'bg-red-600',
      Go: 'bg-blue-400',
      Rust: 'bg-orange-500',
      Swift: 'bg-orange-400',
      Kotlin: 'bg-purple-400',
      'C++': 'bg-pink-600',
      C: 'bg-gray-600',
      HTML: 'bg-red-500',
      CSS: 'bg-blue-300',
    };
    
    return language ? colors[language] || 'bg-gray-400' : 'bg-gray-300';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-16 px-4">
          <div className="flex justify-center">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Repositories</h1>
          <p className="text-gray-600">
            Manage and collaborate on your GitHub repositories.
          </p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search repositories..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <LayoutGrid className="h-5 w-5 text-gray-600" />
              </button>
              <button
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <Link to="/new-repository">
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
              >
                New Repository
              </Button>
            </Link>
          </div>
        </div>

        {filteredRepositories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FolderGit2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h2>
            {searchQuery ? (
              <p className="text-gray-600 mb-6">
                No repositories match your search criteria.
              </p>
            ) : (
              <p className="text-gray-600 mb-6">
                You don't have any repositories yet. Create your first repository to get started.
              </p>
            )}
            <Link to="/new-repository">
              <Button variant="primary">Create New Repository</Button>
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredRepositories.map((repo) => (
              viewMode === 'grid' ? (
                <Card key={repo.id} hoverable className="h-full">
                  <CardBody className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <FolderGit2 className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          <Link to={`/repository/${repo.owner.login}/${repo.name}`}>
                            {repo.name}
                          </Link>
                        </h3>
                      </div>
                      {repo.private && (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          Private
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 flex-grow">
                      {repo.description || <span className="text-gray-400 italic">No description</span>}
                    </p>
                    
                    <div className="mt-auto">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        {repo.language && (
                          <div className="flex items-center mr-4">
                            <span className={`h-3 w-3 rounded-full mr-1 ${getLanguageColor(repo.language)}`}></span>
                            <span>{repo.language}</span>
                          </div>
                        )}
                        <div className="flex items-center mr-4">
                          <Star className="h-4 w-4 mr-1" />
                          <span>{repo.stargazers_count}</span>
                        </div>
                        <div className="flex items-center">
                          <GitFork className="h-4 w-4 mr-1" />
                          <span>{repo.forks_count}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Updated {formatDate(repo.updated_at)}
                        </span>
                        
                        <Link to={`/repository/${repo.owner.login}/${repo.name}/upload`}>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Upload className="h-3 w-3" />}
                          >
                            Upload
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <Card key={repo.id} hoverable>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <FolderGit2 className="h-5 w-5 text-blue-600 mr-2" />
                          <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            <Link to={`/repository/${repo.owner.login}/${repo.name}`}>
                              {repo.name}
                            </Link>
                          </h3>
                          {repo.private && (
                            <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                              Private
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mt-1">
                          {repo.description || <span className="text-gray-400 italic">No description</span>}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          {repo.language && (
                            <div className="flex items-center mr-4">
                              <span className={`h-3 w-3 rounded-full mr-1 ${getLanguageColor(repo.language)}`}></span>
                              <span>{repo.language}</span>
                            </div>
                          )}
                          <div className="flex items-center mr-4">
                            <Star className="h-4 w-4 mr-1" />
                            <span>{repo.stargazers_count}</span>
                          </div>
                          <div className="flex items-center mr-4">
                            <GitFork className="h-4 w-4 mr-1" />
                            <span>{repo.forks_count}</span>
                          </div>
                          <span className="text-xs">
                            Updated {formatDate(repo.updated_at)}
                          </span>
                        </div>
                      </div>
                      
                      <Link to={`/repository/${repo.owner.login}/${repo.name}/upload`}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Upload className="h-3 w-3" />}
                        >
                          Upload
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;