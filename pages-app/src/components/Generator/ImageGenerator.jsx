import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Image, Loader2, Globe, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function ImageGenerator({ onGenerated }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    setError('');
    
    try {
      const data = await api.generateImage({
        prompt,
        negative_prompt: negativePrompt,
        width: 512,
        height: 512,
        is_public: isPublic
      });
      
      alert(`Image generated! Remaining quota: ${data.remainingQuota}`);
      setPrompt('');
      setNegativePrompt('');
      setIsPublic(false);
      
      if (onGenerated) {
        onGenerated();
      }
    } catch (err) {
      // Check if it's a rate limit error with redirect
      if (err.response && err.response.data && err.response.data.error === 'RATE_LIMIT_EXCEEDED') {
        // Immediately redirect to subscription page
        navigate('/subscription');
      } else {
        setError(err.message);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">Generate New Image</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            disabled={!user}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Negative Prompt (Optional)
          </label>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="Describe what you don't want in the image..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={2}
            disabled={!user}
          />
        </div>

        {user && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              <Globe className="inline-block w-4 h-4 mr-1" />
              Make this image public
            </label>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim() || !user}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
        >
          {generating ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Generating...
            </>
          ) : (
            <>
              <Image className="mr-2 h-5 w-5" />
              Generate Image
            </>
          )}
        </button>
        
        {user && (!user.plan || user.plan === '' || user.plan.toLowerCase() === 'free') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-blue-700 text-center">
              <span className="text-blue-600">ℹ️</span> You're currently on the free plan. Upgrade to Enterprise for better image quality and unlimited image generation!
            </p>
          </div>
        )}

        {!user && (
          <p className="text-sm text-gray-600 text-center">
            <Lock className="inline-block w-4 h-4 mr-1" />
            Please login to generate images
          </p>
        )}
      </div>
    </div>
  );
}