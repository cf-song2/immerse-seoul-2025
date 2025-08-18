import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Upload, Grid, LogIn, LogOut, User, Loader2, Shield } from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import LegacyLogin from './components/Auth/LegacyLogin';
import LegacyLoginSuccess from './components/Auth/LegacyLoginSuccess';
import EmailVerify from './components/Auth/EmailVerify';
import SubscriptionPage from './components/Subscription/SubscriptionPage';
import ImageGenerator from './components/Generator/ImageGenerator';
import ImageGallery from './components/Gallery/ImageGallery';

// Gallery Page Component with URL routing
function GalleryPage() {
  const { user } = useAuth();
  const { viewMode } = useParams();
  const navigate = useNavigate();
  
  // Redirect to 'my' if user is logged in and no viewMode specified
  React.useEffect(() => {
    if (!viewMode && user) {
      navigate('/gallery/my', { replace: true });
    } else if (!viewMode) {
      navigate('/gallery/public', { replace: true });
    }
  }, [viewMode, user, navigate]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Image Gallery</h2>
        <div className="flex space-x-2">
          <Link
            to="/gallery/my"
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'my' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => !user && e.preventDefault()}
          >
            My Images
          </Link>
          <Link
            to="/gallery/public"
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'public' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Public Gallery
          </Link>
        </div>
      </div>
      <ImageGallery viewMode={viewMode || 'public'} />
    </div>
  );
}

function AppContent() {
  const { user, logout, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
      </div>
    );
  }

  const handleImageGenerated = () => {
    navigate('/gallery/my');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Image Studio
              </h1>
              <div className="flex space-x-4">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    location.pathname === '/' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Upload className="inline-block w-4 h-4 mr-2" />
                  Generator
                </Link>
                <Link
                  to="/gallery/my"
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    location.pathname.startsWith('/gallery') 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="inline-block w-4 h-4 mr-2" />
                  Finder
                </Link>
                <Link
                  to="/legacy-login"
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    location.pathname === '/legacy-login' 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Shield className="inline-block w-4 h-4 mr-2" />
                  Legacy Login
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/subscription')}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <User className="inline-block w-4 h-4 mr-1" />
                    {user.username}
                  </button>
                  <button
                    onClick={logout}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={
            <div className="max-w-2xl mx-auto">
              <ImageGenerator onGenerated={handleImageGenerated} />
            </div>
          } />
          <Route path="/gallery/:viewMode" element={<GalleryPage />} />
          <Route path="/verify" element={<EmailVerify />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/legacy-login" element={
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                  Legacy Login (Cloudflare Testing)
                </h2>
                <LegacyLogin onSuccess={() => navigate('/')} />
              </div>
            </div>
          } />
          <Route path="/legacy-login-success" element={
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                  Legacy Login Success
                </h2>
                <LegacyLoginSuccess />
              </div>
            </div>
          } />
        </Routes>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {authMode === 'login' ? 'Login' : 'Register'}
              </h2>
              <button
                onClick={() => setShowAuth(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {authMode === 'login' ? (
              <Login onSuccess={() => setShowAuth(false)} />
            ) : (
              <Register onSuccess={() => setAuthMode('login')} />
            )}
            
            <p className="text-center mt-4 text-sm text-gray-600">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                {authMode === 'login' ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}