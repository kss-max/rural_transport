import { useEffect, useState } from 'react'

export function useNetwork() {
  const [status, setStatus] = useState({ online: true, effectiveType: '4g' })

  useEffect(() => {
    const update = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      setStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || 'unknown',
      })
    }

    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return status
}

export default useNetwork
