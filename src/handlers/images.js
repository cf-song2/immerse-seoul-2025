// Image handling functions
import { jsonResponse, errorResponse, corsHeaders, devCorsHeaders } from '../utils/response.js';
import { getDynamicCorsHeaders } from '../utils/cors.js';

export async function handleImageGeneration(request, env, ctx) {
  const requestOrigin = request.headers.get('Origin');
  const headers = getDynamicCorsHeaders(requestOrigin, env.ENVIRONMENT || 'development');

  try {
    const body = await request.json();
    const { prompt, negative_prompt, width = 512, height = 512, is_public = false } = body;

    if (!prompt) {
      return errorResponse('Prompt is required', 400, headers);
    }

    // Get user plan
    const userPlan = await env.DB.prepare(
      'SELECT plan FROM users WHERE id = ?'
    ).bind(request.user.id).first();
    
    const normalizedPlan = (userPlan.plan || '').toLowerCase().trim();

    console.log('Original prompt:', prompt);
    
    // Enhance prompt using Cloudflare's small LLM model
    let enhancedPrompt = prompt;
    try {
      // Use a small LLM model to enhance the prompt
      const promptEngineeringResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are a prompt engineering assistant. Your job is to enhance image generation prompts to produce better quality images. Add more details, artistic style, lighting, and composition elements. Keep your response concise and only return the enhanced prompt without explanations.'
          },
          {
            role: 'user',
            content: `Enhance this image generation prompt: "${prompt}"`
          }
        ]
      });
      
      // Extract the response based on the structure
      if (promptEngineeringResponse.response) {
        enhancedPrompt = promptEngineeringResponse.response.trim();
      } else if (promptEngineeringResponse.text) {
        enhancedPrompt = promptEngineeringResponse.text.trim();
      } else if (typeof promptEngineeringResponse === 'string') {
        enhancedPrompt = promptEngineeringResponse.trim();
      }
      
      // Verify we got a meaningful response
      if (!enhancedPrompt || enhancedPrompt.length < prompt.length / 2) {
        console.log('Enhanced prompt too short or empty, using original');
        enhancedPrompt = prompt;
      }
      
      console.log('Enhanced prompt:', enhancedPrompt);
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      // Fall back to original prompt if enhancement fails
      enhancedPrompt = prompt;
    }

    const isPremiumPlan = normalizedPlan === 'enterprise' || normalizedPlan === 'premium';
    
    console.log(`Using AI gateway for user plan: ${normalizedPlan} (Premium: ${isPremiumPlan})`);

    // Use AI gateway to call the model
    let gatewayResponse;
    
    try {
      console.log('Calling AI gateway...');
      
      // Choose model based on user plan
      const modelName = isPremiumPlan ? '@cf/black-forest-labs/flux-1-schnell' : '@cf/stabilityai/stable-diffusion-xl-base-1.0';
      console.log(`Using model: ${modelName}`);
      
      gatewayResponse = await env.AI.gateway("immerse-gateway").run(
        {
          model: modelName,
          prompt: enhancedPrompt,
          negative_prompt,
          width,
          height,
          num_steps: 20,
          guidance: 7.5,
        }
      );
      
      console.log('AI gateway call successful');
    } catch (gatewayError) {
      console.error('AI gateway call failed:', gatewayError);
      throw new Error('Image generation failed');
    }
    
    // Extract the actual image response and rate limit information
    console.log('Gateway response type:', typeof gatewayResponse);
    console.log('Gateway response structure:', Object.keys(gatewayResponse));
    
    // Extract rate limit information if available
    let rateLimitInfo = {};
    if (gatewayResponse.headers) {
      console.log('Gateway response headers:', gatewayResponse.headers);
      // Look for rate limit headers
      ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'].forEach(header => {
        if (gatewayResponse.headers[header]) {
          rateLimitInfo[header] = gatewayResponse.headers[header];
        }
      });
    }
    
    // Check for rate limit info in metadata
    if (gatewayResponse.metadata && gatewayResponse.metadata.rateLimit) {
      console.log('Found rate limit info in metadata:', gatewayResponse.metadata.rateLimit);
      rateLimitInfo = { ...rateLimitInfo, ...gatewayResponse.metadata.rateLimit };
    }
    
    console.log('Rate limit info:', rateLimitInfo);
    
    // Extract response from AI gateway
    let response;
    if (gatewayResponse.result) {
      console.log('Using gatewayResponse.result');
      response = gatewayResponse.result;
    } else if (gatewayResponse.data) {
      console.log('Using gatewayResponse.data');
      response = gatewayResponse.data;
    } else {
      console.log('Using gatewayResponse directly');
      response = gatewayResponse;
    }

    console.log('AI response type:', typeof response);
    console.log('AI response keys:', response ? Object.keys(response) : 'null');
    console.log('Response sample:', JSON.stringify(response).substring(0, 500));
    console.log('Full response for debugging:', response);

    const imageId = crypto.randomUUID();
    const filename = `${request.user.id}/${imageId}.png`;
    
    let imageData;
    
    // Log detailed information about the response for debugging
    console.log('Response structure details:');
    if (response) {
      console.log('- Is ReadableStream:', response instanceof ReadableStream);
      console.log('- Has image property:', !!response.image);
      if (response.image) {
        console.log('  - Image type:', typeof response.image);
        console.log('  - Is image ReadableStream:', response.image instanceof ReadableStream);
      }
      console.log('- Has b64_json property:', !!response.b64_json);
      console.log('- Has data property:', !!response.data);
      if (response.data) {
        console.log('  - Data type:', typeof response.data);
        if (response.data && response.data.length > 0) {
          console.log('  - First data item has b64_json:', !!response.data[0].b64_json);
        }
      }
      
      // Log model-specific information
      console.log('- User plan:', userPlan.plan);
      if (userPlan.plan === 'enterprise') {
        console.log('- Using flux-1-schnell model (Base64 output expected)');
      } else {
        console.log('- Using stable-diffusion-xl model (ReadableStream output expected)');
      }
    }
    
    // Handle ReadableStream response
    if (response instanceof ReadableStream) {
      console.log('Response is ReadableStream - converting to Uint8Array');
      const reader = response.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const imageBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        imageBuffer.set(chunk, offset);
        offset += chunk.length;
      }
      imageData = imageBuffer;
    } 
    // Handle response.image as ReadableStream
    else if (response.image instanceof ReadableStream) {
      console.log('Response.image is ReadableStream - converting to Uint8Array');
      const reader = response.image.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const imageBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        imageBuffer.set(chunk, offset);
        offset += chunk.length;
      }
      imageData = imageBuffer;
    }
    // Handle flux-1-schnell model output (enterprise plan) - Base64 string
    else if (userPlan.plan === 'enterprise' && typeof response === 'string') {
      console.log('Enterprise plan: Found direct string response - treating as base64');
      try {
        // Check if the string starts with data URI prefix
        if (response.startsWith('data:image')) {
          // Extract the base64 part from data URI
          const base64Data = response.split(',')[1];
          const binaryString = atob(base64Data);
          imageData = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
        } else {
          // Treat as raw base64
          const binaryString = atob(response);
          imageData = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
        }
      } catch (error) {
        console.error('Error decoding base64 string:', error);
        throw new Error('Invalid base64 image data from flux-1-schnell model');
      }
    }
    // Handle OpenAI-style response with b64_json
    else if (response.b64_json) {
      console.log('Found b64_json in response - converting to Uint8Array');
      const binaryString = atob(response.b64_json);
      imageData = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
    }
    // Handle OpenAI-style response with data array
    else if (response.data && response.data.length > 0) {
      if (response.data[0].b64_json) {
        console.log('Found b64_json in response.data[0] - converting to Uint8Array');
        const binaryString = atob(response.data[0].b64_json);
        imageData = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
      } else if (typeof response.data[0] === 'string') {
        console.log('Found string in response.data[0] - treating as base64');
        try {
          const binaryString = atob(response.data[0]);
          imageData = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
        } catch (error) {
          console.error('Error decoding base64 string from data array:', error);
          throw new Error('Invalid base64 image data in response.data');
        }
      }
    }
    // Handle response.image as various formats
    else if (response.image) {
      if (typeof response.image === 'string') {
        console.log('Response.image is string - treating as base64');
        try {
          const binaryString = atob(response.image);
          imageData = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
        } catch (error) {
          console.error('Error decoding base64 string from response.image:', error);
          throw new Error('Invalid base64 image data in response.image');
        }
      } else if (response.image instanceof Uint8Array) {
        console.log('Response.image is Uint8Array');
        imageData = response.image;
      } else if (response.image instanceof ArrayBuffer) {
        console.log('Response.image is ArrayBuffer');
        imageData = new Uint8Array(response.image);
      } else {
        console.error('Unhandled response.image format:', typeof response.image);
        throw new Error(`Unhandled response.image format: ${typeof response.image}`);
      }
    }
    // Handle direct Uint8Array or ArrayBuffer
    else if (response instanceof Uint8Array) {
      console.log('Response is Uint8Array');
      imageData = response;
    } else if (response instanceof ArrayBuffer) {
      console.log('Response is ArrayBuffer');
      imageData = new Uint8Array(response);
    }
    // Handle string response (assuming base64)
    else if (typeof response === 'string') {
      console.log('Response is string - treating as base64');
      const binaryString = atob(response);
      imageData = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
    }
    // Handle binary response
    else if (response.body && response.body instanceof ReadableStream) {
      console.log('Response has body as ReadableStream');
      const reader = response.body.getReader();
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const imageBuffer = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        imageBuffer.set(chunk, offset);
        offset += chunk.length;
      }
      imageData = imageBuffer;
    }
    // Unknown format
    else {
      console.error('Unknown response format:', response);
      throw new Error(`Unknown response format: ${JSON.stringify(response).substring(0, 100)}...`);
    }
    
    console.log('Successfully extracted image data, size:', imageData ? imageData.length : 'unknown');

    // Determine the appropriate content type based on the model and response format
    let contentType = 'image/png'; // Default content type
    
    // For enterprise users with flux-1-schnell model, the output might be JPEG
    if (userPlan.plan === 'enterprise') {
      // Check if we can determine the format from the response
      if (typeof response === 'string' && response.startsWith('data:image/jpeg')) {
        contentType = 'image/jpeg';
      } else if (typeof response === 'string' && response.startsWith('data:image/webp')) {
        contentType = 'image/webp';
      }
    }
    
    console.log(`Saving image with content type: ${contentType}`);
    
    // Save to R2 with the determined content type
    await env.IMAGES_BUCKET.put(filename, imageData, {
      httpMetadata: {
        contentType: contentType,
      },
      customMetadata: {
        userId: request.user.id,
        prompt,
        negative_prompt: negative_prompt || '',
        width: width.toString(),
        height: height.toString(),
        created_at: new Date().toISOString(),
        model: userPlan.plan === 'enterprise' ? 'flux-1-schnell' : 'stable-diffusion-xl-base-1.0',
        content_type: contentType,
      },
    });

    console.log('Saved to R2');

    // Save metadata to D1
    await env.DB.prepare(
      `INSERT INTO images (id, user_id, filename, prompt, negative_prompt, width, height, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      imageId,
      request.user.id,
      filename,
      prompt,
      negative_prompt || '',
      width,
      height,
      is_public ? 1 : 0
    ).run();

    console.log('Image generation complete:', imageId);

    // Extract quota information from rate limit info (managed by AI gateway)
    let remainingQuota = 'unlimited';
    let totalQuota = 'unlimited';
    
    if (Object.keys(rateLimitInfo).length > 0) {
      // If we have rate limit info from the gateway
      if (rateLimitInfo['x-ratelimit-remaining']) {
        remainingQuota = rateLimitInfo['x-ratelimit-remaining'];
      } else if (rateLimitInfo.remaining) {
        remainingQuota = rateLimitInfo.remaining;
      }
      
      if (rateLimitInfo['x-ratelimit-limit']) {
        totalQuota = rateLimitInfo['x-ratelimit-limit'];
      } else if (rateLimitInfo.limit) {
        totalQuota = rateLimitInfo.limit;
      }
    }
    
    return jsonResponse({
      success: true,
      imageId,
      url: `/api/image/${imageId}`,
      remainingQuota,
      totalQuota,
      plan: userPlan.plan
    }, 200, headers);
  } catch (error) {
    console.error('Image generation error:', error);
    console.error('Error details:', error.stack);
    return errorResponse(error.message || 'Failed to generate image', 500, headers);
  }
}

export async function handleGetUserImages(request, env, ctx) {
  const requestOrigin = request.headers.get('Origin');
  const headers = getDynamicCorsHeaders(requestOrigin, env.ENVIRONMENT || 'development');

  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM images WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
    ).bind(request.user.id).all();

    return jsonResponse({ images: results }, 200, headers);
  } catch (error) {
    return errorResponse('Failed to fetch images', 500, headers);
  }
}

export async function handleGetPublicImages(request, env) {
  const requestOrigin = request.headers.get('Origin');
  const headers = getDynamicCorsHeaders(requestOrigin, env.ENVIRONMENT || 'development');

  try {
    const { results } = await env.DB.prepare(
      `SELECT i.*, u.username 
       FROM images i 
       JOIN users u ON i.user_id = u.id 
       WHERE i.is_public = 1 
       ORDER BY i.created_at DESC 
       LIMIT 50`
    ).all();

    return jsonResponse({ images: results }, 200, headers);
  } catch (error) {
    return errorResponse('Failed to fetch images', 500, headers);
  }
}

export async function handleDeleteImage(request, env, ctx) {
  const requestOrigin = request.headers.get('Origin');
  const headers = getDynamicCorsHeaders(requestOrigin, env.ENVIRONMENT || 'development');
  
  try {
    // Get image details to verify ownership
    const { imageId } = await request.json();
    
    if (!imageId) {
      return errorResponse('Image ID is required', 400, headers);
    }
    
    const image = await env.DB.prepare(
      `SELECT * FROM images WHERE id = ?`
    ).bind(imageId).first();
    
    if (!image) {
      return errorResponse('Image not found', 404, headers);
    }
    
    // Verify user owns the image
    if (image.user_id !== request.user.id) {
      return errorResponse('Unauthorized', 403, headers);
    }
    
    // Delete from R2 bucket
    await env.IMAGES_BUCKET.delete(image.filename);
    
    // Delete from database
    await env.DB.prepare(
      `DELETE FROM images WHERE id = ?`
    ).bind(imageId).run();
    
    return jsonResponse({
      success: true,
      message: 'Image deleted successfully'
    }, 200, headers);
  } catch (error) {
    console.error('Image deletion error:', error);
    return errorResponse('Failed to delete image', 500, headers);
  }
}

export async function handleGetImage(request, pathname, env) {
  const requestOrigin = request.headers.get('Origin');
  const headers = getDynamicCorsHeaders(requestOrigin, env.ENVIRONMENT || 'development');
  
  const imageId = pathname.split('/').pop();
  
  try {
    const image = await env.DB.prepare(
      `SELECT * FROM images WHERE id = ?`
    ).bind(imageId).first();

    if (!image) {
      return new Response('Image not found', { status: 404, headers });
    }

    // Check access permissions
    const authHeader = request.headers.get('Authorization');
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { authenticateRequest } = await import('../auth/middleware.js');
      const auth = await authenticateRequest(request, env);
      if (auth.authenticated) {
        userId = auth.user.id;
      }
    }

    // If image is not public and user is not the owner
    if (!image.is_public && image.user_id !== userId) {
      return new Response('Unauthorized', { status: 403, headers });
    }

    const object = await env.IMAGES_BUCKET.get(image.filename);
    
    if (!object) {
      return new Response('Image file not found', { status: 404, headers });
    }

    // Create proper response headers
    const responseHeaders = new Headers();
    
    // Set CORS headers
    Object.entries(headers).forEach(([k, v]) => responseHeaders.set(k, v));
    
    // Determine content type based on filename or metadata
    let contentType = 'image/png'; // Default content type
    
    // Check if we can determine content type from filename
    if (image.filename.toLowerCase().endsWith('.jpg') || image.filename.toLowerCase().endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (image.filename.toLowerCase().endsWith('.webp')) {
      contentType = 'image/webp';
    }
    
    // If R2 object has content-type metadata, use that instead
    if (object.httpMetadata && object.httpMetadata['content-type']) {
      contentType = object.httpMetadata['content-type'];
    }
    
    // Set content type and caching
    responseHeaders.set('content-type', contentType);
    responseHeaders.set('Cache-Control', 'public, max-age=86400');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Add additional headers from R2 object if available
    if (object.httpMetadata) {
      Object.entries(object.httpMetadata).forEach(([k, v]) => {
        if (!responseHeaders.has(k) && k !== 'content-type') responseHeaders.set(k, v);
      });
    }
    
    // Log the response headers for debugging
    console.log('Image response headers:', Object.fromEntries([...responseHeaders.entries()]));
    
    // Return the image with proper headers
    return new Response(object.body, { headers: responseHeaders });
  } catch (error) {
    return errorResponse('Failed to fetch image', 500, headers);
  }
}