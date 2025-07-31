import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Register({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerifyMsg, setShowVerifyMsg] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await register(email, password, username);
      setError('');
      setShowVerifyMsg(true);
      // onSuccess(); // Only call onSuccess after verification, if needed
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showVerifyMsg ? (
        <div className="bg-white rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold mb-2 text-purple-700">Check your email!</h2>
          <p className="text-gray-700 mb-4">A verification link has been sent to <span className="font-mono text-purple-600">{email}</span>. Please verify your email before logging in.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          required
          minLength={6}
        />
      </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto h-5 w-5" /> : 'Register'}
          </button>
        </form>
      )}
    </>
  );
}