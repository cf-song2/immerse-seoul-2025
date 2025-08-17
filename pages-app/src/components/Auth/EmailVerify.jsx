import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function EmailVerify() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('Missing verification token');
          return;
        }

        // Call the API endpoint directly with the token
        const response = await fetch(`https://immerse-seoul-api.metamon.shop/api/auth/verify-email?token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in.');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          const error = await response.json();
          setStatus('error');
          
          // Handle specific error cases
          if (error.message === 'Invalid or expired token') {
            setMessage('This verification link has already been used or has expired. If you haven\'t verified your account yet, please request a new verification email.');
          } else {
            setMessage(error.message || 'Verification failed');
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [location.search, navigate]);

  const handleLoginClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin h-12 w-12 text-purple-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800">Verifying your email...</h2>
              <p className="text-gray-600 mt-2">Please wait while we verify your account.</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting you to the app...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center">
              <XCircle className="h-12 w-12 text-red-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={handleLoginClick}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
        
        {status === 'success' && (
          <button
            onClick={handleLoginClick}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Continue to App
          </button>
        )}
      </div>
    </div>
  );
}
