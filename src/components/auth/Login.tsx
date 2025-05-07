import React, { useEffect } from 'react';
import { Github as GitHub } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const Login: React.FC = () => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <GitHub className="w-12 h-12 text-gray-800 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">GitHub Repository Manager</h1>
            <p className="text-gray-600 mt-2">
              Manage your GitHub repositories with ease
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={login}
              fullWidth
              size="lg"
              className="bg-gray-900 hover:bg-gray-800 focus:ring-gray-700"
              icon={<GitHub className="w-5 h-5" />}
            >
              Sign in with GitHub
            </Button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>A simple tool to help beginners manage GitHub repositories.</p>
              <p className="mt-2">
                This application uses GitHub OAuth to securely access your repositories.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 border-t border-gray-100">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Features:</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Create new repositories
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Upload files and folders
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Manage repository contents
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              View and update files
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;