// Utility to get the public production/shared URL instead of private development container origins
export function getPublicBaseUrl(): string {
  try {
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  } catch (e) {
    return window.location.origin || '';
  }
}

export function getDirectUserLink(email: string): string {
  const baseUrl = getPublicBaseUrl();
  return `${baseUrl}/#user=${encodeURIComponent(email)}`;
}
