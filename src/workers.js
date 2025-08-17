// Main Worker entry point

import { requireAuth } from './auth/middleware.js';
import { handleRegister, handleLogin, handleLogout, handleVerifyAuth, handleVerifyEmail } from './auth/auth.js';
import { handleLegacyLogin, handleLegacyLoginOptions } from './auth/legacy-auth.js';
import { 
  handleImageGeneration, 
  handleGetUserImages, 
  handleGetPublicImages, 
  handleGetImage 
} from './handlers/images.js';
import { corsHeaders } from './utils/response.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Public routes
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        return await handleRegister(request, env);
      } else if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env);
      } else if (url.pathname === '/auth/legacy-login' && request.method === 'POST') {
        return await handleLegacyLogin(request, env);
      } else if (url.pathname === '/auth/legacy-login' && request.method === 'OPTIONS') {
        return await handleLegacyLoginOptions(request, env);
      } else if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        return await handleLogout(request, env);
      } else if (url.pathname === '/api/images' && request.method === 'GET') {
        return await handleGetPublicImages(env);
      } else if (url.pathname.startsWith('/api/image/') && request.method === 'GET') {
        return await handleGetImage(request, url.pathname, env);
      } else if (url.pathname === '/api/auth/verify-email' && request.method === 'GET') {
        return await handleVerifyEmail(request, env);
      }

      if (url.pathname === '/api/test' && request.method === 'GET') {
        const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;
  
        try {
    
          // DB 연결 테스트
          const tables = await env.DB.prepare(
            "SELECT name FROM sqlite_master WHERE type='table'"
          ).all();
    
          return new Response(JSON.stringify({
            success: true,
            environment: env.ENVIRONMENT,
            tables: tables.results.map(t => t.name),
            hasJWT: !!env.JWT_SECRET,
            hasKV: !!env.SESSIONS
          }), {
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            error: error.message
        }), {
          status: 500,
          headers: { ...headers, 'Content-Type': 'application/json' }
        });
      }
    }
      
      // Protected routes
      else if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
        return await requireAuth(handleVerifyAuth)(request, env, ctx);
      } else if (url.pathname === '/api/generate' && request.method === 'POST') {
        return await requireAuth(handleImageGeneration)(request, env, ctx);
      } else if (url.pathname === '/api/user/images' && request.method === 'GET') {
        return await requireAuth(handleGetUserImages)(request, env, ctx);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};