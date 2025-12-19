'use client'

import React, { useState, useEffect } from 'react'
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Stack,
    Alert,
    Link as MuiLink,
    CircularProgress,
    InputAdornment,
    IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { registerUser, clearError } from '@/store/slices/userSlice'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [localError, setLocalError] = useState('')

    const dispatch = useAppDispatch()
    const router = useRouter()
    const { loading, error, isAuthenticated } = useAppSelector((state) => state.user)

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/')
        }
    }, [isAuthenticated, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError('')
        dispatch(clearError())

        // Validation
        if (!email || !password || !confirmPassword) {
            setLocalError('Please fill in all fields')
            return
        }

        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters')
            return
        }

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match')
            return
        }

        try {
            const result = await dispatch(registerUser({ email, password })).unwrap()
            // Registration successful
            router.push('/chat')
        } catch (err) {
            // Error is handled by Redux state
        }
    }

    const displayError = localError || error

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                    Sign up to get started with RAG Chat
                </Typography>

                {displayError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {displayError}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <TextField
                            label="Email"
                            type="email"
                            variant="outlined"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            helperText="Minimum 8 characters"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            onMouseDown={(e) => e.preventDefault()}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Confirm Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            variant="outlined"
                            fullWidth
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle confirm password visibility"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            onMouseDown={(e) => e.preventDefault()}
                                            edge="end"
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Create Account'}
                        </Button>
                    </Stack>
                </Box>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Already have an account?{' '}
                        <Link href="/login" passHref legacyBehavior>
                            <MuiLink>Sign in</MuiLink>
                        </Link>
                    </Typography>
                </Box>
            </Paper>
        </Container>
    )
}
