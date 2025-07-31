// Image handling functions
import { jsonResponse, errorResponse, corsHeaders, devCorsHeaders } from '../utils/response.js';

export async function handleImageGeneration(request, env, ctx) {
  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;

  try {
    const body = await request.json();
    const { prompt, negative_prompt, width = 512, height = 512, is_public = false } = body;

    if (!prompt) {
      return errorResponse('Prompt is required', 400, headers);
    }

    // Check rate limit
    const rateLimit = await env.DB.prepare(
      'SELECT daily_count, last_reset FROM user_rate_limits WHERE user_id = ?'
    ).bind(request.user.id).first();

    const now = new Date();
    const lastReset = new Date(rateLimit.last_reset);
    const daysDiff = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

    let dailyCount = rateLimit.daily_count;
    if (daysDiff > 0) {
      // Reset daily count
      dailyCount = 0;
      await env.DB.prepare(
        'UPDATE user_rate_limits SET daily_count = 0, last_reset = ? WHERE user_id = ?'
      ).bind(now.toISOString(), request.user.id).run();
    }

    if (dailyCount >= parseInt(env.DAILY_IMAGE_LIMIT)) {
      return errorResponse(`Daily limit of ${env.DAILY_IMAGE_LIMIT} images reached`, 429, headers);
    }

    console.log('Generating image with prompt:', prompt);

    // Generate image
    const response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt,
      negative_prompt,
      width,
      height,
      num_steps: 20,
      guidance: 7.5,
    });

    console.log('AI response type:', typeof response);
    console.log('AI response keys:', Object.keys(response));
    console.log('Response sample:', JSON.stringify(response).substring(0, 200));

    const imageId = crypto.randomUUID();
    const filename = `${request.user.id}/${imageId}.png`;
    
    let imageStream;
    if (response instanceof ReadableStream) {
      console.log('Response is ReadableStream');
      imageStream = response;
    } else if (response.image instanceof ReadableStream) {
      console.log('Response.image is ReadableStream');
      imageStream = response.image;
    } else {
      // Fallback: handle Uint8Array, ArrayBuffer, base64 string as before
      let imageBuffer;
      if (response instanceof Uint8Array) {
        imageBuffer = response;
      } else if (response instanceof ArrayBuffer) {
        imageBuffer = new Uint8Array(response);
      } else if (response.image) {
        if (typeof response.image === 'string') {
          const binaryString = atob(response.image);
          imageBuffer = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
        } else if (response.image instanceof Uint8Array) {
          imageBuffer = response.image;
        } else if (response.image instanceof ArrayBuffer) {
          imageBuffer = new Uint8Array(response.image);
        }
      } else if (typeof response === 'string') {
        const binaryString = atob(response);
        imageBuffer = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
      } else {
        throw new Error('Unknown response format');
      }
      // Convert buffer to stream
      imageStream = new ReadableStream({
        start(controller) {
          controller.enqueue(imageBuffer);
          controller.close();
        }
      });
    }

    // Save to R2
    await env.IMAGES_BUCKET.put(filename, imageStream, {
      httpMetadata: {
        contentType: 'image/png',
      },
      customMetadata: {
        userId: request.user.id,
        prompt,
        negative_prompt: negative_prompt || '',
        width: width.toString(),
        height: height.toString(),
        created_at: new Date().toISOString(),
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

    // Update rate limit
    await env.DB.prepare(
      'UPDATE user_rate_limits SET daily_count = daily_count + 1 WHERE user_id = ?'
    ).bind(request.user.id).run();

    console.log('Image generation complete:', imageId);

    return jsonResponse({
      success: true,
      imageId,
      url: `/api/image/${imageId}`,
      remainingQuota: parseInt(env.DAILY_IMAGE_LIMIT) - dailyCount - 1
    }, 200, headers);
  } catch (error) {
    console.error('Image generation error:', error);
    console.error('Error details:', error.stack);
    return errorResponse(error.message || 'Failed to generate image', 500, headers);
  }
}

export async function handleGetUserImages(request, env, ctx) {
  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;

  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM images WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
    ).bind(request.user.id).all();

    return jsonResponse({ images: results }, 200, headers);
  } catch (error) {
    return errorResponse('Failed to fetch images', 500, headers);
  }
}

export async function handleGetPublicImages(env) {
  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;

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

export async function handleGetImage(request, pathname, env) {
  const headers = env.ENVIRONMENT === 'production' ? corsHeaders : devCorsHeaders;
  
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

    const responseHeaders = new Headers(object.httpMetadata);
    
    responseHeaders.set('content-type', 'image/png');
    responseHeaders.set('Cache-Control', 'public, max-age=86400');
    Object.entries(headers).forEach(([k, v]) => responseHeaders.set(k, v));

    return new Response(object.body, { headers: responseHeaders });
  } catch (error) {
    return errorResponse('Failed to fetch image', 500, headers);
  }
}