import { config, hasApiBaseUrl } from './config';

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  token?: string | null;
  body?: unknown;
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

const NETWORK_ERROR_MESSAGE = 'Network issue or Wi-Fi lost. Please check your connection, or the device/server may be offline.';

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

  const formattedBody: BodyInit | null | undefined = body && typeof body === 'object' && !(body instanceof FormData)
    ? JSON.stringify(body)
    : body as BodyInit | null | undefined;

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...requestOptions,
      body: formattedBody,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, error);
  }


  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (typeof data === 'object' && data) {
      if ('message' in data) {
        message = String((data as { message: unknown }).message);
      } else if ('detail' in data) {
        const detail = (data as { detail: unknown }).detail;
        if (Array.isArray(detail)) {
          message = detail.map((item) => {
            if (typeof item === 'object' && item && 'msg' in item) {
              return String((item as { msg: unknown }).msg);
            }
            return String(item);
          }).join(', ');
        } else if (typeof detail === 'object' && detail) {
          message = 'Request could not be completed.';
        } else {
          message = String(detail);
        }
      }
    } else if (typeof data === 'string' && data.trim()) {
      message = data;
    }

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
