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
} from '@mui/material';

import RedirectCard from './src/components/RedirectCard';
import AppHeader from './src/components/AppHeader';
import type { RedirectData } from './src/types';
import { saveRedirectToBackend } from './src/api'; // <--- IMPORT THE NEW API FUNCTION

const LOCAL_STORAGE_KEY = 'redirectHistory';
const DEFAULT_CUSTOM_URL_KEY = 'defaultCustomMonitorUrl';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  const [history, setHistory] = useState<RedirectData[]>([]);
  const [manualUrlInput, setManualUrlInput] = useState<string>('');
  
  const [defaultCustomUrl, setDefaultCustomUrl] = useState<string>(() => {
    return localStorage.getItem(DEFAULT_CUSTOM_URL_KEY) || '';
  });
  const [inputValueForDefaultUrl, setInputValueForDefaultUrl] = useState<string>(defaultCustomUrl);
  const [mainInspectedUrl, setMainInspectedUrl] = useState<string>('');

  const pageUrl = window.location.href;

  // Function to add an entry to history and save to backend
  const addHistoryEntry = async (entry: RedirectData) => {
    // Optimistically update UI
    const updatedHistory = [entry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));

    // Asynchronously save to the backend
    try {
      await saveRedirectToBackend(entry);
    } catch (error) {
      // The error is already logged in the api.ts file.
      // The data remains in localStorage as a fallback.
      // You could add a UI notification here if needed.
      alert('Failed to save redirect to the cloud, but it has been saved locally to your browser.');
    }
  };

  useEffect(() => {
    const storedHistoryString = localStorage.getItem(LOCAL_STORAGE_KEY);
    const loadedHistory: RedirectData[] = storedHistoryString ? JSON.parse(storedHistoryString) : [];

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
      if (history.length === 0 && loadedHistory.length > 0) {
          setHistory(loadedHistory);
      }
      return; 
    }
    
    const newRedirectEntry: RedirectData = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      fullUrl: parsedUrlForEntry.href,
      queryParams: Array.from(parsedUrlForEntry.searchParams.entries()).map(([key, value]) => ({ key, value })),
      fragment: parsedUrlForEntry.hash,
    };

    if (loadedHistory.length === 0 || 
        loadedHistory[0].fullUrl !== newRedirectEntry.fullUrl ||
        JSON.stringify(loadedHistory[0].queryParams) !== JSON.stringify(newRedirectEntry.queryParams) ||
        loadedHistory[0].fragment !== newRedirectEntry.fragment
    ) {
      // Use the new function to add the entry
      addHistoryEntry(newRedirectEntry);
    } else {
      setHistory(loadedHistory);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageUrl, defaultCustomUrl]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all redirect history? This action cannot be undone.')) {
      setHistory([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      // Note: This does not clear the history in DynamoDB. 
      // You would need a separate backend endpoint for that functionality.
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
    // Use the new function to add the entry
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
              <RedirectCard key={redirect.id} data={redirect} />
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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}