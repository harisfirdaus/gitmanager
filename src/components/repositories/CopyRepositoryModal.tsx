import React, { useState } from 'react';
import Button from '../common/Button';
import { X, Lock, Globe, Copy as CopyIcon } from 'lucide-react';

interface CopyRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceRepoName: string;
  sourceRepoOwner: string;
  onCopy: (newName: string, isPrivate: boolean) => Promise<void>;
}

const CopyRepositoryModal: React.FC<CopyRepositoryModalProps> = ({
  isOpen,
  onClose,
  sourceRepoName,
  sourceRepoOwner,
  onCopy,
}) => {
  const [newRepoName, setNewRepoName] = useState(`${sourceRepoName}-copy`);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewRepoName(e.target.value);
    if (error) setError(null); 
  };

  const handleSubmit = async () => {
    if (!newRepoName.trim()) {
      setError('Repository name cannot be empty.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(newRepoName)) {
      setError('Invalid repository name. Use only alphanumeric characters, periods, hyphens, or underscores.');
      return;
    }
    
    setError(null);
    setIsLoading(true);
    try {
      await onCopy(newRepoName, isPrivate);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to copy repository. Please check the console for more details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <CopyIcon size={20} className="mr-2 text-blue-600" />
            Copy Repository
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-1">
          Copying from: <span className="font-medium text-gray-700">{sourceRepoOwner}/{sourceRepoName}</span>
        </p>
        
        <div className="mb-4">
          <label htmlFor="newRepoName" className="block text-sm font-medium text-gray-700 mb-1">
            New repository name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="newRepoName"
            value={newRepoName}
            onChange={handleNameChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., my-awesome-project-copy"
            disabled={isLoading}
          />
        </div>

        <div className="mb-6">
          <span className="block text-sm font-medium text-gray-700 mb-2">Visibility</span>
          <div className="flex items-center space-x-4">
            <label htmlFor="publicRepo" className="flex items-center cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors w-1/2">
              <input
                type="radio"
                id="publicRepo"
                name="visibility"
                checked={!isPrivate}
                onChange={() => setIsPrivate(false)}
                className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <div className="ml-3">
                <Globe size={20} className="text-gray-600 mb-1" />
                <span className="block text-sm font-medium text-gray-800">Public</span>
                <p className="text-xs text-gray-500">Anyone on the internet can see this repository.</p>
              </div>
            </label>
            <label htmlFor="privateRepo" className="flex items-center cursor-pointer p-3 border rounded-md hover:bg-gray-50 transition-colors w-1/2">
              <input
                type="radio"
                id="privateRepo"
                name="visibility"
                checked={isPrivate}
                onChange={() => setIsPrivate(true)}
                className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <div className="ml-3">
                <Lock size={20} className="text-gray-600 mb-1" />
                <span className="block text-sm font-medium text-gray-800">Private</span>
                <p className="text-xs text-gray-500">You choose who can see and commit to this repository.</p>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading} disabled={isLoading}>
            {isLoading ? 'Copying...' : 'Copy Repository'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CopyRepositoryModal; 