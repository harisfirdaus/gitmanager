import React from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import Button from './Button';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Github className="w-16 h-16 text-gray-400 mb-4" />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        The page you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <Link to="/dashboard">
        <Button variant="primary">
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;