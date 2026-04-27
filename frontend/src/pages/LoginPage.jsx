import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../icons'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) navigate('/') }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
          <span style={{ color: 'var(--accent)' }}><Icon.Logo size={22} /></span>
          <span style={{ fontFamily: 'var(--font-en)', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>SecJobs</span>
        </div>

        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: '32px 28px',
        }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px', letterSpacing: '-0.02em' }}>로그인</h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="이메일">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com" required
                style={inputStyle}
              />
            </Field>
            <Field label="비밀번호">
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={inputStyle}
              />
            </Field>

            {error && (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--urgent)' }}>{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 4, padding: '11px 0',
                background: loading ? 'var(--text-3)' : 'var(--accent)',
                color: '#fff', fontWeight: 600, fontSize: 14,
                borderRadius: 'var(--r-md)', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-3)' }}>
          계정이 없으신가요?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  padding: '10px 12px', fontSize: 14,
  border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
  background: 'var(--bg)', color: 'var(--text)',
  outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: 'var(--font-kr)',
}
