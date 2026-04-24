import { NavLink } from 'react-router-dom'

function NavBar() {
  return (
    <nav className="app-nav">
      <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        Live Map
      </NavLink>
      <NavLink to="/list" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        Incident List
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        Analytics
      </NavLink>
    </nav>
  )
}

export default NavBar
