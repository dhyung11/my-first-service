import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, fetchMe } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetchMe(token)
      .then(setUser)
      .catch(() => { localStorage.removeItem('token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await apiLogin(email, password)
    localStorage.setItem('token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
