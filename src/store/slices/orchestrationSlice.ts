import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type RlmMode = 'standard' | 'disabled' | 'enabled'
export type SequentialFlow = 'SEQUENTIAL' | 'HPE'

interface OrchestrationState {
  rlmMode: RlmMode
  rlmEnabled: boolean
  /** SEQUENTIAL = existing RAG workflow; HPE = Phase 1 Discover·Check·Reserve */
  sequentialFlow: SequentialFlow
}

const initialState: OrchestrationState = {
  rlmMode: 'standard',
  rlmEnabled: false,
  sequentialFlow: 'SEQUENTIAL',
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
    setSequentialFlow: (state, action: PayloadAction<SequentialFlow>) => {
      state.sequentialFlow = action.payload
    },
  },
})

export const { setRlmMode, setRlmEnabled, toggleRlmEnabled, setSequentialFlow } = orchestrationSlice.actions
export default orchestrationSlice.reducer
