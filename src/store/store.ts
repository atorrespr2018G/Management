import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './slices/counterSlice'
import machineReducer from './slices/machineSlice'
import scannerReducer from './slices/scannerSlice'
import neoReducer from './slices/neoSlice'
import userReducer from './slices/userSlice'
import chatReducer from './slices/chatSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    machine: machineReducer,
    scanner: scannerReducer,
    neo: neoReducer,
    user: userReducer,
    chat: chatReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
