import useOffline from '../hooks/useOffline'

function OfflineBanner() {
  const isOffline = useOffline()

  if (!isOffline) return null

  return (
    <div className="bg-amber-50 text-amber-700 py-2.5 px-6 text-center text-sm font-medium border-b border-amber-100">
      ⚡ Offline mode — showing last saved data
    </div>
  )
}

export default OfflineBanner
