import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function LegacyLogin({ onSuccess }) {
  const { refreshAuth, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check for error parameter from URL (redirect from backend)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) {
      setError(urlError);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    // Don't prevent default - let the form submit naturally
    setLoading(true);
    // The form will submit and navigate away, so we don't need to handle the response here
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-amber-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-amber-800">Legacy Login Mode</h3>
            <p className="text-sm text-amber-700 mt-1">
              This uses form-based submission.
            </p>
          </div>
        </div>
      </div>

      <form 
        action={`${import.meta.env.VITE_API_URL}/auth/legacy-login`} 
        method="POST" 
        onSubmit={handleSubmit} 
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
            placeholder="Enter your email"
            disabled={!!user}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            required
            placeholder="Enter your password"
            disabled={!!user}
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading || !!user}
          className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Processing Legacy Login...
            </div>
          ) : (
            'Legacy Login'
          )}
        </button>
      </form>
      {user && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-center">
          <p>You are already logged in as <span className="font-semibold">{user.username || user.email}</span>. Logout to use legacy login again.</p>
        </div>
      )}
    </div>
  );
}
