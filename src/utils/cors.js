// CORS utilities with configurable domains
import allowedDomains from '../../allowed-domains.json';

export function getCorsHeaders(environment = 'development') {
  const domains = allowedDomains[environment] || allowedDomains.development;
  
  // If domains include '*', allow all origins
  if (domains.includes('*')) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }
  
  // For specific domains, use the first one as default
  // In practice, you'd check the request origin against the allowed list
  return {
    'Access-Control-Allow-Origin': domains[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };
}

export function getDynamicCorsHeaders(requestOrigin, environment = 'development') {
  const domains = allowedDomains[environment] || allowedDomains.development;
  
  // Debug logging
  console.log('CORS Debug:', {
    requestOrigin,
    environment,
    domains,
    allowedDomainsConfig: allowedDomains
  });
  
  // If wildcard is allowed, return it
  if (domains.includes('*')) {
    console.log('Using wildcard CORS');
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }
  
  // Check if request origin is in allowed domains
  const allowedOrigin = domains.find(domain => 
    requestOrigin === domain || 
    (domain.startsWith('*.') && requestOrigin?.endsWith(domain.slice(1)))
  );
  
  console.log('CORS Match Result:', {
    allowedOrigin,
    fallbackDomain: domains[0]
  });
  
  // Always return a valid origin - if not found, use first domain as fallback
  const finalOrigin = allowedOrigin || domains[0];
  
  return {
    'Access-Control-Allow-Origin': finalOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };
}
