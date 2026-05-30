import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RedirectData } from '../types';
import { getRedirectsFromBackend, saveRedirectToBackend, deleteRedirectFromBackend } from '../api';

const LOCAL_STORAGE_KEY = 'redirectHistory';
const DEFAULT_CUSTOM_URL_KEY = 'defaultCustomMonitorUrl';

export interface RedirectState {
  history: RedirectData[];
  isHistoryLoaded: boolean;
  defaultCustomUrl: string;
  mainInspectedUrl: string;
  searchQuery: string;
}

const initialState: RedirectState = {
  history: [],
  isHistoryLoaded: false,
  defaultCustomUrl: localStorage.getItem(DEFAULT_CUSTOM_URL_KEY) || '',
  mainInspectedUrl: '',
  searchQuery: '',
};

export const fetchHistory = createAsyncThunk(
  'redirects/fetchHistory',
  async (arg: { token?: string; q?: string } | undefined, { rejectWithValue }) => {
    const token = arg?.token;
    const q = arg?.q;
    try {
      if (token) {
        try {
          const cloudHistory = await getRedirectsFromBackend(token, q);
          return cloudHistory;
        } catch (error) {
          console.error('Failed to load cloud history, falling back to local.', error);
        }
      }
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localHistory = stored ? JSON.parse(stored) : [];
      if (q) {
        const query = q.toLowerCase();
        localHistory = localHistory.filter((entry: RedirectData) => {
          if (entry.fullUrl.toLowerCase().includes(query)) return true;
          if (entry.fragment && entry.fragment.toLowerCase().includes(query)) return true;
          return entry.queryParams.some(
            (param) =>
              param.key.toLowerCase().includes(query) ||
              param.value.toLowerCase().includes(query)
          );
        });
      }
      return localHistory;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch history');
    }
  }
);

export const saveAndAddEntry = createAsyncThunk(
  'redirects/saveAndAddEntry',
  async ({ entry, token }: { entry: RedirectData; token?: string }, { dispatch }) => {
    // Dispatch local sync add
    dispatch(addEntry(entry));

    try {
      await saveRedirectToBackend(entry, token);
    } catch (error) {
      console.error('Failed to save redirect to the cloud:', error);
    }
    return entry;
  }
);

export const deleteEntryThunk = createAsyncThunk(
  'redirects/deleteEntryThunk',
  async ({ id, token }: { id: string; token?: string }, { dispatch }) => {
    // Dispatch local sync delete
    dispatch(deleteEntry(id));

    if (token) {
      try {
        await deleteRedirectFromBackend(id, token);
      } catch (error) {
        console.error('Failed to delete redirect from the cloud database:', error);
        alert('Failed to delete this entry from the secure cloud database, but it has been removed locally.');
      }
    }
  }
);

const redirectSlice = createSlice({
  name: 'redirects',
  initialState,
  reducers: {
    addEntry: (state, action: PayloadAction<RedirectData>) => {
      state.history = [action.payload, ...state.history];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.history));
    },
    deleteEntry: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(entry => entry.id !== action.payload);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.history));
    },
    clearHistory: (state) => {
      state.history = [];
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    },
    setDefaultUrl: (state, action: PayloadAction<string>) => {
      const trimmedUrl = action.payload.trim();
      if (trimmedUrl === '') {
        localStorage.removeItem(DEFAULT_CUSTOM_URL_KEY);
        state.defaultCustomUrl = '';
      } else {
        localStorage.setItem(DEFAULT_CUSTOM_URL_KEY, trimmedUrl);
        state.defaultCustomUrl = trimmedUrl;
      }
    },
    setMainInspectedUrl: (state, action: PayloadAction<string>) => {
      state.mainInspectedUrl = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.fulfilled, (state, action: PayloadAction<RedirectData[]>) => {
        state.history = action.payload;
        state.isHistoryLoaded = true;
      })
      .addCase(fetchHistory.rejected, (state) => {
        state.isHistoryLoaded = true;
      });
  }
});

export const { 
  addEntry, 
  deleteEntry, 
  clearHistory, 
  setDefaultUrl, 
  setMainInspectedUrl,
  setSearchQuery 
} = redirectSlice.actions;
export default redirectSlice.reducer;
