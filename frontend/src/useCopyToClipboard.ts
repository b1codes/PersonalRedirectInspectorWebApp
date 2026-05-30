/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import { useState, useCallback } from 'react';

type CopyFn = (text: string) => Promise<boolean>;

export function useCopyToClipboard(): [boolean, CopyFn] {
  const [copied, setCopied] = useState(false);

  const copy: CopyFn = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      alert('Clipboard API not available. Please copy manually.');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      return true;
    } catch (error) {
      console.error('Failed to copy text: ', error);
      alert('Failed to copy text. See console for details.');
      setCopied(false);
      return false;
    }
  }, []);

  return [copied, copy];
}