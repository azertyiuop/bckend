import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Analytics.css'

function Analytics() {
  const [messageStats, setMessageStats] = useState(null)
  const [userActivity, setUserActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7days')

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      const [messagesRes, activityRes] = await Promise.all([
        api.getMessageStats(period),
        api.getUserActivityStats()
      ])

      if (messagesRes.success) setMessageStats(messagesRes)
      if (activityRes.success) setUserActivity(activityRes)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="page-loading">Loading analytics...</div>
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="period-select">
          <option value="24hours">Last 24 Hours</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>
      </div>

      <div className="analytics-section">
        <h2>Messages Over Time</h2>
        {messageStats?.byDay && messageStats.byDay.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messageStats.byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f3336" />
              <XAxis dataKey="date" stroke="#8b98a5" />
              <YAxis stroke="#8b98a5" />
              <Tooltip
                contentStyle={{
                  background: '#192734',
                  border: '1px solid #2f3336',
                  borderRadius: '6px',
                  color: '#ffffff'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#1d9bf0" name="Messages" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">No message data available</div>
        )}
      </div>

      <div className="analytics-section">
        <h2>Top Active Users</h2>
        {messageStats?.byUser && messageStats.byUser.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={messageStats.byUser}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2f3336" />
              <XAxis dataKey="username" stroke="#8b98a5" />
              <YAxis stroke="#8b98a5" />
              <Tooltip
                contentStyle={{
                  background: '#192734',
                  border: '1px solid #2f3336',
                  borderRadius: '6px',
                  color: '#ffffff'
                }}
              />
              <Legend />
              <Bar dataKey="count" fill="#00ba7c" name="Messages" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">No user activity data available</div>
        )}
      </div>

      <div className="analytics-section">
        <h2>Users by Page</h2>
        {userActivity?.byPage && userActivity.byPage.length > 0 ? (
          <div className="page-stats">
            {userActivity.byPage.map((page, idx) => (
              <div key={idx} className="page-stat-item">
                <div className="page-name">{page.page || 'Unknown'}</div>
                <div className="page-count">{page.count} users</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No page data available</div>
        )}
      </div>
    </div>
  )
}

export default Analytics
