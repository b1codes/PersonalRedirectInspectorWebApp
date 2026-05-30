// index.tsx

/**
 * @license
 * SPDX-License-Identifier: MIT
 */
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Stack,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

import RedirectCard from './src/components/RedirectCard';
import AppHeader from './src/components/AppHeader';
import type { RedirectData } from './src/types';
import { 
  saveRedirectToBackend, 
  getRedirectsFromBackend, 
  deleteRedirectFromBackend 
} from './src/api';

const LOCAL_STORAGE_KEY = 'redirectHistory';
const DEFAULT_CUSTOM_URL_KEY = 'defaultCustomMonitorUrl';

// Read configuration from environment variables with safe production fallbacks
const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || 'your-tenant.auth0.com';
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || 'your-auth0-client-id';
const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.redirectinspector.com';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007BFF',
    },
    background: {
      default: '#F8F9FA',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  }
});

function App() {
  const { isAuthenticated, getAccessTokenSilently, isLoading } = useAuth0();
  const [history, setHistory] = useState<RedirectData[]>([]);
  const [manualUrlInput, setManualUrlInput] = useState<string>('');
  const [isHistoryLoaded, setIsHistoryLoaded] = useState<boolean>(false);
  
  const [defaultCustomUrl, setDefaultCustomUrl] = useState<string>(() => {
    return localStorage.getItem(DEFAULT_CUSTOM_URL_KEY) || '';
  });
  const [inputValueForDefaultUrl, setInputValueForDefaultUrl] = useState<string>(defaultCustomUrl);
  const [mainInspectedUrl, setMainInspectedUrl] = useState<string>('');

  const pageUrl = window.location.href;

  // Load history from Cloud if authenticated, otherwise fallback to local LocalStorage
  useEffect(() => {
    async function loadHistory() {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          const cloudHistory = await getRedirectsFromBackend(token);
          setHistory(cloudHistory);
        } catch (error) {
          console.error('Failed to load cloud history, falling back to local.', error);
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) setHistory(JSON.parse(stored));
        }
      } else {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          setHistory(JSON.parse(stored));
        } else {
          setHistory([]);
        }
      }
      setIsHistoryLoaded(true);
    }
    loadHistory();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Function to add an entry to history and save to backend
  const addHistoryEntry = async (entry: RedirectData) => {
    // 1. Optimistically update local state & localStorage backup
    const updatedHistory = [entry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));

    // 2. Asynchronously save to the backend (with authorization if logged in)
    try {
      let token: string | undefined = undefined;
      if (isAuthenticated) {
        token = await getAccessTokenSilently();
      }
      await saveRedirectToBackend(entry, token);
    } catch (error) {
      console.error('Failed to save redirect to the cloud:', error);
      // Standard local backup notifies the developer silently or via warning
    }
  };

  // Function to delete an entry locally and on the server
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this specific redirect history entry?')) {
      return;
    }

    // 1. Optimistically update UI
    const updatedHistory = history.filter(entry => entry.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));

    // 2. Process backend deletion
    if (isAuthenticated) {
      try {
        const token = await getAccessTokenSilently();
        await deleteRedirectFromBackend(id, token);
      } catch (error) {
        console.error('Failed to delete redirect from the cloud database:', error);
        alert('Failed to delete this entry from the secure cloud database, but it has been removed locally.');
      }
    }
  };

  // URL Parsing and Automatic Inspection
  useEffect(() => {
    if (!isHistoryLoaded) return; // Wait until initial fetch has finished to avoid duplication

    let urlToParse: string;
    const currentWindowUrlObj = new URL(pageUrl);
    const hasMeaningfulQuery = currentWindowUrlObj.searchParams.toString() !== '';
    const hasMeaningfulHash = currentWindowUrlObj.hash !== '' && currentWindowUrlObj.hash !== '#';

    if (!hasMeaningfulQuery && !hasMeaningfulHash && defaultCustomUrl) {
      try {
        new URL(defaultCustomUrl);
        urlToParse = defaultCustomUrl;
      } catch (e) {
        console.warn("Invalid default custom URL, falling back to browser's URL:", defaultCustomUrl, e);
        urlToParse = pageUrl;
      }
    } else {
      urlToParse = pageUrl;
    }
    setMainInspectedUrl(urlToParse);

    let parsedUrlForEntry;
    try {
      parsedUrlForEntry = new URL(urlToParse);
    } catch (error) {
      console.error('Failed to parse URL for entry:', urlToParse, error);
      return; 
    }
    
    const newRedirectEntry: RedirectData = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      fullUrl: parsedUrlForEntry.href,
      queryParams: Array.from(parsedUrlForEntry.searchParams.entries()).map(([key, value]) => ({ key, value })),
      fragment: parsedUrlForEntry.hash,
    };

    // Prevent recording duplication by comparing against the top history item
    if (history.length === 0 || 
        history[0].fullUrl !== newRedirectEntry.fullUrl ||
        JSON.stringify(history[0].queryParams) !== JSON.stringify(newRedirectEntry.queryParams) ||
        history[0].fragment !== newRedirectEntry.fragment
    ) {
      addHistoryEntry(newRedirectEntry);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageUrl, defaultCustomUrl, isHistoryLoaded]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all redirect history? This action cannot be undone.')) {
      setHistory([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      // Local clearing does not wipe records from cloud server
    }
  };

  const handleInspectManualUrl = (urlToInspect: string) => {
    if (!urlToInspect.trim()) {
      alert('Please enter a URL to inspect.');
      return;
    }
    try {
      new URL(urlToInspect);
    } catch (error) {
      alert('The entered URL is invalid. Please check and try again.');
      return;
    }
    const newRedirectEntry: RedirectData = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      fullUrl: urlToInspect,
      queryParams: Array.from(new URL(urlToInspect).searchParams.entries()).map(([key, value]) => ({ key, value })),
      fragment: new URL(urlToInspect).hash,
    };
    addHistoryEntry(newRedirectEntry);
    setManualUrlInput('');
  };

  const handleSetDefaultCustomUrl = (newUrl: string) => {
    const trimmedUrl = newUrl.trim();
    if (trimmedUrl === '') {
      localStorage.removeItem(DEFAULT_CUSTOM_URL_KEY);
      setDefaultCustomUrl('');
      alert('Default monitored URL cleared.');
      return;
    }
    try {
      new URL(trimmedUrl);
      localStorage.setItem(DEFAULT_CUSTOM_URL_KEY, trimmedUrl);
      setDefaultCustomUrl(trimmedUrl);
      alert('Default monitored URL set successfully.');
    } catch (error) {
      alert('Invalid URL for default. Please enter a valid URL.');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
        <CircularProgress size={50} />
        <Typography color="text.secondary">Loading secure redirect session...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4}}>
      <AppHeader
        autoInspectedUri={mainInspectedUrl}
        historyLength={history.length}
        onClearHistory={handleClearHistory}
        manualUrlInput={manualUrlInput}
        onManualUrlInputChange={setManualUrlInput}
        onInspectManualUrl={handleInspectManualUrl}
        defaultCustomUrlInputValue={inputValueForDefaultUrl}
        onDefaultCustomUrlInputChange={setInputValueForDefaultUrl}
        onSetDefaultCustomUrl={handleSetDefaultCustomUrl}
        currentDefaultUrlSet={defaultCustomUrl}
      />
      <br/>
      <main>
        {history.length === 0 ? (
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', mt: 4, border: '1px dashed', borderColor: 'grey.400' }}>
            <Typography color="text.secondary" sx={{ lineHeight: 1.5 }}>
              No redirects recorded yet. New redirects to this page will appear here automatically.
              <br />
              You can also set a default URL to monitor or manually inspect a URL using the inputs above.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={3} aria-live="polite">
            {history.map(redirect => (
              <RedirectCard 
                key={redirect.id} 
                data={redirect} 
                onDelete={handleDeleteEntry}
              />
            ))}
          </Stack>
        )}
      </main>
    </Container>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = (ReactDOM as any).createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: AUTH0_AUDIENCE
        }}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </Auth0Provider>
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}