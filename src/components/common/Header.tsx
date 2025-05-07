import React from 'react';
import { Github as GitHub, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <GitHub className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg text-gray-900">GitHub Manager</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              Repositories
            </Link>
            <Link 
              to="/new-repository" 
              className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                location.pathname === '/new-repository' ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              New Repository
            </Link>
          </nav>

          {/* User Profile */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={user?.avatar_url} 
                alt={user?.login} 
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium text-gray-700">{user?.login}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
            >
              Log out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700 hover:text-gray-900"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 py-2 border-t animate-fadeIn">
            <nav className="flex flex-col gap-2 py-2">
              <Link 
                to="/dashboard" 
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/dashboard' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Repositories
              </Link>
              <Link 
                to="/new-repository" 
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/new-repository' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                New Repository
              </Link>

              <div className="mt-2 pt-2 border-t flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <img 
                    src={user?.avatar_url} 
                    alt={user?.login} 
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">{user?.login}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                >
                  Log out
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;