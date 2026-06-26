export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
};

export function hasApiBaseUrl() {
  return config.apiBaseUrl.trim().length > 0;
}
