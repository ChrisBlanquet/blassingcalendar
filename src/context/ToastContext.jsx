import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'

const ToastContext = createContext({
  showToast: () => {},
})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((message, duration = 3000) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ id: Date.now(), message })
    timerRef.current = setTimeout(() => {
      setToast(null)
      timerRef.current = null
    }, duration)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4"
              style={{ bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
            >
              <div className="fade-in pointer-events-auto flex max-w-sm items-center gap-2 rounded-full border border-white/10 bg-ink/90 px-4 py-2.5 text-[13px] font-medium tracking-tight text-white shadow-[0_10px_28px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-sage text-white shadow-sm">
                  <Check size={10} strokeWidth={3} />
                </span>
                <span className="whitespace-nowrap">{toast.message}</span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
