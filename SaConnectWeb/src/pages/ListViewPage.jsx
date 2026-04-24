import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AlertTriangle, CalendarDays, Flame, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
const ACST_OFFSET_MINUTES = 9 * 60 + 30

function ListViewPage() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('Newest')

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

  const availableTypes = useMemo(() => {
    const types = incidents
      .map((incident) => incident.type)
      .filter((type) => typeof type === 'string' && type.trim().length > 0)

    return ['All', ...Array.from(new Set(types)).sort((a, b) => a.localeCompare(b))]
  }, [incidents])

  const availableStatuses = useMemo(() => {
    const statuses = incidents
      .map((incident) => incident.status)
      .filter((status) => typeof status === 'string' && status.trim().length > 0)

    return ['All', ...Array.from(new Set(statuses)).sort((a, b) => a.localeCompare(b))]
  }, [incidents])

  const visibleIncidents = useMemo(() => {
    const filtered = incidents.filter((incident) => {
      const matchesType = filterType === 'All' || incident.type === filterType
      const matchesStatus = statusFilter === 'All' || incident.status === statusFilter
      return matchesType && matchesStatus
    })

    const sorted = [...filtered].sort((a, b) => {
      const aDate = toDateValue(a.date, a.time)
      const bDate = toDateValue(b.date, b.time)

      if (sortOrder === 'Newest') {
        return bDate - aDate
      }

      return aDate - bDate
    })

    return sorted
  }, [incidents, filterType, statusFilter, sortOrder])

  return (
    <main className="list-page">
      <header className="list-header">
        <h1>Incident List</h1>
        <div className="list-controls">
          <div className="filter-group">
            <label htmlFor="event-type">Event Type</label>
            <select
              id="event-type"
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
            >
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="sort-button"
            onClick={() => setSortOrder((current) => (current === 'Newest' ? 'Oldest' : 'Newest'))}
          >
            Sort: {sortOrder}
          </button>
        </div>
      </header>

      {loading && <p className="list-message">Loading incidents...</p>}
      {error && <p className="list-message list-error">{error}</p>}

      {!loading && !error && (
        <section className="incident-grid">
          {visibleIncidents.map((incident) => (
            <article key={incident.id} className="incident-card">
              <div className="incident-card-row">
                <CalendarDays size={18} />
                <div>
                  <p className="card-label">Date</p>
                  <p className="card-value">{formatIncidentDateTime(incident.date, incident.time)}</p>
                </div>
              </div>
              <div className="incident-card-row">
                <Flame size={18} />
                <div>
                  <p className="card-label">Type</p>
                  <p className="card-value">{incident.type || 'Unknown'}</p>
                </div>
              </div>
              <div className="incident-card-row">
                <AlertTriangle size={18} />
                <div>
                  <p className="card-label">Status</p>
                  <p className="card-value" style={{ color: getStatusColor(incident.status) }}>
                    {incident.status || 'Unknown'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="map-link-button"
                onClick={() => navigate('/', { state: { selectedIncident: incident } })}
              >
                <MapPin size={16} />
                View on Map
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

function toDateValue(rawDate, rawTime) {
  const combined = [rawDate, rawTime].filter(Boolean).join(' ')
  const parsed = parseAustralianDate(combined)
  return parsed ? parsed.getTime() : 0
}

function formatIncidentDateTime(rawDate, rawTime) {
  const combined = [rawDate, rawTime].filter(Boolean).join(' ')
  const parsed = parseAustralianDate(combined)
  if (!parsed) {
    return 'Unknown'
  }

  return parsed.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function parseAustralianDate(dateString) {
  if (!dateString) {
    return null
  }

  const value = String(dateString).trim()
  if (!value) {
    return null
  }

  const [datePart, timePart] = value.split(' ')
  const dateTokens = datePart.split('/')

  if (dateTokens.length === 3) {
    const day = Number.parseInt(dateTokens[0], 10)
    const month = Number.parseInt(dateTokens[1], 10)
    const year = Number.parseInt(dateTokens[2], 10)

    let hours = 0
    let minutes = 0
    if (timePart) {
      const [h, m] = timePart.split(':')
      hours = Number.parseInt(h, 10) || 0
      minutes = Number.parseInt(m, 10) || 0
    }

    if ([day, month, year].some(Number.isNaN)) {
      return null
    }

    const utcMs =
      Date.UTC(year, month - 1, day, hours, minutes) - ACST_OFFSET_MINUTES * 60 * 1000
    const parsed = new Date(utcMs)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const fallback = new Date(value)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

function getStatusColor(status) {
  const value = String(status || '').toUpperCase()

  if (value.includes('GOING') || value.includes('WARNING') || value.includes('DANGER')) {
    return '#c2410c'
  }

  if (value.includes('COMPLETE') || value.includes('SAFE') || value.includes('RESOLVED')) {
    return '#15803d'
  }

  if (value.includes('CONTROL') || value.includes('CONTAINED') || value.includes('MONITOR')) {
    return '#b45309'
  }

  return '#0f172a'
}

export default ListViewPage
