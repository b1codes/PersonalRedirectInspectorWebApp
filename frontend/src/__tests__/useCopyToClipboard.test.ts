import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCopyToClipboard } from '../useCopyToClipboard';

describe('useCopyToClipboard', () => {
  const originalClipboard = navigator.clipboard;
  const originalAlert = window.alert;

  beforeEach(() => {
    vi.useFakeTimers();
    // Reset mocks/globals
    vi.stubGlobal('alert', vi.fn());
    // Use vi.spyOn or mock navigator
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: originalClipboard,
    });
    vi.stubGlobal('alert', originalAlert);
  });

  it('should initialize with copied=false', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [copied] = result.current;
    expect(copied).toBe(false);
  });

  it('should successfully copy text, set copied to true, and reset after timeout', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [, copy] = result.current;

    let copyResult: boolean = false;
    await act(async () => {
      copyResult = await copy('hello world');
    });

    expect(copyResult).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world');
    
    // First element in result tuple should be copied=true now
    expect(result.current[0]).toBe(true);

    // Fast-forward timers by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should reset back to false
    expect(result.current[0]).toBe(false);
  });

  it('should show alert and return false when clipboard is not available', async () => {
    // Temporarily make clipboard undefined
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useCopyToClipboard());
    const [, copy] = result.current;

    let copyResult: boolean = true;
    await act(async () => {
      copyResult = await copy('test');
    });

    expect(copyResult).toBe(false);
    expect(window.alert).toHaveBeenCalledWith('Clipboard API not available. Please copy manually.');
    expect(result.current[0]).toBe(false);
  });

  it('should handle clipboard error, show alert, and return false', async () => {
    // Make writeText throw an error
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Write permission denied')),
      },
    });

    const { result } = renderHook(() => useCopyToClipboard());
    const [, copy] = result.current;

    let copyResult: boolean = true;
    await act(async () => {
      copyResult = await copy('test');
    });

    expect(copyResult).toBe(false);
    expect(window.alert).toHaveBeenCalledWith('Failed to copy text. See console for details.');
    expect(result.current[0]).toBe(false);
  });
});
