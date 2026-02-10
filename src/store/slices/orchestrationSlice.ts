import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface OrchestrationState {
  rlmEnabled: boolean
}

const initialState: OrchestrationState = {
  rlmEnabled: false,
}

const orchestrationSlice = createSlice({
  name: 'orchestration',
  initialState,
  reducers: {
    setRlmEnabled: (state, action: PayloadAction<boolean>) => {
      state.rlmEnabled = action.payload
    },
    toggleRlmEnabled: (state) => {
      state.rlmEnabled = !state.rlmEnabled
    },
  },
})

export const { setRlmEnabled, toggleRlmEnabled } = orchestrationSlice.actions
export default orchestrationSlice.reducer
