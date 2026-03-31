import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Coins, Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../api/axios'
import { useStore } from '../store/useStore'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useStore(s => s.setAuth)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Password tidak cocok.')
      return
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      })
      setAuth(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Registrasi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = () => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { level: 1, label: 'Lemah', color: 'bg-red-500' }
    if (p.length < 8) return { level: 2, label: 'Cukup', color: 'bg-gold-500' }
    if (p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return { level: 3, label: 'Kuat', color: 'bg-emerald-500' }
    return { level: 2, label: 'Sedang', color: 'bg-gold-500' }
  }

  const strength = passwordStrength()

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 70% 20%, rgba(245,158,11,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 30% 80%, rgba(50,89,255,0.06) 0%, transparent 50%)
        `
      }}
    >
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
            bg-gold-500/15 border border-gold-500/30 mb-4">
            <Coins className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold text-gradient-gold">Gold Asset Manager</h1>
          <p className="text-dark-400 text-sm mt-1">Buat akun baru</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10
              border border-red-500/30 text-red-400 text-sm mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  id="reg-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="input pl-10 pr-10"
                  placeholder="Min. 8 karakter"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {strength && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300
                        ${i <= strength.level ? strength.color : 'bg-dark-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-dark-500">Kekuatan: <span className="text-dark-300">{strength.label}</span></p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  id="reg-confirm"
                  name="confirm"
                  type="password"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  className="input pl-10 pr-10"
                  placeholder="Ulangi password"
                />
                {form.confirm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.password === form.confirm
                      ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                      : <AlertCircle className="w-4 h-4 text-red-400" />
                    }
                  </div>
                )}
              </div>
            </div>

            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full btn-lg mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mendaftar...
                </span>
              ) : 'Buat Akun'}
            </button>
          </form>

          <p className="text-center text-sm text-dark-400 mt-5">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
