import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
            setIsLoading(false)
            return
        }

        try {
            const response = await api.get('/api/auth/me/')
            setUser(response.data)
        } catch (error) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email, password) => {
        const response = await api.post('/api/auth/login/', { email, password })
        const { access, refresh, user: userData } = response.data

        localStorage.setItem('accessToken', access)
        localStorage.setItem('refreshToken', refresh)
        setUser(userData)

        return userData
    }

    const logout = async () => {
        try {
            const refresh = localStorage.getItem('refreshToken')
            if (refresh) {
                await api.post('/api/auth/logout/', { refresh })
            }
        } catch (error) {
            // Ignore logout errors
        } finally {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
