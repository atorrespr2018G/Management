import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './slices/counterSlice'
import userReducer from './slices/userSlice'
import scannerReducer from './slices/scannerSlice'
import machineReducer from './slices/machineSlice'
import neoReducer from './slices/neoSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    scanner: scannerReducer,
    machine: machineReducer,
    neo: neoReducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch



