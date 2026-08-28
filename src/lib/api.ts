const TOKEN_KEY = 'voltwork_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('voltwork_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem('voltwork_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('voltwork_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error || response.statusText || 'An error occurred';
    throw new Error(errorMsg);
  }

  return data as T;
}
