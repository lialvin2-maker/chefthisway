# ChefThisWay — App Store Connect text

Copy each block into the field with the same name. Character limits are checked.

---

## 1. Xcode first: Info.plist keys (target ▸ Info tab ▸ + row)

Without the camera key the app **crashes** when someone taps "Take Photo", and Apple rejects it.

| Key | Type | Value |
|---|---|---|
| Privacy - Camera Usage Description (`NSCameraUsageDescription`) | String | ChefThisWay uses the camera so you can take photos or videos of your food for a listing or your profile picture. |
| Privacy - Photo Library Usage Description (`NSPhotoLibraryUsageDescription`) | String | ChefThisWay lets you choose photos and videos of your food for a listing or your profile picture. |
| Privacy - Microphone Usage Description (`NSMicrophoneUsageDescription`) | String | ChefThisWay uses the microphone only when you record a video of your food for a listing. |
| Privacy - Location When In Use Usage Description (`NSLocationWhenInUseUsageDescription`) | String | ChefThisWay uses your location to show food near you and to fill in the pickup area of your listings. |
| App Uses Non-Exempt Encryption (`ITSAppUsesNonExemptEncryption`) | Boolean | NO |

The last key skips the export-compliance question on every upload (the app only uses standard HTTPS).

---

## 2. App Information

**Name** (30 max)
```
ChefThisWay: Homemade Food
```

**Subtitle** (30 max)
```
Homemade food from local cooks
```

**Primary category:** Food & Drink
**Secondary category:** Lifestyle

**Privacy Policy URL**
```
https://chefthisway.com/privacy
```

---

## 3. Version page (iOS App 1.0)

**Promotional text** (170 max)
```
Real home cooking near you. Find dumplings, curries, cakes and more made by cooks in the Toronto area, then message them to arrange pickup.
```

**Description** (4000 max)
```
ChefThisWay connects you with home cooks in the Toronto area. Browse homemade meals, baked goods, snacks and drinks made in local kitchens, message the cook, and arrange pickup.

FIND FOOD NEAR YOU
• Browse by food type: bakery, hot mains, snacks, desserts, drinks and more
• Filter by cuisine: Chinese, Korean, Japanese, Indian, Caribbean, Italian and others
• Filter by diet: vegetarian, vegan, halal, kosher, gluten-free, nut-free and more
• See how far away each listing is

TALK TO THE COOK
• Message cooks in the app to ask about ingredients, portions and pickup times
• Read reviews from other buyers before you decide

SELL WHAT YOU COOK
• Post a listing with photos, a price and your pickup area
• Edit or remove your listings any time
• Build your reputation with buyer reviews

SAFE AND RESPECTFUL
• Report any listing or user that breaks the community rules. We review reports within 24 hours.
• Block users so you no longer see their listings or messages
• Delete your account and its data yourself, any time

Payment and pickup are arranged between the buyer and the cook. ChefThisWay does not process payments or deliver food. Cooks are responsible for following local food-safety rules.

Sign in with Apple or with email.
```

**Keywords** (100 max, no spaces after commas)
```
home cooking,toronto,meals,bakery,dumplings,curry,halal,vegan,takeout,dinner,markham,gta,marketplace
```

**Support URL**
```
https://chefthisway.com/privacy#contact
```

**Marketing URL**
```
https://chefthisway.com
```

**Copyright**
```
2026 ChefThisWay
```

**Screenshots:** the 6.9-inch iPhone size is required (1320 × 2868). Easiest: run the app in Xcode's **iPhone 16 Pro Max** simulator and press **⌘S** on each screen. Good set of 5: Home, Categories, a listing, a chat, Create listing.

---

## 4. App Review Information

**Sign-in required:** Yes. Type the demo account's email and password yourself.

**Notes**
```
ChefThisWay is a marketplace for homemade food in the Toronto area. Buyers browse listings and message cooks; payment and pickup happen in person, outside the app. The app sells no digital goods and has no in-app purchases.

Sign in: tap Profile (bottom bar), then use the demo account above or Sign in with Apple.

User-generated content safeguards (Guideline 1.2):
- Community rules are linked on the sign-in screen and in the privacy policy (chefthisway.com/privacy#rules).
- Report a listing: open any listing, tap "Report this listing".
- Report or block a user: open their profile, tap the ••• button, then "Report user" or "Block user".
- We review reports within 24 hours and remove content and users that break the rules.

Account deletion (Guideline 5.1.1(v)): Profile, then the gear button (Settings), then "Delete account".

The app shows no ads and does no tracking.
```

---

## 5. App Privacy (the "nutrition label")

**Do you or your third-party partners collect data from this app?** Yes

Tick these data types, and nothing else:

| Category | Data type | Why it is collected |
|---|---|---|
| Contact Info | Name | Account and profile |
| Contact Info | Email Address | Sign in |
| Location | Precise Location | Pickup location saved with a listing |
| User Content | Photos or Videos | Listing photos and videos, profile picture |
| User Content | Emails or Text Messages | Chat between buyers and cooks |
| User Content | Other User Content | Listings, reviews, profile bio |
| Identifiers | User ID | Account ID |

For **every** data type above, answer the same three questions:
- **Purpose:** App Functionality (only)
- **Linked to the user's identity?** Yes
- **Used for tracking?** No

Leave unticked: Health & Fitness, Financial Info, Contacts, Browsing History, Search History, Usage Data, Diagnostics, Purchases, Sensitive Info, Device ID, Coarse Location, Other Data.

---

## 6. Age rating questionnaire

Answer honestly; Apple works out the rating. Expected answers:
- User-generated content: **Yes**
- Messaging and chat: **Yes**
- Advertising: **No** (the app shows no ads)
- Unrestricted web access: **No** (outside links open in Safari)
- Everything else (violence, sexual content, gambling, alcohol/drugs, horror, medical, contests): **None / No**

Expect a 13+ rating. That matches the privacy policy (not for children under 13).

---

## 7. Pricing and availability

- **Price:** Free
- **Countries:** Canada only to start, since all the cooks are in the Toronto area. Add more later.
