import { config, hasApiBaseUrl } from './config';

type ApiRequestOptions = RequestInit & {
  token?: string | null;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path: string) {
  if (!hasApiBaseUrl()) {
    throw new ApiError('API base URL is not configured.', 0, null);
  }

  const baseUrl = config.apiBaseUrl.replace(/\/+$/, '');
  const apiPath = path.replace(/^\/+/, '');
  return `${baseUrl}/${apiPath}`;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, body, ...requestOptions } = options;

  const formattedBody = body && typeof body === 'object' && !(body instanceof FormData)
    ? JSON.stringify(body)
    : body;

  const response = await fetch(buildUrl(path), {
    ...requestOptions,
    body: formattedBody,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });


  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: unknown }).message)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
