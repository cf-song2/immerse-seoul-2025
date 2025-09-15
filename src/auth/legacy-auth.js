import { hashPassword, verifyPassword, generateToken, generateUserId } from '../utils/crypto.js';
import { createJWT, verifyJWT } from './jwt.js';
import { jsonResponse, errorResponse, corsHeaders } from '../utils/response.js';

// Legacy Login Handler - Uses form data instead of JSON
export async function handleLegacyLogin(request, env) {
  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };
  
  try {
    // Parse form data instead of JSON
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');
    const action = formData.get('action');

    console.log('Legacy login attempt:', { email, action });

    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing credentials'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
    }

    // Find user (same logic as regular login)
    const user = await env.DB.prepare(
      'SELECT id, email, username, password_hash, is_verified FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first();

    const frontendUrl = env.ENVIRONMENT === 'production' 
      ? env.FRONTEND_URL
      : env.DEV_FRONTEND_URL;

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      const errorUrl = `${frontendUrl}/legacy-login?error=${encodeURIComponent('Invalid credentials')}`;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': errorUrl,
          ...headers
        }
      });
    }

    if (!user.is_verified) {
      const errorUrl = `${frontendUrl}/legacy-login?error=${encodeURIComponent('Please verify your email before logging in.')}`;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': errorUrl,
          ...headers
        }
      });
    }

    // Create session (same as regular login)
    const sessionId = generateToken();
    const sessionData = {
      userId: user.id,
      createdAt: Date.now(),
      loginType: 'legacy' // Mark as legacy login for tracking
    };

    // Store in KV with TTL
    await env.SESSIONS.put(
      `session:${sessionId}`,
      JSON.stringify(sessionData),
      { expirationTtl: parseInt(env.SESSION_DURATION) }
    );

    // Create JWT
    const token = await createJWT(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username,
        sessionId,
        loginType: 'legacy'
      },
      env.JWT_SECRET,
      parseInt(env.SESSION_DURATION)
    );

    console.log('Legacy login successful for:', email);

    // For true form submission, redirect back to frontend with success
    
    const redirectUrl = `${frontendUrl}/legacy-login-success?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username
    }))}`;

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${env.SESSION_DURATION}`,
        ...headers
      }
    });
  } catch (error) {
    console.error('Legacy login error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Legacy login failed',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  }
}

// Handle OPTIONS request for CORS
export async function handleLegacyLoginOptions(request, env) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    }
  });
}
