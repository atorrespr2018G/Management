import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ScannerState, ScanResult, ScanSource } from '@/types/scanner';

const initialState: ScannerState = {
  selectedSource: null,
  scanResults: null,
  isLoading: false,
  error: null,
  authStateId: null,
};

const scannerSlice = createSlice({
  name: 'scanner',
  initialState,
  reducers: {
    setSource: (state, action: PayloadAction<ScanSource>) => {
      state.selectedSource = action.payload;
    },
    setAuthState: (state, action: PayloadAction<string>) => {
      state.authStateId = action.payload;
    },
    setScanResults: (state, action: PayloadAction<ScanResult>) => {
      state.scanResults = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearResults: (state) => {
      state.scanResults = null;
      state.error = null;
    },
  },
});

export const {
  setSource,
  setAuthState,
  setScanResults,
  setLoading,
  setError,
  clearResults,
} = scannerSlice.actions;

export default scannerSlice.reducer;

