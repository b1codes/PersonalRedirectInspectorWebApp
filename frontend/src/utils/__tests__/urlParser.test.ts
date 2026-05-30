import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { determineUrlToParse, parseUrlToRedirectData } from '../urlParser';

describe('urlParser Utilities', () => {
  describe('determineUrlToParse', () => {
    const originalConsoleWarn = console.warn;

    beforeEach(() => {
      console.warn = vi.fn();
    });

    afterEach(() => {
      console.warn = originalConsoleWarn;
    });

    it('should return browser URL when no query, hash, or defaultCustomUrl is present', () => {
      const pageUrl = 'http://localhost:5173/';
      const result = determineUrlToParse(pageUrl, '');
      expect(result).toBe(pageUrl);
    });

    it('should return browser URL when browser URL has query parameters', () => {
      const pageUrl = 'http://localhost:5173/?name=test';
      const result = determineUrlToParse(pageUrl, 'http://example.com');
      expect(result).toBe(pageUrl);
    });

    it('should return browser URL when browser URL has hash fragment', () => {
      const pageUrl = 'http://localhost:5173/#profile';
      const result = determineUrlToParse(pageUrl, 'http://example.com');
      expect(result).toBe(pageUrl);
    });

    it('should return defaultCustomUrl when browser URL is plain and defaultCustomUrl is valid', () => {
      const pageUrl = 'http://localhost:5173/';
      const defaultUrl = 'http://example.com/redirect?param=value#success';
      const result = determineUrlToParse(pageUrl, defaultUrl);
      expect(result).toBe(defaultUrl);
    });

    it('should fallback to browser URL and warn when defaultCustomUrl is invalid', () => {
      const pageUrl = 'http://localhost:5173/';
      const defaultUrl = 'invalid-url';
      const result = determineUrlToParse(pageUrl, defaultUrl);
      expect(result).toBe(pageUrl);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('parseUrlToRedirectData', () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
      console.error = vi.fn();
    });

    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('should parse a complex URL with query parameters and hash correctly', () => {
      const url = 'https://example.com/oauth/callback?code=12345&state=xyz#access_token=token123';
      const result = parseUrlToRedirectData(url);
      
      expect(result).not.toBeNull();
      expect(result!.fullUrl).toBe(url);
      expect(result!.fragment).toBe('#access_token=token123');
      expect(result!.queryParams).toEqual([
        { key: 'code', value: '12345' },
        { key: 'state', value: 'xyz' }
      ]);
    });

    it('should parse a plain URL with no query or hash correctly', () => {
      const url = 'https://example.com/';
      const result = parseUrlToRedirectData(url);
      
      expect(result).not.toBeNull();
      expect(result!.fullUrl).toBe(url);
      expect(result!.fragment).toBe('');
      expect(result!.queryParams).toEqual([]);
    });

    it('should return null and log an error for an invalid URL', () => {
      const url = 'not-a-valid-url';
      const result = parseUrlToRedirectData(url);
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
