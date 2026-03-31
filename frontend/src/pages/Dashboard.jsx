import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Wallet, Coins, Bell, ArrowRight, RefreshCw
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/axios'
import { useStore } from '../store/useStore'

const ASSET_COLORS = {
  EMAS:      '#f59e0b',
  SAHAM:     '#3b82f6',
  DEPOSITO:  '#10b981',
  PROPERTI:  '#8b5cf6',
  LAINNYA:   '#6b7280',
}

const ASSET_LABELS = {
  EMAS:      'Emas',
  SAHAM:     'Saham',
  DEPOSITO:  'Deposito',
  PROPERTI:  'Properti',
  LAINNYA:   'Lainnya',
}

function formatIDR(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function StatCard({ title, value, sub, icon: Icon, color = 'gold', trend }) {
  return (
    <div className="stat-card group cursor-default">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border
          ${color === 'gold' ? 'bg-gold-500/15 border-gold-500/30 text-gold-400' :
            color === 'emerald' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
            color === 'blue' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
            'bg-purple-500/15 border-purple-500/30 text-purple-400'
          }`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-dark-500 font-medium">{title}</p>
        <p className="text-xl font-bold text-dark-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-dark-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [assets, setAssets] = useState([])
  const [goldPrice, setGoldPrice] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, notifications } = useStore()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [assetsRes, goldRes] = await Promise.all([
        api.get('/assets'),
        api.get('/gold/price'),
      ])
      setAssets(assetsRes.data)
      setGoldPrice(goldRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Compute stats
  const totalAssets = assets.length
  const totalValue = assets.reduce((sum, a) => sum + (a.currentPrice || a.purchasePrice) * a.quantity, 0)
  const totalInvested = assets.reduce((sum, a) => sum + a.purchasePrice * a.quantity, 0)
  const roi = totalInvested ? ((totalValue - totalInvested) / totalInvested * 100).toFixed(1) : 0

  // Pie chart data by type
  const byType = assets.reduce((acc, a) => {
    const key = a.type
    acc[key] = (acc[key] || 0) + (a.currentPrice || a.purchasePrice) * a.quantity
    return acc
  }, {})
  const pieData = Object.entries(byType).map(([type, value]) => ({
    name: ASSET_LABELS[type] || type,
    value,
    color: ASSET_COLORS[type] || '#6b7280',
  }))

  const goldToday = goldPrice?.prices?.find(p => p.weightGram === 1)

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map(i => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-100">
            Selamat datang, <span className="text-gradient-gold">{user?.name}! 👋</span>
          </h2>
          <p className="text-sm text-dark-500 mt-0.5">Berikut ringkasan portofolio Anda hari ini</p>
        </div>
        <button onClick={fetchData} id="dashboard-refresh"
          className="btn-ghost btn-sm gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Portofolio"
          value={formatIDR(totalValue)}
          sub={`${totalAssets} aset terdaftar`}
          icon={Wallet}
          color="gold"
          trend={parseFloat(roi)}
        />
        <StatCard
          title="Modal Investasi"
          value={formatIDR(totalInvested)}
          sub="Total dana invested"
          icon={Coins}
          color="blue"
        />
        <StatCard
          title="Keuntungan / Rugi"
          value={formatIDR(totalValue - totalInvested)}
          sub={`ROI ${roi}%`}
          icon={totalValue >= totalInvested ? TrendingUp : TrendingDown}
          color={totalValue >= totalInvested ? 'emerald' : 'gold'}
          trend={parseFloat(roi)}
        />
        <StatCard
          title="Harga Emas (1g)"
          value={goldToday ? formatIDR(goldToday.sellPrice) : '—'}
          sub={goldToday ? `Buyback: ${formatIDR(goldToday.buyPrice)}` : 'Memuat...'}
          icon={Coins}
          color="gold"
        />
      </div>

      {/* Charts + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="glass-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark-200">Komposisi Aset</h3>
            <Link to="/assets" id="view-assets-link"
              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {pieData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={v => formatIDR(v)}
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-sm text-dark-300">{item.name}</span>
                    </div>
                    <span className="text-sm text-dark-200 font-medium">
                      {totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-dark-500 text-sm">
              <Wallet className="w-10 h-10 mb-2 opacity-30" />
              <p>Belum ada aset</p>
              <Link to="/assets" className="text-gold-400 text-xs mt-1 hover:underline">+ Tambah aset</Link>
            </div>
          )}
        </div>

        {/* Gold prices */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-dark-200">Harga Emas Antam Hari Ini</h3>
            <Link to="/gold" id="view-gold-link"
              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors">
              Lihat detail <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {goldPrice?.prices ? (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Berat</th>
                    <th>Harga Jual</th>
                    <th>Buyback</th>
                    <th>Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {goldPrice.prices.map(p => (
                    <tr key={p.weightGram}>
                      <td className="font-medium text-dark-100">{p.weightGram} gram</td>
                      <td className="text-gold-400 font-medium">{formatIDR(p.sellPrice)}</td>
                      <td className="text-emerald-400">{formatIDR(p.buyPrice)}</td>
                      <td className="text-dark-500 text-xs">{formatIDR(p.sellPrice - p.buyPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-dark-500 text-sm">
              <p>Gagal memuat harga emas. <button onClick={fetchData} className="text-gold-400 hover:underline">Coba lagi</button></p>
            </div>
          )}
        </div>
      </div>

      {/* Recent notifications */}
      {notifications.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-gold-400" />
            <h3 className="font-semibold text-dark-200">Notifikasi Terbaru</h3>
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-dark-800/40 border border-dark-700/30">
                <div className="w-2 h-2 rounded-full bg-gold-500 mt-1.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-sm text-dark-200">{n.message}</p>
                  <p className="text-xs text-dark-500 mt-0.5">
                    {new Date(n.id).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
