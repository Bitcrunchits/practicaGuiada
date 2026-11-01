const API_URL = process.env.EXPO_PUBLIC_API_URL

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  token?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(API_URL + path, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: 'Bearer ' + options.token } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.message ?? 'Error del servidor', response.status);
  return data as T;
}