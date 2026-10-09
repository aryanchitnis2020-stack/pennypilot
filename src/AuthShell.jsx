import { useCallback, useEffect, useRef, useState } from 'react'
import App from './App'
import { api } from './lib/api'
import {
  DATA_CHANGED_EVENT, OWNER_KEY, backupLocalData, clearSnapshot,
  downloadLocalBackup, hasLocalData, hydrateSnapshot, readSnapshot, sameSnapshot,
} from './lib/cloudData'
import './AuthShell.css'

function AuthShell() {
  const [phase, setPhase] = useState('loading')
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [user, setUser] = useState(null)
  const [pending, setPending] = useState(null)
  const [syncStatus, setSyncStatus] = useState('Saved')
  const sync = useRef({ version: 0, base: null, dirty: false, inflight: null, timer: null, error: null })

  const flush = useCallback(async () => {
    const state = sync.current
    clearTimeout(state.timer)
    if (state.inflight) {
      await state.inflight
      if (state.error) return false
      if (state.dirty) return flush()
      return true
    }
    if (!state.dirty) return true

    state.dirty = false
    const snapshot = readSnapshot()
    setSyncStatus('Saving...')

    const save = (version) => api('/api/data', {
      method: 'PUT',
      body: JSON.stringify({ data: snapshot, version }),
    })

    const task = (async () => {
      let error
      try {
        let result
        try {
          result = await save(state.version)
        } catch (initialError) {
          if (initialError.status !== 409) throw initialError

          // Another session may have re-saved identical data. A stale version
          // is safe to rebase only when the actual cloud data did not change.
          const latest = await api('/api/data')
          if (sameSnapshot(latest.data, snapshot)) {
            state.version = latest.version
            state.base = snapshot
            state.error = null
            setSyncStatus('Saved')
            return true
          }
          if (!state.base || !sameSnapshot(latest.data, state.base)) {
            throw initialError // Real concurrent edits: preserve local data.
          }
          result = await save(latest.version)
        }

        state.version = result.version
        state.base = snapshot
        state.error = null
        setSyncStatus('Saved')
        return true
      } catch (err) {
        error = err
        state.dirty = true
        state.error = error
        setSyncStatus(error.status === 409 ? 'Sync conflict' : 'Save failed')
        return false
      }
    })().finally(() => { state.inflight = null })

    state.inflight = task
    const success = await task
    if (success && state.dirty) return flush()
    return success
  }, [])

  const enterAccount = useCallback(async (nextUser, isActive = () => true) => {
    const result = await api('/api/data')
    if (!isActive()) return

    sync.current.version = result.version
    sync.current.base = result.data
    sync.current.dirty = false
    sync.current.error = null
    setSyncStatus('Saved')
    const localOwner = localStorage.getItem(OWNER_KEY)
    const localData = readSnapshot()
    const oldData = hasLocalData(localData)

    if (result.data === null && oldData && (!localOwner || localOwner === nextUser.id)) {
      setPending({ user: nextUser, cloud: null })
      setPhase('import')
      return
    }

    if (result.data !== null && oldData &&
      !sameSnapshot(localData, result.data) &&
      (!localOwner || localOwner === nextUser.id)) {
      setPending({ user: nextUser, cloud: result.data })
      setPhase('choose')
      return
    }

    // Preserve a recoverable copy if this browser had different unsynced data.
    if (oldData && !sameSnapshot(localData, result.data)) {
      backupLocalData()
    }
    hydrateSnapshot(result.data)
    sync.current.base = readSnapshot()
    localStorage.setItem(OWNER_KEY, nextUser.id)
    setUser(nextUser)
    setPhase('ready')
  }, [])

  useEffect(() => {
    let active = true
    async function restoreSession() {
      try {
        const result = await api('/api/auth/me')
        if (active) await enterAccount(result.user, () => active)
      } catch (err) {
        if (active) {
          if (err.status !== 401) setError(err.message)
          setPhase('guest')
        }
      }
    }
    restoreSession()
    return () => { active = false }
  }, [enterAccount])

  useEffect(() => {
    if (phase !== 'ready') return undefined
    const onChanged = () => {
      sync.current.dirty = true
      setSyncStatus('Unsaved changes')
      clearTimeout(sync.current.timer)
      sync.current.timer = setTimeout(() => { void flush() }, 400)
    }
    const onHidden = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    window.addEventListener(DATA_CHANGED_EVENT, onChanged)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, onChanged)
      document.removeEventListener('visibilitychange', onHidden)
      clearTimeout(sync.current.timer)
    }
  }, [phase, flush])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'register') {
        await api('/api/auth/register', { method: 'POST', body: JSON.stringify(form) })
      }
      const result = await api('/api/auth/login', {
        method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }),
      })
      await enterAccount(result.user)
      setForm({ name: '', email: '', password: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const importLegacy = async (useExisting) => {
    setBusy(true)
    setError('')
    try {
      if (useExisting) {
        const snapshot = readSnapshot()
        const result = await api('/api/data', {
          method: 'PUT',
          body: JSON.stringify({ data: snapshot, version: sync.current.version }),
        })
        sync.current.version = result.version
        sync.current.base = snapshot
      } else {
        backupLocalData()
        hydrateSnapshot(pending.cloud)
        sync.current.base = readSnapshot()
      }
      localStorage.setItem(OWNER_KEY, pending.user.id)
      setUser(pending.user)
      setPending(null)
      setPhase('ready')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    setError('')
    setBusy(true)
    try {
      const saved = await flush()
      if (!saved) throw new Error('Could not save your latest changes. Retry sync or download a backup before signing out.')
      await api('/api/auth/logout', { method: 'POST' })
      clearSnapshot()
      setUser(null)
      setPhase('guest')
      setSyncStatus('Saved')
      sync.current.version = 0
      sync.current.base = null
    } catch (err) {
      setError(err.message)
      window.alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'ready') {
    return <App user={user} onLogout={logout} syncStatus={busy ? 'Signing out...' : syncStatus}
      onRetrySync={() => void flush()} onDownloadBackup={downloadLocalBackup} />
  }

  return (
    <div className="auth-shell">
      <div className="auth-showcase">
        <div className="auth-brand"><span className="auth-brand-icon">₹</span> PennyPilot</div>
        <div className="auth-showcase-content">
          <span className="auth-eyebrow">YOUR MONEY, YOUR MOMENTUM</span>
          <h1>Make every rupee <em>count.</em></h1>
          <p>Track spending, build your budget, plan savings goals and see your financial progress in one place.</p>
          <div className="auth-feature-grid">
            <span>↗ Income & expenses</span><span>◉ Smart insights</span>
            <span>◎ Savings goals</span><span>▦ Monthly budgets</span>
          </div>
        </div>
        <p className="auth-showcase-footer">Secure account access · Your data synced to your account</p>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          {phase === 'loading' ? (
            <><h2>Welcome back</h2><p>Checking your session...</p></>
          ) : phase === 'import' || phase === 'choose' ? (
            <>
              <span className="auth-tag">One-time setup</span>
              <h2>{phase === 'import' ? 'Keep your existing data?' : 'Choose your saved version'}</h2>
              <p>{phase === 'import' ? 'We found PennyPilot records in this browser. Import them to your account, or start fresh. A backup is kept if you start fresh.' : 'This browser has changes that differ from the cloud. Choose which version to keep. A local backup is saved if you choose the cloud.'}</p>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button className="auth-primary" disabled={busy} onClick={() => importLegacy(true)}>{phase === 'import' ? 'Import my existing data' : 'Use this browser’s version'}</button>
              <button className="auth-secondary" disabled={busy} onClick={() => importLegacy(false)}>{phase === 'import' ? 'Start fresh' : 'Keep cloud version'}</button>
            </>
          ) : (
            <>
              <span className="auth-tag">{mode === 'login' ? 'Welcome back' : 'Get started for free'}</span>
              <h2>{mode === 'login' ? 'Sign in to PennyPilot' : 'Create your account'}</h2>
              <p>{mode === 'login' ? 'Your financial dashboard is waiting.' : 'Start building healthier money habits today.'}</p>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <form onSubmit={submit} className="auth-form">
                {mode === 'register' && <label>Full name<input type="text" autoComplete="name" value={form.name} maxLength={100} required onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></label>}
                <label>Email address<input type="email" autoComplete="email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
                <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : undefined} value={form.password} required onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" /></label>
                <button className="auth-primary" type="submit" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
              </form>
              <p className="auth-switch">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create one' : 'Sign in'}</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthShell
