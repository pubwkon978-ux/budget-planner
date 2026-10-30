# Budget Planner – APK setup (one time)

Repo එකේ index.html root එකේම තියෙනවා (www folder නෑ). Site එක GitHub Pages එකෙන් පරණ විදියටම වැඩ.
APK එක GitHub Actions වලින් auto build වෙලා Releases (tag `apk`) එකට යනවා. Site එකේ **Get app** button එක ඒ link එකට යනවා.

## 1. Firebase (Android app එක add කරන්න)
1. Firebase console → Project settings → **Add app → Android**
   - Package name: `com.dilum.budgetplanner`
   - SHA-1: `8D:C3:91:E5:80:A2:88:A5:85:9E:F6:A9:04:6B:43:3C:DC:1E:50:99`
2. SHA-1 add කරාට පස්සේ **google-services.json** download කරන්න (SHA-1 add කරාට පස්සේම download කරන්න ඕන).
3. ඒ file එක repo root එකට දාන්න (index.html ළඟ).
4. Authentication → Sign-in method → Google **enabled** (දැනටමත් enabled).

## 2. GitHub Secrets
Repo → Settings → Secrets and variables → Actions → New repository secret

| Name | Value |
|---|---|
| `KEYSTORE_BASE64` | `budget.jks.base64.txt` file එකේ මුළු content එක |
| `KEYSTORE_PASSWORD` | `SECRETS.txt` එකේ password එක |
| `KEY_ALIAS` | `budget` |

(`budget.jks` / secrets repo එකට commit කරන්න එපා.)

## 3. Build
Files ටික push කරන්න → Actions tab → **Build Android APK** (index.html change කරන හැම වෙලාවෙම auto run වෙනවා).
~6-10 min. ඉවර වුනාම APK link එක:
`https://github.com/<user>/<repo>/releases/download/apk/budget-planner.apk`

## Notes
- Site එක `<user>.github.io/<repo>/` නම් Get app link එක auto හැදෙනවා. වෙනත් domain එකක් නම් index.html එකේ `APK_URL` constant එකට link එක දාන්න.
- Phone එකේ install කරද්දී "Install unknown apps" allow කරන්න ඕන.
- Version එක හැම build එකෙන්ම වැඩි වෙනවා, ඒ නිසා පරණ app එක උඩින්ම update වෙනවා (ඒ සඳහා හැමවෙලේම එකම keystore එක පාවිච්චි වෙන්න ඕන).
- Offline: app එකේ දත්ත phone එකේ save වෙනවා, internet ආවම Firestore එකට auto sync. ලැයිස්තු (Manage lists / schedules / savings accounts) එක document එකක් නිසා, එකම වෙලාවේ phone එකෙයි වෙබ් එකෙයි වෙනස් කළොත් අන්තිමට sync වෙන එක win වෙනවා.
- App එකේ පළමු login එක internet එක්ක කරන්න ඕන.
