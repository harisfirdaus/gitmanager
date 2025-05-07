import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Github as GitHub } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import RepositoryDetails from './components/repositories/RepositoryDetails';
import NewRepository from './components/repositories/NewRepository';
import UploadFiles from './components/files/UploadFiles';
import NotFound from './components/common/NotFound';
import PrivateRoute from './components/auth/PrivateRoute';
import Toast from './components/common/Toast';
import { useToast } from './contexts/ToastContext';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

function AppContent() {
  const { toasts } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <GitHub className="w-16 h-16 mx-auto mb-4 text-gray-800 animate-pulse" />
          <h1 className="text-2xl font-semibold text-gray-800">Loading GitHub Manager...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/repository/:owner/:repo" 
          element={
            <PrivateRoute>
              <RepositoryDetails />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/new-repository" 
          element={
            <PrivateRoute>
              <NewRepository />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/repository/:owner/:repo/upload" 
          element={
            <PrivateRoute>
              <UploadFiles />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;