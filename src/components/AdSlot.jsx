import { useEffect, useRef } from 'react'
import { isNativeApp } from '../lib/nativeApp'

// TODO: After AdSense approves your account, create a Display ad unit at:
// https://adsense.google.com → Ads → By ad unit → Display ads
// Then paste the slot ID below.
const AD_SLOT = 'YOUR_AD_SLOT_ID'

// No box until a real slot ID is set (an empty "Advertisement" gap otherwise),
// and never in the iOS app: AdSense is not allowed there (that needs AdMob).
const SHOW_ADS = !AD_SLOT.startsWith('YOUR_') && !isNativeApp

export default function AdSlot() {
  const pushed = useRef(false)

  useEffect(() => {
    if (!SHOW_ADS || pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense script not ready yet
    }
  }, [])

  if (!SHOW_ADS) return null

  return (
    <div className="ad-slot w-full py-1">
      <p className="text-center text-[9px] text-slate-300 uppercase tracking-widest mb-1 select-none">
        Advertisement
      </p>
      <ins
        className="adsbygoogle ad-unit"
        data-ad-client="ca-pub-7875388851226483"
        data-ad-slot={AD_SLOT}
      />
    </div>
  )
}
