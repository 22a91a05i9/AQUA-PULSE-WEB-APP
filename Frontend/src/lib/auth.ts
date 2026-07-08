import { apiRequest } from './api';
import { hasApiBaseUrl } from './config';

const AUTH_STORAGE_KEY = 'aqua-pulse-auth';

export type UserRole = 'agent' | 'manager' | 'owner';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token?: string | null;
  expires_at?: string | null;
  email_sent?: boolean;
  smtp_configured?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

interface BackendLoginResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  user?: Partial<AuthUser>;
}

function normalizeRole(role: unknown): UserRole {
  const normalizedRole = String(role || '').toLowerCase();

  if (normalizedRole === 'manager' || normalizedRole === 'owner') {
    return normalizedRole;
  }

  return 'agent';
}

function normalizeLoginResponse(response: BackendLoginResponse, email: string): AuthSession {
  const token = response.token || response.accessToken || response.access_token;

  if (!token) {
    throw new Error('Login response did not include token or accessToken.');
  }

  const user = response.user || ({} as any);
  return {
    token,
    user: {
      id: user.id || email,
      name: user.full_name || user.name || email.split('@')[0] || 'User',
      email: user.email || email,
      role: normalizeRole(user.role),
      avatarUrl: user.avatarUrl,
    },
  };
}

export function saveAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as AuthSession;

    return {
      ...session,
      user: {
        ...session.user,
        role: normalizeRole(session.user.role),
      },
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  if (!hasApiBaseUrl()) {
    throw new Error('API server URL is not configured. Set VITE_API_BASE_URL in your .env file.');
  }

  const response = await apiRequest<BackendLoginResponse>('/auth/login', {
    method: 'POST',
    body: credentials,
  });
  const session = normalizeLoginResponse(response, credentials.email);
  saveAuthSession(session);
  return session;
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  return apiRequest<ForgotPasswordResponse>('/auth/password-reset/request', {
    method: 'POST',
    body: { email },
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/password-reset/confirm', {
    method: 'POST',
    body: {
      token,
      new_password: newPassword,
    },
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const session = getAuthSession();
  if (!session) {
    throw new Error('Please log in again before changing your password.');
  }

  return apiRequest<{ message: string }>('/auth/change-password', {
    method: 'POST',
    token: session.token,
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

export async function logout() {
  const session = getAuthSession();

  if (session && hasApiBaseUrl()) {
    await apiRequest('/auth/logout', {
      method: 'POST',
      token: session.token,
    }).catch(() => undefined);
  }

  clearAuthSession();
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = getAuthSession();

  if (!session) {
    return null;
  }

  if (!hasApiBaseUrl()) {
    return session.user;
  }

  const user = await apiRequest<AuthUser>('/auth/me', {
    token: session.token,
  });

  const updatedSession = { ...session, user };
  saveAuthSession(updatedSession);
  return user;
}
