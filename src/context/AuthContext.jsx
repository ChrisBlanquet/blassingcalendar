import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'
import { requireAuthUid, SESSION_EXPIRED_MESSAGE } from '../lib/authGuard'
import { DEFAULT_WHATSAPP_TEMPLATE, sanitizeWhatsAppTemplate } from '../lib/whatsapp'

const AuthContext = createContext(null)

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

async function writeUserProfile(firebaseUser, extras = {}) {
  const profile = {
    businessName: extras.businessName || firebaseUser.displayName || 'Mi Estudio',
    whatsappTemplate: extras.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE,
    email: firebaseUser.email || '',
    createdAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'users', firebaseUser.uid), profile, { merge: true })
  return { ...profile, createdAt: new Date() }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      if (error?.code !== 'auth/popup-closed-by-user') {
        setAuthError(mapAuthError(error))
      }
    })

    let unsubProfile = () => {}

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubProfile()
      unsubProfile = () => {}
      setUser(firebaseUser)
      setLoading(false)

      if (!firebaseUser) {
        setProfile(null)
        return
      }

      const ref = doc(db, 'users', firebaseUser.uid)
      unsubProfile = onSnapshot(
        ref,
        async (snap) => {
          if (!snap.exists()) {
            try {
              await writeUserProfile(firebaseUser)
            } catch (error) {
              setAuthError(mapAuthError(error))
            }
            return
          }
          const data = snap.data()
          const cleanTemplate = sanitizeWhatsAppTemplate(data.whatsappTemplate)
          setProfile({ ...data, whatsappTemplate: cleanTemplate })
          if (data.whatsappTemplate && data.whatsappTemplate !== cleanTemplate) {
            updateDoc(ref, { whatsappTemplate: cleanTemplate }).catch(() => {})
          }
        },
        (error) => {
          setAuthError(mapAuthError(error))
        },
      )
    })

    return () => {
      unsubAuth()
      unsubProfile()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      authError,
      setAuthError,
      async login(email, password) {
        setAuthError('')
        await signInWithEmailAndPassword(auth, email, password)
      },
      async register({ email, password, businessName }) {
        setAuthError('')
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (businessName) {
          await updateProfile(cred.user, { displayName: businessName })
        }
        const data = await writeUserProfile(cred.user, { businessName })
        setProfile(data)
      },
      async loginWithGoogle() {
        setAuthError('')
        if (isIosDevice()) {
          await signInWithRedirect(auth, googleProvider)
          return
        }
        await signInWithPopup(auth, googleProvider)
      },
      async logout() {
        await signOut(auth)
      },
      async updateBusiness(partial) {
        const uid = requireAuthUid()
        if (!uid) throw new Error(SESSION_EXPIRED_MESSAGE)
        const next = { ...profile, ...partial }
        await updateDoc(doc(db, 'users', uid), partial)
        setProfile(next)
      },
    }),
    [user, profile, loading, authError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

export function mapAuthError(error) {
  const code = error?.code || ''
  const messages = {
    'auth/invalid-email': 'El correo no es válido.',
    'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ese correo ya está registrado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase.',
    'permission-denied': 'Revisa las reglas de Firestore para tu usuario.',
  }
  return messages[code] || error?.message || 'No se pudo completar la acción.'
}
