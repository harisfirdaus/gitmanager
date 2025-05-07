import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Upload, 
  File, 
  Trash2, 
  Check, 
  X, 
  ArrowLeft, 
  FolderUp,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Header from '../common/Header';
import Button from '../common/Button';
import Card, { CardBody, CardHeader, CardFooter } from '../common/Card';
import { uploadFile } from '../../services/githubService';

interface RepoParams {
  owner: string;
  repo: string;
}

interface FileItem {
  id: string;
  file: File;
  path: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const UploadFiles: React.FC = () => {
  const { owner, repo } = useParams<RepoParams>() as RepoParams;
  const { token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('main');
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      
      const newFiles = fileList.map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        path: file.name,
        status: 'pending' as const,
        progress: 0
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    let items = e.dataTransfer.items;
    
    if (items) {
      // Process all the items that are dropped
      processItems(items);
    }
  };
  
  const processItems = async (items: DataTransferItemList) => {
    const getFilesFromEntry = async (entry: FileSystemEntry, path = '') => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        
        return new Promise<File[]>((resolve) => {
          fileEntry.file((file) => {
            // Create a new File object with the modified path
            const fileWithPath = new File([file], path ? `${path}/${file.name}` : file.name, {
              type: file.type,
              lastModified: file.lastModified,
            });
            
            resolve([fileWithPath]);
          });
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const directoryReader = dirEntry.createReader();
        
        return new Promise<File[]>((resolve) => {
          const readEntries = () => {
            directoryReader.readEntries(async (entries) => {
              if (entries.length === 0) {
                resolve([]);
              } else {
                const files = await Promise.all(
                  entries.map((entry) => {
                    const newPath = path ? `${path}/${entry.name}` : entry.name;
                    return getFilesFromEntry(entry, newPath);
                  })
                );
                
                resolve(files.flat());
                
                // Continue reading more entries if there are any
                readEntries();
              }
            });
          };
          
          readEntries();
        });
      }
      
      return [];
    };
    
    const newFiles: FileItem[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        
        if (entry) {
          const files = await getFilesFromEntry(entry);
          
          files.forEach(file => {
            newFiles.push({
              id: Math.random().toString(36).substring(2, 9),
              file,
              path: file.name,
              status: 'pending',
              progress: 0
            });
          });
        }
      }
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };
  
  const handlePathChange = (id: string, newPath: string) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, path: newPath } : file
    ));
  };
  
  const handleUpload = async () => {
    if (files.length === 0) {
      addToast('Please add files to upload', 'warning');
      return;
    }
    
    if (!commitMessage.trim()) {
      addToast('Please add a commit message', 'warning');
      return;
    }
    
    setIsUploading(true);
    
    let allSuccessful = true;
    
    // Update files to uploading status
    setFiles(prev => prev.map(file => ({
      ...file,
      status: 'uploading',
      progress: 0
    })));
    
    for (const fileItem of files) {
      if (fileItem.status === 'success') continue;
      
      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id && f.status === 'uploading'
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          ));
        }, 200);
        
        await uploadFile(token!, owner, repo, fileItem.path, fileItem.file, commitMessage, branch);
        
        clearInterval(progressInterval);
        
        // Mark this file as successful
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id
            ? { ...f, status: 'success', progress: 100 }
            : f
        ));
      } catch (error: any) {
        allSuccessful = false;
        
        // Mark this file as failed
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id
            ? { ...f, status: 'error', progress: 0, error: error.message || 'Upload failed' }
            : f
        ));
      }
    }
    
    setIsUploading(false);
    
    if (allSuccessful) {
      addToast('All files uploaded successfully!', 'success');
      setTimeout(() => {
        navigate(`/repository/${owner}/${repo}`);
      }, 1500);
    } else {
      addToast('Some files failed to upload. Please check the errors and try again.', 'error');
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const goBack = () => {
    navigate(`/repository/${owner}/${repo}`);
  };
  
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <button 
          onClick={goBack}
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Repository
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Upload className="w-6 h-6 mr-2" />
          Upload Files to {owner}/{repo}
        </h1>
        
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">
              Select Files
            </h2>
          </CardHeader>
          
          <CardBody>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FolderUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-gray-700 font-medium mb-1">
                Drag and drop files or folders here
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Or click the button below to select files
              </p>
              
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <Button
                  type="button"
                  onClick={triggerFileInput}
                  variant="outline"
                >
                  Select Files
                </Button>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Files to Upload ({files.length})
                </h3>
                
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Path in Repository
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {files.map((fileItem) => (
                        <tr key={fileItem.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <File className="w-5 h-5 text-gray-400 mr-3" />
                              <span className="text-sm text-gray-900">
                                {fileItem.file.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFileSize(fileItem.file.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={fileItem.path}
                              onChange={(e) => handlePathChange(fileItem.id, e.target.value)}
                              className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                              disabled={isUploading}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {fileItem.status === 'pending' && (
                              <span className="text-sm text-gray-500">Ready to upload</span>
                            )}
                            {fileItem.status === 'uploading' && (
                              <div className="flex flex-col">
                                <span className="text-sm text-blue-600 mb-1">Uploading...</span>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${fileItem.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            {fileItem.status === 'success' && (
                              <span className="text-sm text-green-600 flex items-center">
                                <Check className="w-4 h-4 mr-1" />
                                Uploaded
                              </span>
                            )}
                            {fileItem.status === 'error' && (
                              <span className="text-sm text-red-600 flex items-center">
                                <X className="w-4 h-4 mr-1" />
                                {fileItem.error || 'Error'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {(fileItem.status === 'pending' || fileItem.status === 'error') && (
                              <button
                                onClick={() => handleRemoveFile(fileItem.id)}
                                className="text-red-600 hover:text-red-900"
                                disabled={isUploading}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <label htmlFor="commitMessage" className="block text-sm font-medium text-gray-700 mb-1">
                Commit Message *
              </label>
              <textarea
                id="commitMessage"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a commit message to describe your changes"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                disabled={isUploading}
              />
            </div>
            
            <div className="mt-4">
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <input
                type="text"
                id="branch"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={isUploading}
              />
            </div>
            
            <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Upload Tips
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>You can upload multiple files at once</li>
                      <li>You can drag and drop folders to maintain directory structure</li>
                      <li>To update an existing file, use the same path as the original file</li>
                      <li>File paths are relative to the repository root</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
          
          <CardFooter>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading || !commitMessage.trim()}
                isLoading={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default UploadFiles;