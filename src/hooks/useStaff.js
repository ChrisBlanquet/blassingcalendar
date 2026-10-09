import { useEffect, useMemo } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { OWNER_STAFF_ID, STAFF_COLORS, isOwnerStaff, ownerDisplayName } from '../lib/staff'
import { useCollection } from './useCollection'

export function useStaff() {
  const { user, profile } = useAuth()
  const { items, loading } = useCollection('staff', 'createdAt', 'asc')

  useEffect(() => {
    if (!user || loading) return undefined
    const hasOwner = items.some(isOwnerStaff)
    if (hasOwner) return undefined

    let cancelled = false
    async function ensureOwner() {
      const ref = doc(db, 'users', user.uid, 'staff', OWNER_STAFF_ID)
      const snap = await getDoc(ref)
      if (cancelled) return
      if (snap.exists()) {
        if (!snap.data()?.createdAt) {
          await setDoc(ref, { createdAt: serverTimestamp() }, { merge: true })
        }
        return
      }
      await setDoc(ref, {
        name: ownerDisplayName(profile),
        color: STAFF_COLORS[0],
        role: 'owner',
        createdAt: serverTimestamp(),
      })
    }
    ensureOwner().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user, profile, loading, items])

  const staff = useMemo(() => {
    return [...items].sort((a, b) => {
      if (isOwnerStaff(a)) return -1
      if (isOwnerStaff(b)) return 1
      return String(a.name || '').localeCompare(String(b.name || ''), 'es')
    })
  }, [items])

  return { staff, loading }
}
