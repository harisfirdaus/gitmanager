import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderPlus, 
  Lock, 
  Globe, 
  Info, 
  AlertCircle,
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Header from '../common/Header';
import Button from '../common/Button';
import Card, { CardBody, CardHeader, CardFooter } from '../common/Card';
import { createRepository } from '../../services/githubService';

const NewRepository: React.FC = () => {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '',
    description: '',
    isPrivate: false,
    includeReadme: true,
    gitignoreTemplate: '',
    license: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // For checkbox inputs, we need to handle the checked property differently
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormState(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear errors when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formState.name.trim()) {
      newErrors.name = 'Repository name is required';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formState.name)) {
      newErrors.name = 'Repository name can only contain letters, numbers, hyphens, underscores, and periods';
    }
    
    if (Object.keys(newErrors).length === 0) {
      setStep(2);
    } else {
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      
      if (!token) {
        addToast('Authentication error. Please log in again.', 'error');
        return;
      }
      
      const repo = await createRepository(token, {
        name: formState.name,
        description: formState.description,
        private: formState.isPrivate,
        auto_init: formState.includeReadme,
        gitignore_template: formState.gitignoreTemplate || undefined,
        license_template: formState.license || undefined,
      });
      
      addToast(`Repository "${repo.name}" created successfully!`, 'success');
      navigate(`/repository/${repo.owner.login}/${repo.name}`);
    } catch (error: any) {
      console.error('Error creating repository:', error);
      addToast(error.message || 'Failed to create repository', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const gitignoreTemplates = [
    '',
    'Node',
    'Python',
    'Java',
    'C++',
    'Ruby',
    'Go',
    'Swift',
    'Kotlin',
    'Rust',
    'PHP',
    'C#',
  ];

  const licenseTemplates = [
    '',
    'mit',
    'apache-2.0',
    'gpl-3.0',
    'bsd-2-clause',
    'bsd-3-clause',
    'mpl-2.0',
    'unlicense',
  ];

  const licensesDisplay: Record<string, string> = {
    '': 'None',
    'mit': 'MIT License',
    'apache-2.0': 'Apache License 2.0',
    'gpl-3.0': 'GNU General Public License v3.0',
    'bsd-2-clause': 'BSD 2-Clause License',
    'bsd-3-clause': 'BSD 3-Clause License',
    'mpl-2.0': 'Mozilla Public License 2.0',
    'unlicense': 'The Unlicense',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FolderPlus className="w-6 h-6 mr-2" />
            Create a New Repository
          </h1>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {step === 1 ? 'Basic Information' : 'Configuration Options'}
                </h2>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'} flex items-center justify-center`}>
                    {step > 1 && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className={`w-8 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  <div className={`w-4 h-4 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'} flex items-center justify-center`}>
                    {step > 2 && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardBody>
              <form onSubmit={handleSubmit}>
                {step === 1 ? (
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Repository Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        placeholder="e.g., my-awesome-project"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.name}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">
                        Repository names must be unique for your account and can only contain letters, numbers, hyphens, 
                        underscores, and periods.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formState.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add a description of your repository"
                      ></textarea>
                      <p className="mt-1 text-sm text-gray-500">
                        A good description helps others understand your project.
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="isPrivate"
                            name="isPrivate"
                            type="checkbox"
                            checked={formState.isPrivate}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3">
                          <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700 flex items-center">
                            {formState.isPrivate ? (
                              <>
                                <Lock className="w-4 h-4 mr-1" />
                                Private Repository
                              </>
                            ) : (
                              <>
                                <Globe className="w-4 h-4 mr-1" />
                                Public Repository
                              </>
                            )}
                          </label>
                          <p className="text-sm text-gray-500">
                            {formState.isPrivate
                              ? 'Private repositories are only visible to you and people you share them with.'
                              : 'Public repositories are visible to anyone on the internet.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="includeReadme"
                            name="includeReadme"
                            type="checkbox"
                            checked={formState.includeReadme}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3">
                          <label htmlFor="includeReadme" className="text-sm font-medium text-gray-700">
                            Initialize with a README
                          </label>
                          <p className="text-sm text-gray-500">
                            This will create an initial README.md file to help you get started.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="gitignoreTemplate" className="block text-sm font-medium text-gray-700 mb-1">
                        Add .gitignore
                      </label>
                      <select
                        id="gitignoreTemplate"
                        name="gitignoreTemplate"
                        value={formState.gitignoreTemplate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None</option>
                        {gitignoreTemplates.slice(1).map((template) => (
                          <option key={template} value={template}>
                            {template}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        A .gitignore file tells Git which files to ignore when committing your project.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="license" className="block text-sm font-medium text-gray-700 mb-1">
                        Add a license
                      </label>
                      <select
                        id="license"
                        name="license"
                        value={formState.license}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {licenseTemplates.map((license) => (
                          <option key={license} value={license}>
                            {licensesDisplay[license]}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        A license tells others what they can and cannot do with your code.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Info className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            Your repository will be created under{' '}
                            <span className="font-semibold">{user?.login}/{formState.name}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </CardBody>
            
            <CardFooter className="flex justify-between">
              {step === 1 ? (
                <div className="flex justify-end w-full">
                  <Button
                    type="button"
                    onClick={validateStep1}
                  >
                    Next Step
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    isLoading={isCreating}
                  >
                    Create Repository
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
          
          <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              First time creating a repository?
            </h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Public repositories are visible to everyone on GitHub
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Choose a license to let others know what they can and cannot do with your code
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                A good README helps people understand and use your project
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                A .gitignore file specifies which files Git should not track
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewRepository;