// Utility to resolve media URLs coming from backend
// Accepts absolute URLs, protocol-relative URLs, and relative storage paths
// Examples:
// - https://example.com/storage/flyers/a.jpg => returned as-is
// - /storage/flyers/a.jpg => prefixed with backend origin
// - storage/flyers/a.jpg => prefixed with backend origin + leading slash

import { API_BASE_URL } from '../config/api';

// Derive backend origin by stripping trailing '/api' from API_BASE_URL
function getBackendOrigin() {
  try {
    const url = new URL(API_BASE_URL);
    // If baseURL includes '/api' path, remove it for static assets
    const origin = `${url.protocol}//${url.host}`;
    const basePath = url.pathname || '';
    if (basePath && basePath.endsWith('/api')) {
      return origin; // assets are typically served from root (e.g., /storage/...)
    }
    return origin;
  } catch (_) {
    // Fallback to same origin
    return '';
  }
}

const BACKEND_ORIGIN = getBackendOrigin();

export function resolveMediaUrl(input) {
  if (input === undefined || input === null || (typeof input === 'string' && input.trim() === '')) return '';
  // Convert to string if it's a number (e.g., 0 becomes '0')
  const pathStr = String(input);
  // Already absolute (http, https, data URLs)
  if (/^(https?:)?\/\//i.test(pathStr) || pathStr.startsWith('data:')) {
    return input;
  }
  // Normalize path
  let path = pathStr.trim();
  // Return empty string if path is '0' or empty after trim
  if (path === '0') return '';
  // Normalize Windows backslashes to forward slashes
  path = path.replace(/\\+/g, '/');
  // Strip common leading './' or 'public/' prefixes
  path = path.replace(/^\.\//, '');
  path = path.replace(/^public\//, '');
  // If comes from Laravel Storage::put on 'public' disk, path commonly looks like 'flyers/abc.jpg'
  // Such files are accessible via '/storage/<path>' after running `php artisan storage:link`
  const needsStoragePrefix = (
    path.startsWith('flyers/') ||
    path.startsWith('/flyers/') ||
    path.startsWith('certificates/') ||
    path.startsWith('/certificates/') ||
    path.startsWith('images/') ||
    path.startsWith('/images/') ||
    path.startsWith('uploads/') ||
    path.startsWith('/uploads/')
  );

  if (needsStoragePrefix && !/^\/?storage\//.test(path)) {
    // Remove leading slash if present then prefix with /storage
    path = `/storage/${path.replace(/^\//, '')}`;
  }

  // Ensure leading slash for relative paths
  path = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_ORIGIN}${path}`;
}
