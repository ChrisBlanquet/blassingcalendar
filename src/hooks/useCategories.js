import { useEffect, useMemo } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_CATEGORIES, normalizeCategory } from '../lib/categories'
import { useCollection } from './useCollection'

export function useCategories() {
  const { user } = useAuth()
  const { items, loading } = useCollection('categories', 'order', 'asc')

  useEffect(() => {
    if (!user || loading || items.length > 0) return undefined

    let cancelled = false
    async function seed() {
      await Promise.all(
        DEFAULT_CATEGORIES.map((category) =>
          setDoc(doc(db, 'users', user.uid, 'categories', category.id), {
            name: category.name,
            short: category.short,
            emoji: category.emoji,
            order: category.order,
            createdAt: serverTimestamp(),
          }),
        ),
      )
      if (cancelled) return
    }

    seed().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user, loading, items.length])

  const categories = useMemo(
    () =>
      [...items]
        .map(normalizeCategory)
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es')),
    [items],
  )

  return { categories, loading }
}
