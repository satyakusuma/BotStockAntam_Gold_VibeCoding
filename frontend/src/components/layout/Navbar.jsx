import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Bell, RefreshCw } from 'lucide-react'
import { useStore } from '../../store/useStore'

const PAGE_TITLES = {
  '/':         'Dashboard',
  '/assets':   'Aset Keuangan',
  '/gold':     'Harga Emas Antam',
  '/stock':    'Stok Butik Antam',
  '/settings': 'Pengaturan',
}

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout, user, notifications } = useStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const title = PAGE_TITLES[pathname] || 'Gold Asset Manager'
  const unread = notifications.filter(n => !n.read).length

  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-md border-b border-dark-700/50
      flex items-center justify-between px-6 gap-4 flex-shrink-0 z-20">
      {/* Title */}
      <div>
        <h1 className="text-base font-semibold text-dark-100">{title}</h1>
        <p className="text-xs text-dark-500">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          id="notification-bell"
          className="relative p-2 rounded-xl text-dark-400 hover:text-dark-200 hover:bg-dark-700/50 transition-all"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold-500 animate-pulse-gold" />
          )}
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-800/60 border border-dark-700/50">
          <div className="w-6 h-6 rounded-full bg-gold-500/20 flex items-center justify-center border border-gold-500/30">
            <span className="text-gold-400 text-xs font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <span className="text-sm text-dark-300 font-medium hidden sm:block">{user?.name}</span>
        </div>

        {/* Logout */}
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="p-2 rounded-xl text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
