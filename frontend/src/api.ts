/// <reference types="vite/client" />

// src/api.ts
import type { RedirectData } from './types';

// Read configuration from environment variables (provided by Vite)
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '';
const SAVE_TO_CLOUD = import.meta.env.VITE_SAVE_TO_CLOUD === 'true';


/**
 * Saves a new redirect entry to the backend via AWS API Gateway and Lambda.
 * @param redirectData The redirect data to save.
 */
export async function saveRedirectToBackend(redirectData: RedirectData): Promise<void> {
  if (!SAVE_TO_CLOUD || !API_ENDPOINT) {
    console.log('Cloud saving is disabled in this environment (Local Only).');
    return;
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(redirectData),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`API request failed with status ${response.status}: ${errorBody.message}`);
    }

    console.log('Successfully saved redirect to backend:', await response.json());
  } catch (error) {
    console.error('Error saving redirect to backend:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}