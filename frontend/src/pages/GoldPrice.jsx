import { useEffect, useState } from 'react'
import { RefreshCw, Clock, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import api from '../api/axios'

function formatIDR(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

const WEIGHT_OPTIONS = [1, 2, 5, 10, 25, 50, 100]

export default function GoldPrice() {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedWeight, setSelectedWeight] = useState(10)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [histLoading, setHistLoading] = useState(false)

  const fetchPrice = async () => {
    setLoading(true)
    try {
      const { data: res } = await api.get('/gold/price')
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistLoading(true)
    try {
      const { data: res } = await api.get(`/gold/history?days=${days}`)
      setHistory(res)
    } catch (err) {
      console.error(err)
    } finally {
      setHistLoading(false)
    }
  }

  useEffect(() => { fetchPrice() }, [])
  useEffect(() => { fetchHistory() }, [days])

  // Filter history for selected weight
  const chartData = history
    .filter(h => h.weightGram === selectedWeight)
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .map(h => ({
      date: new Date(h.recordedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      'Harga Jual': h.sellPrice,
      'Buyback':    h.buyPrice,
    }))

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-100">Harga Emas Antam</h2>
          <div className="flex items-center gap-1.5 text-xs text-dark-500 mt-0.5">
            <Clock className="w-3 h-3" />
            {data?.lastUpdated
              ? `Diperbarui: ${new Date(data.lastUpdated).toLocaleString('id-ID')}`
              : 'Memuat...'}
            {data?.source === 'fallback' && <span className="badge-warning text-xs ml-1">Data simulasi</span>}
          </div>
        </div>
        <button id="refresh-gold" onClick={fetchPrice} disabled={loading}
          className="btn-ghost btn-sm gap-2">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Price Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-700/40 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gold-400" />
          <h3 className="font-semibold text-dark-200 text-sm">Daftar Harga Hari Ini</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(7)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Berat (gram)</th>
                  <th>Harga Jual (Beli oleh Anda)</th>
                  <th>Buyback (Jual ke Antam)</th>
                  <th>Spread</th>
                  <th>Spread %</th>
                </tr>
              </thead>
              <tbody>
                {data?.prices?.map(p => (
                  <tr key={p.weightGram}>
                    <td>
                      <span className="font-semibold text-dark-100">{p.weightGram}g</span>
                    </td>
                    <td>
                      <span className="text-gold-400 font-semibold">{formatIDR(p.sellPrice)}</span>
                    </td>
                    <td>
                      <span className="text-emerald-400">{formatIDR(p.buyPrice)}</span>
                    </td>
                    <td className="text-dark-400">{formatIDR(p.sellPrice - p.buyPrice)}</td>
                    <td className="text-dark-400 text-xs">
                      {((p.sellPrice - p.buyPrice) / p.sellPrice * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Chart */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="font-semibold text-dark-200">Grafik Harga Historis</h3>
          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs text-dark-500 mr-2">Berat:</label>
              <select id="chart-weight" className="input py-1.5 px-3 text-sm w-24 inline-block"
                value={selectedWeight}
                onChange={e => setSelectedWeight(Number(e.target.value))}>
                {WEIGHT_OPTIONS.map(w => <option key={w} value={w}>{w}g</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-500 mr-2">Periode:</label>
              <select id="chart-days" className="input py-1.5 px-3 text-sm w-24 inline-block"
                value={days}
                onChange={e => setDays(Number(e.target.value))}>
                <option value={7}>7 hari</option>
                <option value={14}>14 hari</option>
                <option value={30}>30 hari</option>
                <option value={90}>90 hari</option>
              </select>
            </div>
          </div>
        </div>

        {histLoading ? (
          <div className="skeleton h-64 rounded-xl" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                tickFormatter={v => `${(v/1000000).toFixed(1)}jt`}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip
                formatter={(v, name) => [formatIDR(v), name]}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              <Line type="monotone" dataKey="Harga Jual" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Buyback" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-dark-500 text-sm">
            <p>Belum ada data historis untuk berat ini</p>
          </div>
        )}
      </div>
    </div>
  )
}
