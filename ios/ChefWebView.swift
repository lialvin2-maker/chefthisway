// ChefThisWay iOS app: the web view plus native Sign in with Apple.
//
// Copy this file into the Xcode project (Sources/) and show it from ContentView:
//
//     var body: some View { ChefWebView().ignoresSafeArea() }
//
// Xcode setup:
//   - Target ▸ Signing & Capabilities ▸ + Capability ▸ "Sign in with Apple"
//     (needs the paid Apple Developer account as the signing team).
//   - Target ▸ General ▸ Supported Destinations: iPhone only (remove iPad and Mac),
//     so Apple does not review the layout on an iPad.
//
// How sign-in works: the site (src/lib/nativeApp.js) sees "ChefThisWayApp" in the user agent,
// shows the Apple button, and posts { nonce } to the "appleSignIn" handler. This file runs the
// Apple sheet and calls window.__appleSignInResult({ idToken, fullName }) or ({ error }).
// The site then signs in to Supabase with that ID token.

import SwiftUI
import WebKit
import AuthenticationServices

let appURL = URL(string: "https://chefthisway.com")!

struct ChefWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.applicationNameForUserAgent = "ChefThisWayApp"
        config.userContentController.add(context.coordinator, name: "appleSignIn")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.allowsBackForwardNavigationGestures = true
        webView.navigationDelegate = context.coordinator
        context.coordinator.webView = webView
        webView.load(URLRequest(url: appURL))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate,
                             ASAuthorizationControllerDelegate,
                             ASAuthorizationControllerPresentationContextProviding {
        weak var webView: WKWebView?

        // MARK: Sign in with Apple

        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "appleSignIn",
                  let body = message.body as? [String: Any],
                  let hashedNonce = body["nonce"] as? String else { return }

            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = hashedNonce   // already SHA-256 hashed by the site

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }

        func authorizationController(controller: ASAuthorizationController,
                                     didCompleteWithAuthorization authorization: ASAuthorization) {
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let idToken = String(data: tokenData, encoding: .utf8) else {
                send(["error": "Apple did not return a sign-in token."])
                return
            }
            let name = [credential.fullName?.givenName, credential.fullName?.familyName]
                .compactMap { $0 }.joined(separator: " ")
            send(["idToken": idToken, "fullName": name])
        }

        func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
            let canceled = (error as? ASAuthorizationError)?.code == .canceled
            send(["error": canceled ? "Sign in canceled." : error.localizedDescription])
        }

        func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
            webView?.window ?? ASPresentationAnchor()
        }

        private func send(_ result: [String: String]) {
            guard let data = try? JSONSerialization.data(withJSONObject: result),
                  let json = String(data: data, encoding: .utf8) else { return }
            webView?.evaluateJavaScript("window.__appleSignInResult && window.__appleSignInResult(\(json))")
        }

        // MARK: Links

        // Keep chefthisway.com inside the app; open every other site (and mailto/tel) outside it.
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { return decisionHandler(.allow) }
            let inApp = url.host?.hasSuffix("chefthisway.com") == true
                || url.host?.hasSuffix("supabase.co") == true
                || url.scheme == "about" || url.scheme == "blob" || url.scheme == "data"
            if inApp || action.targetFrame?.isMainFrame == false {
                decisionHandler(.allow)
            } else {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
            }
        }
    }
}
