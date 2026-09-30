import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  Settings,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Главная', icon: LayoutDashboard, end: true },
  { to: '/program', label: 'Программа', icon: BookOpen },
  { to: '/students', label: 'Ученики', icon: GraduationCap },
  { to: '/sessions', label: 'Журнал', icon: CalendarCheck },
  { to: '/settings', label: 'Настройки', icon: Settings },
]

function NavItems({ onNavigate }) {
  return NAV.map(({ to, label, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      onClick={onNavigate}
    >
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  ))
}

export default function Layout({ children }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span className="brand-name">Stepler Hub</span>
        </div>
        <nav className="nav">
          <NavItems />
        </nav>
        <p className="sidebar-foot">Панель репетитора</p>
      </aside>

      <div className="main">
        {/* <header className="topbar">
          <div className="brand brand-mobile">
            <span className="brand-mark">S</span>
            <span className="brand-name">Stepler Hub</span>
          </div>
        </header> */}
        <main className="content">{children}</main>
      </div>

      <nav className="tabbar">
        <NavItems />
      </nav>
    </div>
  )
}
