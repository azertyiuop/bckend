import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Moderation from './pages/Moderation'
import Analytics from './pages/Analytics'
import Streams from './pages/Streams'
import ActivityLogs from './pages/ActivityLogs'
import Layout from './components/Layout'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    setIsAuthenticated(!!token)
    setIsLoading(false)
  }, [])

  const handleLogin = (token) => {
    localStorage.setItem('admin_token', token)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="moderation" element={<Moderation />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="streams" element={<Streams />} />
          <Route path="logs" element={<ActivityLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
