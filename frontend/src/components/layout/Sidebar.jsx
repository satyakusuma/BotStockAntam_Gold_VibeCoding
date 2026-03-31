import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, TrendingUp, Store, Settings,
  ChevronLeft, ChevronRight, Coins
} from 'lucide-react'
import { useStore } from '../../store/useStore'

const NAV_ITEMS = [
  { to: '/',        label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/assets',  label: 'Aset Saya',      icon: Wallet },
  { to: '/gold',    label: 'Harga Emas',     icon: TrendingUp },
  { to: '/stock',   label: 'Stok Butik',     icon: Store },
  { to: '/settings',label: 'Pengaturan',     icon: Settings },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, user } = useStore()

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300
        bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50
        ${sidebarOpen ? 'w-64' : 'w-16'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-700/50">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gold-500/20 flex items-center justify-center border border-gold-500/30">
          <Coins className="w-4 h-4 text-gold-400" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gradient-gold whitespace-nowrap">Gold Asset</p>
            <p className="text-xs text-dark-500 whitespace-nowrap">Manager</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${!sidebarOpen ? 'justify-center' : ''}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      {sidebarOpen && user && (
        <div className="p-3 border-t border-dark-700/50">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-dark-800/50">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center border border-gold-500/30 flex-shrink-0">
              <span className="text-gold-400 text-sm font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-dark-200 truncate">{user.name}</p>
              <p className="text-xs text-dark-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        id="sidebar-toggle"
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
          bg-dark-700 border border-dark-600 hover:bg-dark-600 transition-colors
          flex items-center justify-center text-dark-400 hover:text-dark-200 z-10"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
    </aside>
  )
}
