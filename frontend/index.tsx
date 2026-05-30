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
  CircularProgress,
  Button
} from '@mui/material';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { Provider } from 'react-redux';

import RedirectCard from './src/components/RedirectCard';
import AppHeader from './src/components/AppHeader';
import type { RedirectData } from './src/types';
import { determineUrlToParse, parseUrlToRedirectData } from './src/utils/urlParser';
import { store, useAppDispatch, useAppSelector } from './src/store/store';
import { 
  fetchHistory, 
  saveAndAddEntry, 
  deleteEntryThunk, 
  clearHistory, 
  setDefaultUrl, 
  setMainInspectedUrl,
  setSearchQuery 
} from './src/store/redirectSlice';

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
  const dispatch = useAppDispatch();

  const history = useAppSelector((state) => state.redirects.history);
  const isHistoryLoaded = useAppSelector((state) => state.redirects.isHistoryLoaded);
  const defaultCustomUrl = useAppSelector((state) => state.redirects.defaultCustomUrl);
  const mainInspectedUrl = useAppSelector((state) => state.redirects.mainInspectedUrl);
  const searchQuery = useAppSelector((state) => state.redirects.searchQuery);

  const [manualUrlInput, setManualUrlInput] = useState<string>('');
  const [inputValueForDefaultUrl, setInputValueForDefaultUrl] = useState<string>(defaultCustomUrl);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState<number>(5);

  const pageUrl = window.location.href;

  const filteredHistory = history.filter((entry) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Check full URL
    if (entry.fullUrl.toLowerCase().includes(query)) return true;
    
    // Check fragment
    if (entry.fragment && entry.fragment.toLowerCase().includes(query)) return true;
    
    // Check query parameter keys or values
    return entry.queryParams.some(
      (param) =>
        param.key.toLowerCase().includes(query) ||
        param.value.toLowerCase().includes(query)
    );
  });

  // Sync manual input initial value with loaded default custom URL
  useEffect(() => {
    setInputValueForDefaultUrl(defaultCustomUrl);
  }, [defaultCustomUrl]);

  // Load history from Cloud if authenticated, otherwise fallback to local LocalStorage
  useEffect(() => {
    async function loadHistory() {
      let token: string | undefined = undefined;
      if (isAuthenticated) {
        try {
          token = await getAccessTokenSilently();
        } catch (error) {
          console.error('Failed to get Auth0 token:', error);
        }
      }
      dispatch(fetchHistory({ token }));
    }
    loadHistory();
  }, [isAuthenticated, getAccessTokenSilently, dispatch]);

  // Function to add an entry to history and save to backend
  const addHistoryEntry = async (entry: RedirectData) => {
    let token: string | undefined = undefined;
    if (isAuthenticated) {
      try {
        token = await getAccessTokenSilently();
      } catch (error) {
        console.error('Failed to get Auth0 token:', error);
      }
    }
    dispatch(saveAndAddEntry({ entry, token }));
  };

  // Function to delete an entry locally and on the server
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this specific redirect history entry?')) {
      return;
    }

    let token: string | undefined = undefined;
    if (isAuthenticated) {
      try {
        token = await getAccessTokenSilently();
      } catch (error) {
        console.error('Failed to get Auth0 token:', error);
      }
    }
    dispatch(deleteEntryThunk({ id, token }));
  };

  // URL Parsing and Automatic Inspection
  useEffect(() => {
    if (!isHistoryLoaded) return; // Wait until initial fetch has finished to avoid duplication

    const urlToParse = determineUrlToParse(pageUrl, defaultCustomUrl);
    dispatch(setMainInspectedUrl(urlToParse));

    const parsedData = parseUrlToRedirectData(urlToParse);
    if (!parsedData) return;

    const newRedirectEntry: RedirectData = {
      ...parsedData,
      id: Date.now().toString(),
      timestamp: Date.now(),
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
  }, [pageUrl, defaultCustomUrl, isHistoryLoaded, dispatch]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all redirect history? This action cannot be undone.')) {
      dispatch(clearHistory());
    }
  };

  const handleInspectManualUrl = (urlToInspect: string) => {
    const trimmed = urlToInspect.trim();
    if (!trimmed) {
      alert('Please enter a URL to inspect.');
      return;
    }
    const parsedData = parseUrlToRedirectData(trimmed);
    if (!parsedData) {
      alert('The entered URL is invalid. Please check and try again.');
      return;
    }
    const newRedirectEntry: RedirectData = {
      ...parsedData,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    addHistoryEntry(newRedirectEntry);
    setManualUrlInput('');
  };

  const handleSetDefaultCustomUrl = (newUrl: string) => {
    const trimmedUrl = newUrl.trim();
    if (trimmedUrl === '') {
      dispatch(setDefaultUrl(''));
      alert('Default monitored URL cleared.');
      return;
    }
    try {
      new URL(trimmedUrl);
      dispatch(setDefaultUrl(trimmedUrl));
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
        searchQuery={searchQuery}
        onSearchQueryChange={(value) => dispatch(setSearchQuery(value))}
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
        ) : filteredHistory.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mt: 4, border: '1px dashed', borderColor: 'grey.400' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No matching redirects found
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
              Your search for "{searchQuery}" did not return any results. Try refining your keywords.
            </Typography>
            <Button variant="outlined" onClick={() => dispatch(setSearchQuery(''))}>
              Clear Search
            </Button>
          </Paper>
        ) : (
          <Stack spacing={3} aria-live="polite">
            {filteredHistory.slice(0, visibleHistoryCount).map(redirect => (
              <RedirectCard 
                key={redirect.id} 
                data={redirect} 
                onDelete={handleDeleteEntry}
              />
            ))}
            {filteredHistory.length > 5 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                {filteredHistory.length > visibleHistoryCount ? (
                  <Button
                    variant="outlined"
                    onClick={() => setVisibleHistoryCount(filteredHistory.length)}
                  >
                    Show More ({filteredHistory.length - visibleHistoryCount} remaining)
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => setVisibleHistoryCount(5)}
                  >
                    Show Less
                  </Button>
                )}
              </Box>
            )}
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
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </Provider>
      </Auth0Provider>
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}