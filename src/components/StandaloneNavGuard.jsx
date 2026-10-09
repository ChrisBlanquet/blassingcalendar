import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const EXTERNAL = /^(https?:|tel:|mailto:|sms:|whatsapp:)/i

export function StandaloneNavGuard() {
  const navigate = useNavigate()

  useEffect(() => {
    function onClick(event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target.closest?.('a[href]')
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || EXTERNAL.test(href)) return

      let url
      try {
        url = new URL(href, window.location.origin)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return

      event.preventDefault()
      navigate(`${url.pathname}${url.search}${url.hash}`)
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [navigate])

  return null
}
