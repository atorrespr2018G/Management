import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  name: string
  email: string
}

interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload
      state.isAuthenticated = true
    },
    clearUser: (state) => {
      state.currentUser = null
      state.isAuthenticated = false
    },
    // Initialize a simulated user ID for chat sessions
    initSimulatedUser: (state) => {
      if (typeof window !== 'undefined') {
        let userId = localStorage.getItem('simulated_user_id');
        if (!userId) {
          userId = crypto.randomUUID();
          localStorage.setItem('simulated_user_id', userId);
        }
        // We can store this in a separate field if needed, but for now let's just ensure it exists
        // or we could add a 'simulatedUserId' field to the state if we want to track it in Redux
      }
    }
  },
})

export const { setUser, clearUser, initSimulatedUser } = userSlice.actions
export default userSlice.reducer



