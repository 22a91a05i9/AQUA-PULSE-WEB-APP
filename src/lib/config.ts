export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  enableMockAuth: import.meta.env.VITE_ENABLE_MOCK_AUTH !== 'false',
};

export function hasApiBaseUrl() {
  return config.apiBaseUrl.trim().length > 0;
}
