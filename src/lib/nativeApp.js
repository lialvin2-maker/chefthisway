// True inside the ChefThisWay iOS app: its web view adds "ChefThisWayApp" to the user agent
// (see ios/ChefWebView.swift).
export const isNativeApp =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('ChefThisWayApp')

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('')
}

// Runs the native Sign in with Apple sheet through the app's "appleSignIn" message handler.
// Resolves { idToken, nonce, fullName }: nonce is the raw value Supabase checks against the token.
export async function nativeAppleSignIn() {
  const handler = window.webkit?.messageHandlers?.appleSignIn
  if (!handler) throw new Error('Sign in with Apple is only available in the ChefThisWay app.')

  const nonce = crypto.randomUUID()
  const hashedNonce = await sha256Hex(nonce)

  const result = await new Promise((resolve, reject) => {
    // The app calls this back with { idToken, fullName } or { error }
    window.__appleSignInResult = r => {
      delete window.__appleSignInResult
      r?.error ? reject(new Error(r.error)) : resolve(r)
    }
    handler.postMessage({ nonce: hashedNonce })
  })
  return { idToken: result.idToken, nonce, fullName: result.fullName || '' }
}
