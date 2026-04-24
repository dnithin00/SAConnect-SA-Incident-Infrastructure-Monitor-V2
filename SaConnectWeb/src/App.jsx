import { BrowserRouter, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import AnalyticsPage from './pages/AnalyticsPage'
import ListViewPage from './pages/ListViewPage'
import MapPage from './pages/MapPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <NavBar />
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/list" element={<ListViewPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
