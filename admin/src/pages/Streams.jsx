import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import './Streams.css'

function Streams() {
  const [streamStats, setStreamStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const res = await api.getStreamStats()
      if (res.success) {
        setStreamStats(res)
      }
    } catch (error) {
      console.error('Error loading stream stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="page-loading">Loading stream data...</div>
  }

  return (
    <div className="streams-page">
      <h1 className="page-title">Streams</h1>

      <div className="stats-summary">
        <div className="summary-card">
          <div className="summary-label">Total Streams</div>
          <div className="summary-value">{streamStats?.total || 0}</div>
        </div>
        <div className="summary-card active">
          <div className="summary-label">Active Now</div>
          <div className="summary-value">{streamStats?.active || 0}</div>
        </div>
      </div>

      <div className="streams-section">
        <h2>Stream History</h2>
        {streamStats?.history && streamStats.history.length > 0 ? (
          <div className="streams-table">
            <table>
              <thead>
                <tr>
                  <th>Stream Key</th>
                  <th>Title</th>
                  <th>Started At</th>
                  <th>Ended At</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {streamStats.history.map((stream, idx) => (
                  <tr key={idx}>
                    <td className="stream-key">{stream.stream_key}</td>
                    <td>{stream.title || 'Untitled Stream'}</td>
                    <td>{new Date(stream.started_at).toLocaleString()}</td>
                    <td>{stream.ended_at ? new Date(stream.ended_at).toLocaleString() : 'Live'}</td>
                    <td>
                      {stream.duration_minutes
                        ? `${Math.floor(stream.duration_minutes)} min`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No stream history</div>
        )}
      </div>
    </div>
  )
}

export default Streams
