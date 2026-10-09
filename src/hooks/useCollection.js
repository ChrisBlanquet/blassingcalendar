import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'

export function useCollection(name, orderField = 'createdAt', direction = 'desc') {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setItems([])
      setLoading(false)
      return undefined
    }

    const q = query(collection(db, 'users', user.uid, name), orderBy(orderField, direction))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
        setLoading(false)
      },
      () => {
        setItems([])
        setLoading(false)
      },
    )

    return unsub
  }, [user, name, orderField, direction])

  return { items, loading }
}

export function userCol(uid, name) {
  return collection(db, 'users', uid, name)
}
