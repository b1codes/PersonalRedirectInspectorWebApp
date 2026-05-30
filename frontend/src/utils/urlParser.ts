/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import type { RedirectData } from '../types';

/**
 * Determines which URL to inspect based on the browser's current URL and any custom default configured by the user.
 */
export function determineUrlToParse(pageUrl: string, defaultCustomUrl?: string): string {
  try {
    const currentWindowUrlObj = new URL(pageUrl);
    const hasMeaningfulQuery = currentWindowUrlObj.searchParams.toString() !== '';
    const hasMeaningfulHash = currentWindowUrlObj.hash !== '' && currentWindowUrlObj.hash !== '#';

    if (!hasMeaningfulQuery && !hasMeaningfulHash && defaultCustomUrl) {
      try {
        new URL(defaultCustomUrl);
        return defaultCustomUrl;
      } catch (e) {
        console.warn("Invalid default custom URL, falling back to browser's URL:", defaultCustomUrl, e);
        return pageUrl;
      }
    }
  } catch (error) {
    console.error('Invalid pageUrl passed to determineUrlToParse:', pageUrl, error);
  }
  return pageUrl;
}

/**
 * Parses a given URL into a structured format containing query parameters and the URL fragment.
 */
export function parseUrlToRedirectData(urlToParse: string): Omit<RedirectData, 'id' | 'timestamp'> | null {
  try {
    const parsedUrl = new URL(urlToParse);
    return {
      fullUrl: parsedUrl.href,
      queryParams: Array.from(parsedUrl.searchParams.entries()).map(([key, value]) => ({ key, value })),
      fragment: parsedUrl.hash,
    };
  } catch (error) {
    console.error('Failed to parse URL for redirect data:', urlToParse, error);
    return null;
  }
}
