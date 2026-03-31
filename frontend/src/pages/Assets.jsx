import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Filter, X, AlertCircle } from 'lucide-react'
import api from '../api/axios'

const TYPES = ['EMAS', 'SAHAM', 'DEPOSITO', 'PROPERTI', 'LAINNYA']
const TYPE_LABELS = { EMAS: 'Emas', SAHAM: 'Saham', DEPOSITO: 'Deposito', PROPERTI: 'Properti', LAINNYA: 'Lainnya' }
const TYPE_COLORS = {
  EMAS:     'badge-warning',
  SAHAM:    'badge-info',
  DEPOSITO: 'badge-success',
  PROPERTI: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  LAINNYA:  'badge bg-dark-500/20 text-dark-400 border-dark-500/30',
}

function formatIDR(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function AssetModal({ asset, onClose, onSave }) {
  const [form, setForm] = useState({
    name: asset?.name || '',
    type: asset?.type || 'EMAS',
    quantity: asset?.quantity || '',
    purchasePrice: asset?.purchasePrice || '',
    currentPrice: asset?.currentPrice || '',
    purchaseDate: asset?.purchaseDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    notes: asset?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        quantity: parseFloat(form.quantity),
        purchasePrice: parseFloat(form.purchasePrice),
        currentPrice: form.currentPrice ? parseFloat(form.currentPrice) : null,
      }
      if (asset) {
        await api.put(`/assets/${asset.id}`, payload)
      } else {
        await api.post('/assets', payload)
      }
      onSave()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan aset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4" id="asset-modal-overlay">
      <div className="glass-card w-full max-w-lg p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-dark-100">{asset ? 'Edit Aset' : 'Tambah Aset'}</h2>
          <button onClick={onClose} id="modal-close" className="btn-ghost btn-sm p-1.5"><X className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Nama Aset</label>
              <input id="asset-name" className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="cth: Emas LM 10 gram" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Jenis Aset</label>
              <select id="asset-type" className="input" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Jumlah / Quantity</label>
              <input id="asset-quantity" type="number" step="any" min="0" className="input"
                value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Harga Beli (IDR)</label>
              <input id="asset-purchase-price" type="number" step="any" min="0" className="input"
                value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} required placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Harga Saat Ini (IDR)</label>
              <input id="asset-current-price" type="number" step="any" min="0" className="input"
                value={form.currentPrice} onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))} placeholder="Opsional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Tanggal Beli</label>
              <input id="asset-purchase-date" type="date" className="input"
                value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Catatan (Opsional)</label>
              <textarea id="asset-notes" className="input resize-none" rows={2}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} id="modal-cancel" className="btn-secondary flex-1">Batal</button>
            <button type="submit" id="modal-save" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Assets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | asset object
  const [deleteId, setDeleteId] = useState(null)

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/assets')
      setAssets(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAssets() }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/assets/${deleteId}`)
      setDeleteId(null)
      fetchAssets()
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || a.type === typeFilter
    return matchSearch && matchType
  })

  const totalValue = filtered.reduce((sum, a) => sum + (a.currentPrice || a.purchasePrice) * a.quantity, 0)

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-100">Aset Keuangan</h2>
          <p className="text-sm text-dark-500">{assets.length} aset terdaftar</p>
        </div>
        <button id="add-asset-btn" onClick={() => setModal('add')} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Tambah Aset
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input id="asset-search" className="input pl-10 py-2.5" placeholder="Cari nama aset..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <select id="asset-filter" className="input pl-10 py-2.5 pr-8 appearance-none min-w-36"
            value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Semua Jenis</option>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
      </div>

      {/* Summary row */}
      {filtered.length > 0 && (
        <div className="gold-card p-4 flex items-center justify-between">
          <span className="text-sm text-dark-300">Total Nilai ({filtered.length} aset)</span>
          <span className="text-lg font-bold text-gradient-gold">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalValue)}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <p className="text-4xl mb-3">💼</p>
            <p className="font-medium">{search || typeFilter ? 'Tidak ada hasil' : 'Belum ada aset'}</p>
            <p className="text-sm mt-1">
              {!search && !typeFilter && (
                <button onClick={() => setModal('add')} className="text-gold-400 hover:underline">+ Tambah aset pertama</button>
              )}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Aset</th>
                  <th>Jenis</th>
                  <th>Qty</th>
                  <th>Harga Beli</th>
                  <th>Harga Sekarang</th>
                  <th>Nilai Total</th>
                  <th>Gain/Loss</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const curPrice = a.currentPrice || a.purchasePrice
                  const totalVal = curPrice * a.quantity
                  const invested = a.purchasePrice * a.quantity
                  const gain = totalVal - invested
                  const gainPct = invested > 0 ? ((gain / invested) * 100).toFixed(1) : 0
                  return (
                    <tr key={a.id}>
                      <td>
                        <div>
                          <p className="font-medium text-dark-100">{a.name}</p>
                          {a.notes && <p className="text-xs text-dark-500 truncate max-w-40">{a.notes}</p>}
                        </div>
                      </td>
                      <td><span className={`badge ${TYPE_COLORS[a.type]}`}>{TYPE_LABELS[a.type]}</span></td>
                      <td>{a.quantity}</td>
                      <td className="font-mono text-xs">{formatIDR(a.purchasePrice)}</td>
                      <td className="font-mono text-xs">{a.currentPrice ? formatIDR(a.currentPrice) : <span className="text-dark-600">—</span>}</td>
                      <td className="font-medium text-dark-100">{formatIDR(totalVal)}</td>
                      <td>
                        <div className={gain >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          <p className="text-xs font-medium">{gain >= 0 ? '+' : ''}{formatIDR(gain)}</p>
                          <p className="text-xs opacity-70">{gainPct}%</p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button id={`edit-asset-${a.id}`} onClick={() => setModal(a)}
                            className="btn-ghost btn-sm p-1.5 text-dark-400 hover:text-gold-400">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button id={`delete-asset-${a.id}`} onClick={() => setDeleteId(a.id)}
                            className="btn-ghost btn-sm p-1.5 text-dark-400 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <AssetModal
          asset={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchAssets() }}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm p-6 animate-slide-up text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-bold text-dark-100 mb-1">Hapus Aset?</h3>
            <p className="text-sm text-dark-400 mb-5">Tindakan ini tidak bisa dibatalkan.</p>
            <div className="flex gap-3">
              <button id="cancel-delete" onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Batal</button>
              <button id="confirm-delete" onClick={handleDelete} className="btn-danger flex-1">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
