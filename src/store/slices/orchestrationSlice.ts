import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type RlmMode = 'standard' | 'disabled' | 'enabled'

interface OrchestrationState {
  rlmMode: RlmMode
  rlmEnabled: boolean
}

const initialState: OrchestrationState = {
  rlmMode: 'standard',
  rlmEnabled: false,
}

const orchestrationSlice = createSlice({
  name: 'orchestration',
  initialState,
  reducers: {
    setRlmMode: (state, action: PayloadAction<RlmMode>) => {
      state.rlmMode = action.payload
      state.rlmEnabled = action.payload === 'enabled'
    },
    setRlmEnabled: (state, action: PayloadAction<boolean>) => {
      state.rlmEnabled = action.payload
      state.rlmMode = action.payload ? 'enabled' : 'standard'
    },
    toggleRlmEnabled: (state) => {
      state.rlmEnabled = !state.rlmEnabled
      state.rlmMode = state.rlmEnabled ? 'enabled' : 'standard'
    },
  },
})

export const { setRlmMode, setRlmEnabled, toggleRlmEnabled } = orchestrationSlice.actions
export default orchestrationSlice.reducer
