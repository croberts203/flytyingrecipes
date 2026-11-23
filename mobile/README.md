# Fly Bench phone app (Expo)

The iPhone and Android app for Fly Bench. It shows app.flytyingrecipes.org and adds:

- the phone's own barcode scanner for materials
- the phone's GPS for the fish log and state fishing rules
- haptics, an offline screen, and opening outside links in the phone's browser

Changes to the website show up in the app right away, with no new app release.

Build in the cloud with EAS (no Mac needed). Profiles in `eas.json`:
- `preview`: Android APK to install directly, or an iPhone build for registered test devices
- `simulator`: iPhone simulator build
- `production`: App Store and Google Play builds
