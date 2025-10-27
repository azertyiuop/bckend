import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import './ActivityLogs.css'

function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 50

  useEffect(() => {
    loadLogs()
  }, [page])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await api.getActivityLogs(limit, page * limit)
      if (res.success) {
        setLogs(res.logs || [])
        setTotal(res.total || 0)
      }
    } catch (error) {
      console.error('Error loading activity logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'var(--accent-red)'
      case 'medium': return 'var(--accent-yellow)'
      case 'low': return 'var(--accent-green)'
      default: return 'var(--text-secondary)'
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="logs-page">
      <div className="page-header">
        <h1 className="page-title">Activity Logs</h1>
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page + 1} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      </div>

      <div className="logs-section">
        {loading ? (
          <div className="page-loading">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="empty-state">No activity logs found</div>
        ) : (
          <div className="logs-list">
            {logs.map((log) => (
              <div key={log.id} className="log-item">
                <div className="log-header">
                  <div className="log-action">
                    <span
                      className="severity-badge"
                      style={{ background: getSeverityColor(log.severity) }}
                    >
                      {log.severity}
                    </span>
                    <strong>{log.action_type}</strong>
                  </div>
                  <div className="log-time">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="log-details">
                  {log.username && <div><strong>User:</strong> {log.username}</div>}
                  {log.ip_address && <div><strong>IP:</strong> {log.ip_address}</div>}
                  {log.admin_username && <div><strong>Admin:</strong> {log.admin_username}</div>}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="log-extra">
                      <strong>Details:</strong>
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLogs
