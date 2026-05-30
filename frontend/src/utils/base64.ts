/**
 * @license
 * SPDX-License-Identifier: MIT
 */

/**
 * Checks if a string is a valid Base64 encoded string.
 */
export function isBase64(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') return false;
  
  const cleaned = str.trim();
  if (cleaned.length < 4) return false;

  // Base64 regex allowing standard (+/) and URL-safe (-_) characters
  const base64Regex = /^[A-Za-z0-9+/_-]+={0,2}$/;
  if (!base64Regex.test(cleaned)) return false;

  // Ensure it's not a simple short number or word
  if (/^\d+$/.test(cleaned)) return false; // Avoid plain numbers
  
  return true;
}

/**
 * Attempts to decode a Base64 string.
 * Supports both standard and URL-safe Base64, and handles UTF-8 characters correctly.
 * Returns null if the string is not valid Base64 or decodes to binary/gibberish.
 */
export function tryDecodeBase64(str: string | null | undefined): string | null {
  if (!str || !isBase64(str)) return null;

  try {
    let normalized = str.trim();
    // Normalize URL-safe Base64
    normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if missing
    while (normalized.length % 4 !== 0) {
      normalized += '=';
    }

    // Decode binary string
    const binaryString = atob(normalized);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode as UTF-8
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);

    // Filter out binary payloads/gibberish
    // We expect decoded content to be printable text/XML/JSON
    const controlCharCount = (decoded.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g) || []).length;
    if (controlCharCount / decoded.length > 0.05) {
      return null;
    }

    return decoded;
  } catch (e) {
    return null;
  }
}

/**
 * Formats the decoded content if it is JSON or XML to make it human-readable.
 */
export function formatDecodedContent(content: string): string {
  const trimmed = content.trim();

  // Check if it's JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      // Not valid JSON, continue
    }
  }

  // Check if it's XML (basic formatting)
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    try {
      return formatXml(trimmed);
    } catch {
      // Fallback to raw content if formatting fails
    }
  }

  return content;
}

/**
 * Basic XML formatter for presentation.
 */
function formatXml(xml: string): string {
  let formatted = '';
  let indent = '';
  const tab = '  ';
  // Split by tags
  const parts = xml.split(/(<\/?[^>]+>)/g).filter(part => part.trim() !== '');

  parts.forEach(part => {
    if (part.startsWith('</')) {
      // Closing tag
      indent = indent.substring(tab.length);
      formatted += indent + part + '\n';
    } else if (part.startsWith('<') && !part.endsWith('/>') && !part.startsWith('<?')) {
      // Opening tag (non-self-closing, non-declaration)
      formatted += indent + part + '\n';
      indent += tab;
    } else {
      // Self-closing tag, text content, or declaration
      formatted += indent + part + '\n';
    }
  });

  return formatted.trim();
}

/**
 * Checks if a string has the JWT format (three dot-separated base64url segments).
 */
export function isJwt(str: string | null | undefined): boolean {
  if (!str || typeof str !== 'string') return false;
  const parts = str.trim().split('.');
  if (parts.length !== 3) return false;

  // Standard Base64URL characters: A-Z, a-z, 0-9, -, _
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return base64UrlRegex.test(parts[0]) && base64UrlRegex.test(parts[1]) && (parts[2] === '' || base64UrlRegex.test(parts[2]));
}

export interface DecodedJwt {
  header: any;
  payload: any;
  headerStr: string;
  payloadStr: string;
}

/**
 * Attempts to decode a JWT. Returns header & payload objects, or null if parsing fails.
 */
export function tryDecodeJwt(str: string | null | undefined): DecodedJwt | null {
  if (!str || !isJwt(str)) return null;

  try {
    const parts = str.trim().split('.');
    
    // Decode base64url helper
    const decodePart = (part: string): string => {
      let base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    };

    const headerText = decodePart(parts[0]);
    const payloadText = decodePart(parts[1]);

    const header = JSON.parse(headerText);
    const payload = JSON.parse(payloadText);

    return {
      header,
      payload,
      headerStr: JSON.stringify(header, null, 2),
      payloadStr: JSON.stringify(payload, null, 2),
    };
  } catch (e) {
    return null;
  }
}

