import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const PIE_COLORS = ['#2563eb', '#0ea5e9', '#8b5cf6', '#f97316', '#14b8a6', '#ef4444']

function AnalyticsPage() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await axios.get('http://localhost:5258/api/incidents')
        setIncidents(response.data)
      } catch {
        setError('Could not load incidents from the API.')
      } finally {
        setLoading(false)
      }
    }

    fetchIncidents()
  }, [])

  const statusData = useMemo(() => groupByField(incidents, 'status', 'Unknown'), [incidents])
  const typeData = useMemo(() => groupByField(incidents, 'type', 'Unknown'), [incidents])

  return (
    <main className="analytics-page">
      <header className="analytics-header">
        <h1>Historical Analytics</h1>
      </header>

      {loading && <p className="list-message">Loading analytics...</p>}
      {error && <p className="list-message list-error">{error}</p>}

      {!loading && !error && (
        <section className="analytics-grid">
          <article className="analytics-card">
            <h2>Incidents by Status</h2>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis dataKey="name" angle={-15} textAnchor="end" interval={0} height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Incident Count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="analytics-card">
            <h2>Incident Type Breakdown</h2>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {typeData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>
      )}
    </main>
  )
}

function groupByField(items, fieldName, fallback) {
  const grouped = items.reduce((acc, item) => {
    const key = typeof item[fieldName] === 'string' && item[fieldName].trim() ? item[fieldName] : fallback
    acc.set(key, (acc.get(key) || 0) + 1)
    return acc
  }, new Map())

  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export default AnalyticsPage
