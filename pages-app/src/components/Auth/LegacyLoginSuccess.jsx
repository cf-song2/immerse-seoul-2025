import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function LegacyLoginSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const processLegacyLogin = async () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');

        if (!token || !userParam) {
          setError('Missing authentication data from legacy login');
          setProcessing(false);
          return;
        }

        // Store token in localStorage
        localStorage.setItem('token', token);

        // Refresh auth state
        await refreshAuth();

        // Show success message briefly, then redirect
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);

      } catch (err) {
        console.error('Error processing legacy login success:', err);
        setError('Failed to complete legacy login authentication');
        setProcessing(false);
      }
    };

    processLegacyLogin();
  }, [searchParams, navigate, refreshAuth]);

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Legacy Login Error</h2>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate('/legacy-login')}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        {processing ? (
          <>
            <Loader2 className="animate-spin h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Processing Legacy Login</h2>
            <p className="text-gray-600 text-sm">
              Completing authentication and updating your session...
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-green-800 mb-2">Legacy Login Successful!</h2>
            <p className="text-gray-600 text-sm mb-4">
              Your form-based authentication was successful. Redirecting to main page...
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-700 text-xs">
                ✓ Form submission completed<br/>
                ✓ Cloudflare challenge processed<br/>
                ✓ Authentication token received<br/>
                ✓ User session updated
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
