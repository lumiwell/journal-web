import Cookies from 'js-cookie';
const API_BASE = '';
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get('auth_token');
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone) {
      headers.set('X-Timezone', timeZone);
    }
  } catch (e) {
    console.error("Failed to get timezone", e);
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}
