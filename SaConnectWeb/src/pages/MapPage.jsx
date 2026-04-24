import { useEffect, useState } from 'react'
import axios from 'axios'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import {
  AlertTriangle,
  Building2,
  Check,
  Clock3,
  Copy,
  Flame,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  X,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'

const ADELAIDE_CENTER = [-34.9285, 138.6007]
const DEFAULT_ZOOM = 9
const FOCUSED_ZOOM = 12
const ACST_OFFSET_MINUTES = 9 * 60 + 30

function MapPage() {
  const location = useLocation()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [mapFocus, setMapFocus] = useState({ center: ADELAIDE_CENTER, zoom: DEFAULT_ZOOM })
  const [copySuccess, setCopySuccess] = useState(false)

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

  const markerIncidents = incidents.filter(
    (incident) =>
      typeof incident.latitude === 'number' &&
      !Number.isNaN(incident.latitude) &&
      typeof incident.longitude === 'number' &&
      !Number.isNaN(incident.longitude),
  )

  const statusText = selectedIncident?.status || 'Unknown'
  const statusTone = getStatusTone(statusText)
  const incidentDateString = [selectedIncident?.date, selectedIncident?.time].filter(Boolean).join(' ')
  const reportedAt = formatIncidentReportedAt(incidentDateString)
  const elapsedText = calculateElapsed(incidentDateString)
  const extraCards = getExtraDetailCards(selectedIncident)

  useEffect(() => {
    const incomingIncident = location.state?.selectedIncident
    if (!incomingIncident || !hasValidCoordinates(incomingIncident)) {
      return
    }

    setSelectedIncident(incomingIncident)
    setMapFocus({
      center: [incomingIncident.latitude, incomingIncident.longitude],
      zoom: FOCUSED_ZOOM,
    })
  }, [location.state])

  useEffect(() => {
    if (selectedIncident) {
      console.log('Selected incident object:', selectedIncident)
    }
  }, [selectedIncident])

  useEffect(() => {
    setCopySuccess(false)
  }, [selectedIncident])

  return (
    <main className="map-page">
      <section className={`map-layout${selectedIncident ? ' map-layout--with-sidebar' : ''}`}>
        <div className="map-panel">
          <MapContainer center={ADELAIDE_CENTER} zoom={DEFAULT_ZOOM} className="map-container">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportUpdater center={mapFocus.center} zoom={mapFocus.zoom} />

            {markerIncidents.map((incident) => (
              <Marker
                key={incident.id}
                position={[incident.latitude, incident.longitude]}
                eventHandlers={{ click: () => setSelectedIncident(incident) }}
              >
                <Popup>
                  <div>
                    <strong>{incident.type || 'Unknown type'}</strong>
                    <p className="popup-hint">Click for details</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {selectedIncident && (
          <aside className="incident-sidebar">
            <div className="sidebar-header">
              <h2>Incident Details</h2>
              <button
                type="button"
                className="close-sidebar-button"
                onClick={() => setSelectedIncident(null)}
                aria-label="Close incident details"
              >
                <X size={18} />
              </button>
            </div>
            {loading && <p className="sidebar-message">Loading incidents...</p>}
            {error && <p className="sidebar-message sidebar-error">{error}</p>}

            {!loading && !error && (
            <div className="incident-details">
              <div className="detail-row">
                <Flame size={20} />
                <div>
                  <p className="detail-label">Type</p>
                  <p className="detail-value">{selectedIncident.type || 'Unknown'}</p>
                </div>
              </div>
              <div className="detail-row">
                <MapPin size={20} />
                <div>
                  <p className="detail-label">Location</p>
                  <p className="detail-value">{selectedIncident.locationName || 'Unknown'}</p>
                </div>
              </div>
              <div className="detail-row">
                <Clock3 size={20} />
                <div>
                  <p className="detail-label">Reported At</p>
                  <p className="detail-value">{reportedAt}</p>
                </div>
              </div>
              <div className="detail-row detail-row-emphasis">
                <Clock3 size={20} />
                <div>
                  <p className="detail-label">Elapsed</p>
                  <p className="detail-value">{elapsedText}</p>
                </div>
              </div>
              <div className="detail-row">
                <AlertTriangle size={20} />
                <div>
                  <p className="detail-label">Status</p>
                  <p className="detail-value">{statusText}</p>
                  <span className={`status-chip status-chip--${statusTone}`}>{statusTone}</span>
                </div>
              </div>
              {extraCards.map((card) => (
                <div key={card.label} className="detail-row">
                  <card.Icon size={20} />
                  <div>
                    <p className="detail-label">{card.label}</p>
                    <p className="detail-value">{card.value}</p>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="copy-json-button"
                onClick={async () => {
                  if (!selectedIncident) {
                    return
                  }

                  const payload = JSON.stringify(selectedIncident, null, 2)
                  await navigator.clipboard.writeText(payload)
                  setCopySuccess(true)
                  window.setTimeout(() => setCopySuccess(false), 1600)
                }}
              >
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                {copySuccess ? 'Copied JSON' : 'Copy Incident JSON'}
              </button>
            </div>
            )}
          </aside>
        )}
      </section>
    </main>
  )
}

function MapViewportUpdater({ center, zoom }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [map, center, zoom])

  return null
}

function hasValidCoordinates(incident) {
  return (
    typeof incident?.latitude === 'number' &&
    !Number.isNaN(incident.latitude) &&
    typeof incident?.longitude === 'number' &&
    !Number.isNaN(incident.longitude)
  )
}

function getStatusTone(status) {
  const normalized = String(status).toLowerCase()

  if (
    normalized.includes('going') ||
    normalized.includes('danger') ||
    normalized.includes('emergency') ||
    normalized.includes('watch and act')
  ) {
    return 'high'
  }

  if (
    normalized.includes('contained') ||
    normalized.includes('monitor') ||
    normalized.includes('advice') ||
    normalized.includes('issued')
  ) {
    return 'medium'
  }

  if (
    normalized.includes('safe') ||
    normalized.includes('out') ||
    normalized.includes('resolved') ||
    normalized.includes('under control')
  ) {
    return 'low'
  }

  return 'unknown'
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

    // Convert ACST (UTC+09:30) wall-clock input to an absolute UTC timestamp.
    const utcMs =
      Date.UTC(year, month - 1, day, hours, minutes) - ACST_OFFSET_MINUTES * 60 * 1000
    const parsed = new Date(utcMs)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const fallback = new Date(value)
  return Number.isNaN(fallback.getTime()) ? null : fallback
}

function formatIncidentReportedAt(dateString) {
  const parsed = parseAustralianDate(dateString)
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

function calculateElapsed(dateString) {
  const parsed = parseAustralianDate(dateString)
  if (!parsed) {
    return 'Unknown start time'
  }

  const diffMs = Date.now() - parsed.getTime()
  if (diffMs < 60_000) {
    return 'Just now'
  }

  const mins = Math.floor(diffMs / 60_000)
  if (mins < 60) {
    return `${mins} min${mins === 1 ? '' : 's'} ago`
  }

  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function getExtraDetailCards(incident) {
  if (!incident) {
    return []
  }

  const cards = [
    { label: 'Agency', value: incident.agency, Icon: Building2 },
    { label: 'Vehicles', value: incident.vehicles, Icon: Truck },
    { label: 'Resources', value: incident.resources, Icon: Package },
    { label: 'Last Updated', value: incident.lastUpdated, Icon: RefreshCw },
  ]

  return cards.filter((card) => typeof card.value === 'string' && card.value.trim().length > 0)
}

export default MapPage
