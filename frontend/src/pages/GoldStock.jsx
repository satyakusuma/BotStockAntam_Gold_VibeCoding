import { useEffect, useState } from 'react'
import { Search, Plus, Trash2, Bell, BellOff, Store, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../api/axios'

const WEIGHT_OPTIONS = [1, 2, 5, 10, 25, 50, 100]

export default function GoldStock() {
  const [boutiques, setBoutiques] = useState([])
  const [monitors, setMonitors] = useState([])
  const [search, setSearch] = useState('')
  const [selectedBoutique, setSelectedBoutique] = useState('')
  const [selectedWeight, setSelectedWeight] = useState(10)
  const [stockResult, setStockResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [addingMonitor, setAddingMonitor] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [boutiqueRes, monitorRes] = await Promise.all([
        api.get('/gold/boutiques'),
        api.get('/telegram/monitors'),
      ])
      setBoutiques(boutiqueRes.data)
      setMonitors(monitorRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = boutiques.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase())
  )

  const checkStock = async () => {
    if (!selectedBoutique) return
    setChecking(true)
    setStockResult(null)
    try {
      const { data } = await api.get(`/gold/stock?boutique=${selectedBoutique}&weight=${selectedWeight}`)
      setStockResult(data)
    } catch (err) {
      setStockResult({ error: 'Gagal mengecek stok' })
    } finally {
      setChecking(false)
    }
  }

  const addMonitor = async () => {
    if (!selectedBoutique || !selectedWeight) return
    const b = boutiques.find(b => b.id === selectedBoutique)
    setAddingMonitor(true)
    try {
      await api.post('/telegram/monitors', {
        boutiqueId: selectedBoutique,
        boutiqueName: b?.name || selectedBoutique,
        weightGram: selectedWeight,
      })
      await fetchData()
      showToast(`Pemantauan ${b?.name} (${selectedWeight}g) ditambahkan`)
    } catch (err) {
      showToast(err.response?.data?.error || 'Gagal menambahkan monitor', 'error')
    } finally {
      setAddingMonitor(false)
    }
  }

  const removeMonitor = async (id) => {
    try {
      await api.delete(`/telegram/monitors/${id}`)
      await fetchData()
      showToast('Pemantauan dihapus')
    } catch (err) {
      showToast('Gagal menghapus', 'error')
    }
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 glass-card px-4 py-3 flex items-center gap-2 text-sm animate-slide-up
          ${toast.type === 'error' ? 'border-red-500/30 text-red-400' : 'border-emerald-500/30 text-emerald-400'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-dark-100">Stok Butik Antam</h2>
        <p className="text-sm text-dark-500">Cek ketersediaan stok dan atur notifikasi Telegram otomatis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Stock checker */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search butik */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-semibold text-dark-200 text-sm flex items-center gap-2">
              <Store className="w-4 h-4 text-gold-400" /> Pilih Butik & Cek Stok
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input id="boutique-search" className="input pl-10 py-2.5" placeholder="Cari butik..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-dark-500 mb-1.5">Butik</label>
                <select id="boutique-select" className="input py-2.5"
                  value={selectedBoutique}
                  onChange={e => setSelectedBoutique(e.target.value)}>
                  <option value="">-- Pilih Butik --</option>
                  {filtered.map(b => (
                    <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-dark-500 mb-1.5">Berat Emas</label>
                <select id="weight-select" className="input py-2.5"
                  value={selectedWeight}
                  onChange={e => setSelectedWeight(Number(e.target.value))}>
                  {WEIGHT_OPTIONS.map(w => <option key={w} value={w}>{w} gram</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button id="check-stock-btn"
                onClick={checkStock}
                disabled={!selectedBoutique || checking}
                className="btn-primary btn-sm flex-1">
                {checking ? 'Mengecek...' : '🔍 Cek Stok Sekarang'}
              </button>
              <button id="add-monitor-btn"
                onClick={addMonitor}
                disabled={!selectedBoutique || addingMonitor}
                className="btn-secondary btn-sm gap-2">
                <Bell className="w-3.5 h-3.5" />
                {addingMonitor ? '...' : 'Pantau'}
              </button>
            </div>

            {/* Stock result */}
            {stockResult && (
              <div className={`p-4 rounded-xl border text-sm animate-fade-in
                ${stockResult.error
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : stockResult.isSimulated
                    ? 'bg-gold-500/10 border-gold-500/30'
                    : stockResult.inStock === true
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-dark-700/50 border-dark-600/50'
                }`}>
                {stockResult.error ? (
                  <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {stockResult.error}</div>
                ) : stockResult.isSimulated ? (
                  /* Data simulasi / tidak dapat dikonfirmasi */
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-gold-400" />
                      <span className="font-semibold text-gold-300">Status Tidak Dapat Dikonfirmasi</span>
                    </div>
                    <p className="text-dark-300 mb-2">
                      Stok per butik di logammulia.com dimuat melalui JavaScript yang tidak dapat
                      di-scrape secara otomatis. Data yang ditampilkan <strong className="text-gold-300">bukan data real</strong>.
                    </p>
                    <div className="bg-dark-800/50 rounded-lg p-3 mt-2">
                      <p className="text-xs text-dark-400">ℹ️ {stockResult.message}</p>
                    </div>
                    <p className="text-xs text-dark-500 mt-2">
                      Cek langsung di:{' '}
                      <a href="https://logammulia.com/purchase/gold" target="_blank" rel="noopener noreferrer"
                        className="text-gold-400 hover:underline">logammulia.com/purchase/gold ↗</a>
                    </p>
                    <p className="text-xs text-dark-500 mt-0.5">
                      Dicek: {new Date(stockResult.checkedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                ) : (
                  /* Data real dari scraping */
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {stockResult.inStock === true
                        ? <><CheckCircle className="w-5 h-5 text-emerald-400" /><span className="font-semibold text-emerald-400">STOK TERSEDIA! 🎉</span></>
                        : <><BellOff className="w-5 h-5 text-dark-400" /><span className="font-semibold text-dark-300">Stok Kosong</span></>
                      }
                    </div>
                    <p className="text-dark-300">Butik: <span className="text-dark-100">{stockResult.boutiqueName}</span></p>
                    <p className="text-dark-300">Berat: <span className="text-dark-100">{stockResult.weightGram} gram</span></p>
                    {stockResult.quantity != null && (
                      <p className="text-dark-300">Stok: <span className="text-dark-100">{stockResult.quantity} pcs</span></p>
                    )}
                    <p className="text-xs text-dark-500 mt-1">
                      ✅ Data dikonfirmasi dari logammulia.com
                    </p>
                    <p className="text-xs text-dark-500">
                      Dicek: {new Date(stockResult.checkedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Boutique list */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-dark-700/40">
              <h3 className="font-semibold text-dark-200 text-sm">Daftar Butik ({filtered.length})</h3>
            </div>
            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            ) : (
              <div className="divide-y divide-dark-700/30 max-h-64 overflow-y-auto">
                {filtered.map(b => (
                  <div key={b.id}
                    onClick={() => setSelectedBoutique(b.id)}
                    id={`boutique-${b.id}`}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-dark-700/30 transition-colors
                      ${selectedBoutique === b.id ? 'bg-gold-500/5 border-l-2 border-gold-500' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-dark-200">{b.name}</p>
                      <p className="text-xs text-dark-500">{b.city} • {b.id}</p>
                    </div>
                    {monitors.some(m => m.boutiqueId === b.id) && (
                      <Bell className="w-3.5 h-3.5 text-gold-400" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Active monitors */}
        <div className="glass-card p-4 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-gold-400" />
            <h3 className="font-semibold text-dark-200 text-sm">Pemantauan Aktif</h3>
            <span className="badge-warning ml-auto">{monitors.filter(m => m.isActive).length}</span>
          </div>
          {monitors.length === 0 ? (
            <div className="text-center py-8 text-dark-500 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Belum ada pemantauan</p>
              <p className="text-xs mt-1">Pilih butik & klik "Pantau"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {monitors.map(m => (
                <div key={m.id} className={`flex items-start justify-between p-3 rounded-xl border
                  ${m.isActive ? 'bg-dark-700/40 border-dark-600/50' : 'border-dark-700/30 opacity-50'}`}>
                  <div>
                    <p className="text-sm text-dark-200 font-medium">{m.boutiqueName}</p>
                    <p className="text-xs text-dark-500">{m.weightGram}g • {m.isActive ? <span className="text-emerald-400">Aktif</span> : 'Nonaktif'}</p>
                  </div>
                  <button id={`remove-monitor-${m.id}`} onClick={() => removeMonitor(m.id)}
                    className="btn-ghost btn-sm p-1 text-dark-500 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
