/// <reference types="vite/client" />

// src/api.ts
import type { RedirectData } from './types';

// Read configuration from environment variables (provided by Vite)
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '';
const SAVE_TO_CLOUD = import.meta.env.VITE_SAVE_TO_CLOUD === 'true';

/**
 * Saves a new redirect entry to the backend via AWS API Gateway and Lambda.
 * @param redirectData The redirect data to save.
 * @param token Optional JWT token from Auth0 for authenticated storage.
 */
export async function saveRedirectToBackend(redirectData: RedirectData, token?: string): Promise<void> {
  if (!SAVE_TO_CLOUD || !API_ENDPOINT) {
    console.log('Cloud saving is disabled in this environment (Local Only).');
    return;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(redirectData),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Could not parse error response.' }));
      throw new Error(`API request failed with status ${response.status}: ${errorBody.message || 'Unknown error'}`);
    }

    console.log('Successfully saved redirect to backend:', await response.json());
  } catch (error) {
    console.error('Error saving redirect to backend:', error);
    throw error;
  }
}

/**
 * Fetches the user's redirect log history from the backend.
 * @param token JWT token from Auth0 to prove identity.
 * @param q Optional search query parameter to filter history in backend.
 */
export async function getRedirectsFromBackend(token: string, q?: string): Promise<RedirectData[]> {
  if (!SAVE_TO_CLOUD || !API_ENDPOINT) {
    console.log('Cloud fetch is disabled in this environment (Local Only).');
    return [];
  }

  try {
    const url = q ? `${API_ENDPOINT}?q=${encodeURIComponent(q)}` : API_ENDPOINT;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Could not parse error response.' }));
      throw new Error(`API request failed with status ${response.status}: ${errorBody.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data as RedirectData[];
  } catch (error) {
    console.error('Error fetching redirects from backend:', error);
    throw error;
  }
}

/**
 * Deletes a specific redirect log entry from the backend database.
 * @param id The unique identifier of the redirect entry to delete.
 * @param token JWT token from Auth0.
 */
export async function deleteRedirectFromBackend(id: string, token: string): Promise<void> {
  if (!SAVE_TO_CLOUD || !API_ENDPOINT) {
    return;
  }

  try {
    const response = await fetch(`${API_ENDPOINT}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Could not parse error response.' }));
      throw new Error(`API request failed with status ${response.status}: ${errorBody.message || 'Unknown error'}`);
    }

    console.log(`Successfully deleted redirect ${id} from backend.`);
  } catch (error) {
    console.error('Error deleting redirect from backend:', error);
    throw error;
  }
}