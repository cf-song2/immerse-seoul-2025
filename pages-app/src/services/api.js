const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:8787/api' 
  : 'https://immerse-seoul-api.metamon.shop/api';

class ApiService {
  async request(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      const err = new Error(error.message || error.error || 'Request failed');
      err.response = { data: error };
      throw err;
    }

    return response.json();
  }

  // Auth endpoints
  register(data) {
    return this.request('/auth/register', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }

  login(data) {
    return this.request('/auth/login', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }

  logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  verify() {
    return this.request('/auth/verify');
  }

  // Image endpoints
  generateImage(data) {
    return this.request('/generate', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }

  getUserImages() {
    return this.request('/user/images');
  }

  getPublicImages() {
    return this.request('/images');
  }

  getImageUrl(imageId) {
    return `${API_BASE}/image/${imageId}`;
  }
  
  deleteImage(imageId) {
    return this.request('/image/delete', { 
      method: 'POST', 
      body: JSON.stringify({ imageId }) 
    });
  }
}

export default new ApiService();