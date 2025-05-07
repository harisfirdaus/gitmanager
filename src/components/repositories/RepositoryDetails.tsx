import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FolderGit2, 
  File, 
  Folder, 
  ChevronRight, 
  Star, 
  GitFork, 
  Eye, 
  Upload,
  Clock,
  Code,
  ArrowLeft,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Header from '../common/Header';
import Button from '../common/Button';
import Card, { CardBody, CardHeader } from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  getRepository, 
  getRepositoryContents,
  getBranches,
  deleteFile
} from '../../services/githubService';
import { Repository } from '../dashboard/Dashboard';

interface RepoParams {
  owner: string;
  repo: string;
}

interface ContentItem {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'dir' | 'file';
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

const RepositoryDetails: React.FC = () => {
  const { owner, repo } = useParams<RepoParams>() as RepoParams;
  const { token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [pathSegments, setPathSegments] = useState<{ name: string; path: string }[]>([]);

  const fetchContents = async (currentPathToFetch: string, currentBranchToFetch: string) => {
    try {
      if (!token) return;
      setIsLoading(true);
      const contentsData = await getRepositoryContents(token, owner, repo, currentPathToFetch, currentBranchToFetch);
      setContents(contentsData);
      updatePathSegments(currentPathToFetch);
    } catch (error) {
      console.error('Error fetching repository contents:', error);
      addToast('Failed to load directory contents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchRepositoryData = async () => {
      try {
        if (!token) return;
        
        setIsLoading(true);
        
        // Fetch repository info
        const repoData = await getRepository(token, owner, repo);
        setRepository(repoData);
        
        // Fetch branches
        const branchesData = await getBranches(token, owner, repo);
        setBranches(branchesData);
        
        // Set default branch
        if (repoData.default_branch) {
          setCurrentBranch(repoData.default_branch);
        }
        
        // Fetch contents
        await fetchContents(currentPath, currentBranch);
      } catch (error) {
        console.error('Error fetching repository data:', error);
        addToast('Failed to load repository information', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRepositoryData();
  }, [token, owner, repo, addToast]);

  useEffect(() => {
    if (token && owner && repo) {
      fetchContents(currentPath, currentBranch);
    }
  }, [token, owner, repo, currentPath, currentBranch, addToast]);

  const updatePathSegments = (path: string) => {
    if (!path) {
      setPathSegments([]);
      return;
    }
    
    const segments = path.split('/');
    const pathSegmentsArray = segments.map((segment, index) => {
      const segmentPath = segments.slice(0, index + 1).join('/');
      return {
        name: segment,
        path: segmentPath
      };
    });
    
    setPathSegments(pathSegmentsArray);
  };

  const handleFileClick = (item: ContentItem) => {
    if (item.type === 'dir') {
      setCurrentPath(item.path);
    } else {
      window.open(item.html_url, '_blank');
    }
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentBranch(e.target.value);
    setCurrentPath('');
    setPathSegments([]);
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
  };

  const handleDeleteFile = async (item: ContentItem) => {
    if (!token) {
      addToast('Authentication token not found. Please log in again.', 'error');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`);
    if (!confirmDelete) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteFile(token, owner, repo, item.path, item.sha, `Delete ${item.name}`, currentBranch);
      addToast(`File "${item.name}" deleted successfully.`, 'success');
      await fetchContents(currentPath, currentBranch);
    } catch (error: any) {
      console.error('Error deleting file:', error);
      addToast(error.message || `Failed to delete file "${item.name}"`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <Code className="w-5 h-5 text-yellow-500" />;
      case 'html':
        return <Code className="w-5 h-5 text-orange-500" />;
      case 'css':
      case 'scss':
        return <Code className="w-5 h-5 text-blue-500" />;
      case 'json':
        return <Code className="w-5 h-5 text-gray-500" />;
      case 'md':
        return <File className="w-5 h-5 text-blue-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <File className="w-5 h-5 text-purple-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
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
        <button 
          onClick={goBack}
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
        
        {repository && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FolderGit2 className="w-6 h-6 mr-2 text-blue-600" />
                  {owner}/{repo}
                  {repository.html_url && (
                    <a 
                      href={repository.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      title="Open in GitHub"
                      className="ml-2 p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </h1>
                <p className="text-gray-600 mt-1">
                  {repository.description || 'No description provided'}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center text-sm text-gray-700">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  <span>{repository.stargazers_count}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <GitFork className="w-4 h-4 mr-1" />
                  <span>{repository.forks_count}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Eye className="w-4 h-4 mr-1" />
                  <span>Watch</span>
                </div>
                
                <Link to={`/repository/${owner}/${repo}/upload`}>
                  <Button 
                    variant="primary"
                    icon={<Upload className="h-4 w-4" />}
                  >
                    Upload Files
                  </Button>
                </Link>
              </div>
            </div>
            
            <Card className="mb-8">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <select
                    value={currentBranch}
                    onChange={handleBranchChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {branches.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex items-center text-sm">
                    <Link to="#" className="text-gray-600 hover:text-blue-600">
                      <div className="flex items-center">
                        <Code className="w-4 h-4 mr-1" />
                        <span>{repository.language || 'No language detected'}</span>
                      </div>
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Last updated on {formatDate(repository.updated_at)}</span>
                </div>
              </CardHeader>
              
              <CardBody>
                <div className="mb-4">
                  <div className="flex items-center">
                    <Link 
                      to="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPath('');
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {repo}
                    </Link>
                    
                    {pathSegments.length > 0 && (
                      <>
                        <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                        {pathSegments.map((segment, index) => (
                          <React.Fragment key={segment.path}>
                            <Link 
                              to="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                navigateToPath(segment.path);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {segment.name}
                            </Link>
                            {index < pathSegments.length - 1 && (
                              <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Commit
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contents.length === 0 && !currentPath ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                            This repository is empty. Upload files to get started.
                          </td>
                        </tr>
                      ) : (
                        contents
                          .sort((a, b) => {
                            if (a.type !== b.type) {
                              return a.type === 'dir' ? -1 : 1;
                            }
                            return a.name.localeCompare(b.name);
                          })
                          .map((item) => (
                            <tr 
                              key={item.path} 
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleFileClick(item)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {item.type === 'dir' ? (
                                    <Folder className="w-5 h-5 text-blue-500 mr-3" />
                                  ) : (
                                    <span className="mr-3">{getFileIcon(item.name)}</span>
                                  )}
                                  <span className="text-sm text-gray-900">
                                    {item.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className="text-gray-400">Commit message not available</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.type === 'dir' ? (
                                  '—'
                                ) : (
                                  formatFileSize(item.size)
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.type === 'file' && (
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    icon={<Trash2 className="w-4 h-4" />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFile(item);
                                    }}
                                    title={`Delete ${item.name}`}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
            
            {contents.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                <FolderGit2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-gray-900 mb-2">Repository is empty</h2>
                <p className="text-gray-600 mb-6">
                  This repository doesn't have any files yet. Upload files to get started.
                </p>
                <Link to={`/repository/${owner}/${repo}/upload`}>
                  <Button 
                    variant="primary"
                    icon={<Upload className="h-4 w-4" />}
                  >
                    Upload Files
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default RepositoryDetails;