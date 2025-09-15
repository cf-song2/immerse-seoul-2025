// Response helper utilities
import { getCorsHeaders } from './cors.js';

export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

export function errorResponse(message, status = 400, headers = {}) {
  return jsonResponse({ error: message }, status, headers);
}

// Dynamic CORS headers based on environment
export function corsHeaders(env) {
  return getCorsHeaders(env?.ENVIRONMENT || 'development');
}

// Legacy exports for backward compatibility
export const devCorsHeaders = getCorsHeaders('development');