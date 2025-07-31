import { hashPassword, verifyPassword, generateToken, generateUserId } from '../utils/crypto.js';
import { createJWT, verifyJWT } from './jwt.js';
import { jsonResponse, errorResponse, corsHeaders } from '../utils/response.js';

export async function handleRegister(request, env) {

  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;

  try {
    const body = await request.json();
    const { email, password, username } = body;

    console.log('Register request:', { email, username });

    if (!email || !password || !username) {
      return errorResponse('Missing required fields', 400, corsHeaders);
    }

    // Check if user exists
    try {
      const existingUser = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ? OR username = ?'
      ).bind(email, username).first();
      
      console.log('Existing user check result:', existingUser);

      if (existingUser) {
        return errorResponse('User already exists', 409, headers);
      }
    } catch (dbError) {
      console.error('Database error during user check:', dbError);
      throw dbError;
    }

    console.log('Creating new user...');

    // Create user with email verification
    const userId = generateUserId();
    const passwordHash = await hashPassword(password);
    const verificationToken = generateToken();

    console.log('Generated userId:', userId);

    try {
      await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, username, is_verified, verification_token) VALUES (?, ?, ?, ?, 0, ?)'
      ).bind(userId, email, passwordHash, username, verificationToken).run();
      console.log('User created successfully');
    } catch (insertError) {
      console.error('Error inserting user:', insertError);
      throw insertError;
    }

    // Create rate limit entry
    await env.DB.prepare(
      'INSERT INTO user_rate_limits (user_id) VALUES (?)'
    ).bind(userId).run();

    // Send verification email
    try {
      const { sendVerificationEmail } = await import('../utils/email.js');
      const emailSent = await sendVerificationEmail(email, verificationToken, env);
      if (!emailSent) {
        console.error('Failed to send verification email');
      }
    } catch (emailErr) {
      console.error('Error sending verification email:', emailErr);
    }

    return jsonResponse({ 
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    }, 200, corsHeaders);
  } catch (error) {
    return errorResponse('Registration failed', 500, corsHeaders);
  }
}

export async function handleLogin(request, env) {
  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;
  
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Missing credentials', 400, corsHeaders);
    }

    // Find user
    const user = await env.DB.prepare(
      'SELECT id, email, username, password_hash, is_verified FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return errorResponse('Invalid credentials', 401, corsHeaders);
    }
    if (!user.is_verified) {
      return errorResponse('Please verify your email before logging in.', 403, corsHeaders);
    }

    // Create session
    const sessionId = generateToken();
    const sessionData = {
      userId: user.id,
      createdAt: Date.now()
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
        sessionId 
      },
      env.JWT_SECRET,
      parseInt(env.SESSION_DURATION)
    );

    return jsonResponse({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    }, 200, corsHeaders);
  } catch (error) {
    return errorResponse('Login failed', 500, corsHeaders);
  }
}

// Email verification endpoint
export async function handleVerifyEmail(request, env) {
  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) {
      return errorResponse('Missing token', 400, headers);
    }
    const user = await env.DB.prepare('SELECT id FROM users WHERE verification_token = ?').bind(token).first();
    if (!user) {
      return errorResponse('Invalid or expired token', 400, headers);
    }
    await env.DB.prepare('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?').bind(user.id).run();
    return jsonResponse({ success: true, message: 'Email verified. You can now log in.' }, 200, headers);
  } catch (error) {
    return errorResponse('Email verification failed', 500, headers);
  }
}

export async function handleLogout(request, env) {
  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;

  const authHeader = request.headers.get('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const claims = await verifyJWT(token, env.JWT_SECRET);
    
    if (claims && claims.sessionId) {
      await env.SESSIONS.delete(`session:${claims.sessionId}`);
    }
  }

  return jsonResponse({ success: true }, 200, corsHeaders);
}

export async function handleVerifyAuth(request, env, ctx) {
  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;

  return jsonResponse({
    authenticated: true,
    user: request.user
  }, 200, corsHeaders);
}

