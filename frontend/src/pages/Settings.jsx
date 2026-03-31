import { useEffect, useState } from 'react'
import {
  Send, Settings as SettingsIcon, Bell, CheckCircle, AlertCircle,
  ExternalLink, Eye, EyeOff, Save, Loader2
} from 'lucide-react'
import api from '../api/axios'
import { useStore } from '../store/useStore'

export default function Settings() {
  const { user, updateUser } = useStore()
  const [form, setForm] = useState({
    telegramToken: user?.telegramToken || '',
    telegramChatId: user?.telegramChatId || '',
  })
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [testMsg, setTestMsg] = useState(null)

  const showFeedback = (setter, msg, type = 'success') => {
    setter({ msg, type })
    setTimeout(() => setter(null), 5000)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const { data } = await api.put('/telegram/setup', form)
      updateUser(data.user)
      showFeedback(setSaveMsg, 'Konfigurasi Telegram berhasil disimpan! ✅')
    } catch (err) {
      showFeedback(setSaveMsg, err.response?.data?.error || 'Gagal menyimpan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestMsg(null)
    try {
      const { data } = await api.post('/telegram/test')
      showFeedback(setTestMsg, `✅ ${data.message || 'Pesan test berhasil dikirim!'}`)
    } catch (err) {
      showFeedback(setTestMsg, `❌ ${err.response?.data?.error || 'Gagal mengirim pesan test'}`, 'error')
    } finally {
      setTesting(false)
    }
  }

  const isConfigured = user?.telegramToken && user?.telegramChatId

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-dark-100">Pengaturan</h2>
        <p className="text-sm text-dark-500">Konfigurasi notifikasi Telegram Anda</p>
      </div>

      {/* Status banner */}
      <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm
        ${isConfigured
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-gold-500/10 border-gold-500/30 text-gold-300'
        }`}>
        {isConfigured
          ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
          : <AlertCircle className="w-5 h-5 flex-shrink-0" />
        }
        {isConfigured
          ? 'Telegram Bot sudah terkonfigurasi dan aktif mengirim notifikasi.'
          : 'Telegram Bot belum dikonfigurasi. Ikuti panduan di bawah untuk mengaktifkan notifikasi.'
        }
      </div>

      {/* Setup Guide */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="w-4 h-4 text-gold-400" />
          <h3 className="font-semibold text-dark-200">Panduan Setup Telegram Bot</h3>
        </div>

        <div className="space-y-3">
          {[
            {
              step: '1',
              title: 'Buat Bot via BotFather',
              desc: 'Buka Telegram, cari @BotFather, ketik /newbot, ikuti instruksi. Dapatkan Bot Token berbentuk: 1234567890:ABC...',
              link: 'https://t.me/BotFather',
              linkLabel: 'Buka @BotFather'
            },
            {
              step: '2',
              title: 'Dapatkan Chat ID Anda',
              desc: 'Kirim pesan ke bot Anda, lalu buka URL berikut untuk mendapatkan Chat ID:',
              link: `https://api.telegram.org/bot${form.telegramToken || 'YOUR_TOKEN'}/getUpdates`,
              linkLabel: 'Cek getUpdates'
            },
            {
              step: '3',
              title: 'Masukkan Token & Chat ID di bawah',
              desc: 'Isi form di bawah lalu klik Simpan Konfigurasi, kemudian test dengan tombol Kirim Test.'
            },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-gold-500/20 border border-gold-500/30
                flex items-center justify-center text-gold-400 text-xs font-bold flex-shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-dark-200">{item.title}</p>
                <p className="text-xs text-dark-500 mt-0.5">{item.desc}</p>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors mt-1">
                    {item.linkLabel} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Config form */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-gold-400" />
          <h3 className="font-semibold text-dark-200">Konfigurasi Bot</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Bot Token
            </label>
            <div className="relative">
              <input
                id="telegram-token"
                type={showToken ? 'text' : 'password'}
                className="input pr-10 font-mono text-sm"
                value={form.telegramToken}
                onChange={e => setForm(f => ({ ...f, telegramToken: e.target.value }))}
                placeholder="1234567890:ABCDEFGHijklmnopQRSTuvwxyz"
              />
              <button type="button" onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-dark-500 mt-1">Didapat dari @BotFather saat membuat bot baru</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Chat ID
            </label>
            <input
              id="telegram-chat-id"
              type="text"
              className="input font-mono text-sm"
              value={form.telegramChatId}
              onChange={e => setForm(f => ({ ...f, telegramChatId: e.target.value }))}
              placeholder="-100xxxxxxxxxx atau 123456789"
            />
            <p className="text-xs text-dark-500 mt-1">ID chat tempat notifikasi akan dikirim (bisa personal atau grup)</p>
          </div>

          {saveMsg && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border
              ${saveMsg.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {saveMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {saveMsg.msg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button id="save-telegram" type="submit" disabled={saving} className="btn-primary flex-1 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
            <button id="test-telegram" type="button" onClick={handleTest}
              disabled={testing || !user?.telegramToken}
              className="btn-secondary gap-2 px-4">
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {testing ? '...' : 'Kirim Test'}
            </button>
          </div>
        </form>

        {testMsg && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border animate-fade-in
            ${testMsg.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
            {testMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {testMsg.msg}
          </div>
        )}
      </div>

      {/* Notification types info */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-dark-200 text-sm mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-gold-400" /> Jenis Notifikasi Otomatis
        </h3>
        <div className="space-y-2">
          {[
            { type: '🔔 Stok Tersedia', desc: 'Dikirim saat stok emas di butik yang Anda pantau tersedia (dicek setiap 15 menit)' },
            { type: '📊 Ringkasan Harian', desc: 'Ringkasan harga emas hari ini dikirim setiap pagi pukul 08:00' },
          ].map(item => (
            <div key={item.type} className="flex gap-3 p-3 rounded-xl bg-dark-800/40 border border-dark-700/30">
              <div>
                <p className="text-sm font-medium text-dark-200">{item.type}</p>
                <p className="text-xs text-dark-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
