import { useEffect, useRef } from 'react'

// TODO: After AdSense approves your account, create a Display ad unit at:
// https://adsense.google.com → Ads → By ad unit → Display ads
// Then paste the slot ID below.
const AD_SLOT = 'YOUR_AD_SLOT_ID'

export default function AdSlot() {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      // AdSense script not ready yet
    }
  }, [])

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
