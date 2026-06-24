import { apiRequest } from './api';
import { config, hasApiBaseUrl } from './config';

const AUTH_STORAGE_KEY = 'aqua-pulse-auth';
const DEMO_PASSWORD = '123';

export type UserRole = 'agent' | 'manager' | 'owner';

const demoUsers: Record<string, AuthUser> = {
  'agent@gmail.com': {
    id: 'agent-demo-user',
    name: 'Agent User',
    email: 'agent@gmail.com',
    role: 'agent',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=agent&backgroundColor=0a2a47',
  },
  'manager@gmail.com': {
    id: 'manager-demo-user',
    name: 'Manager User',
    email: 'manager@gmail.com',
    role: 'manager',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager&backgroundColor=0a2a47',
  },
  'owner@gmail.com': {
    id: 'owner-demo-user',
    name: 'Owner User',
    email: 'owner@gmail.com',
    role: 'owner',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner&backgroundColor=0a2a47',
  },
};

export interface LoginCredentials {
  email: string;
  password: string;
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
  const token = response.token || response.accessToken;

  if (!token) {
    throw new Error('Login response did not include token or accessToken.');
  }

  return {
    token,
    user: {
      id: response.user?.id || email,
      name: response.user?.name || email.split('@')[0] || 'User',
      email: response.user?.email || email,
      role: normalizeRole(response.user?.role),
      avatarUrl: response.user?.avatarUrl,
    },
  };
}

function createMockSession(credentials: LoginCredentials): AuthSession {
  const email = credentials.email.trim().toLowerCase();
  const user = demoUsers[email];

  if (!user || credentials.password !== DEMO_PASSWORD) {
    throw new Error('Use agent@gmail.com, manager@gmail.com, or owner@gmail.com with password 123.');
  }

  return {
    token: `mock-${user.role}-token`,
    user,
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
  if (!hasApiBaseUrl() && config.enableMockAuth) {
    const session = createMockSession(credentials);
    saveAuthSession(session);
    return session;
  }

  const response = await apiRequest<BackendLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  const session = normalizeLoginResponse(response, credentials.email);
  saveAuthSession(session);
  return session;
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
