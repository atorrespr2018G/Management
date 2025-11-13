import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MachineState } from '@/types/scanner';

const initialState: MachineState = {
  machineId: null,
  isLoading: false,
  error: null,
};

const machineSlice = createSlice({
  name: 'machine',
  initialState,
  reducers: {
    setMachineId: (state, action: PayloadAction<string>) => {
      state.machineId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setMachineId,
  setLoading,
  setError,
} = machineSlice.actions;

export default machineSlice.reducer;

