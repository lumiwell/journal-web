import Cookies from 'js-cookie';

const API_BASE = 'http://127.0.0.1:8000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get('auth_token');
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}
