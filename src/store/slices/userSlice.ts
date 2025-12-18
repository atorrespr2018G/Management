import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  created_at?: string
}

interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

// API Base URL - will be proxied through Next.js rewrites
const API_BASE = ''

// Async Thunks
export const registerUser = createAsyncThunk(
  'user/register',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.detail || 'Registration failed')
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

export const loginUser = createAsyncThunk(
  'user/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.detail || 'Login failed')
      }

      const data = await response.json()
      return data.user
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        return rejectWithValue('Logout failed')
      }

      return null
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

export const fetchCurrentUser = createAsyncThunk(
  'user/me',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          return rejectWithValue('Not authenticated')
        }
        return rejectWithValue('Failed to fetch user')
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error')
    }
  }
)

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
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false
      state.currentUser = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string
    })

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false
      state.currentUser = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string
    })

    // Logout
    builder.addCase(logoutUser.pending, (state) => {
      state.loading = true
    })
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.loading = false
      state.currentUser = null
      state.isAuthenticated = false
      state.error = null
    })
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string
    })

    // Fetch Current User
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true
    })
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.loading = false
      state.currentUser = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.loading = false
      state.currentUser = null
      state.isAuthenticated = false
    })
  },
})

export const { setUser, clearUser, clearError } = userSlice.actions
export default userSlice.reducer
