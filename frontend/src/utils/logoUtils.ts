/**
 * Resolves a logo URL to an absolute URL pointing to the backend host if it is a relative path.
 * Ensures logos display correctly across frontend preview, invoices, orders, dispatch sheets, and reports.
 */
export const getResolvedLogoUrl = (url?: string | null): string => {
  const defaultPath = '/api/v1/business-settings/logo';
  const targetUrl = url && url.trim().length > 0 ? url.trim() : defaultPath;

  // If already an absolute URL or base64 data URI, return directly
  if (
    targetUrl.startsWith('http://') ||
    targetUrl.startsWith('https://') ||
    targetUrl.startsWith('data:')
  ) {
    return targetUrl;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085/api/v1';
  const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;

  if (targetUrl.startsWith('/api/v1')) {
    const origin = cleanBase.endsWith('/api/v1') ? cleanBase.slice(0, -7) : cleanBase;
    return `${origin}${targetUrl}`;
  }

  return `${cleanBase}${targetUrl.startsWith('/') ? '' : '/'}${targetUrl}`;
};
