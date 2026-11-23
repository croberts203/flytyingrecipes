import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, BackHandler, Linking, Modal, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const APP_URL = 'https://app.flytyingrecipes.org/';
const APP_HOST = 'app.flytyingrecipes.org';
const VERSION = Constants.expoConfig?.version ?? '1.0.0';
const NAVY = '#182241', CREAM = '#fff5d9', SLATE = '#536c7c', PAPER = '#f7f3e8';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Runs in the web page before it loads. It gives the web app a small "FBNative"
// bridge, and routes GPS and vibration through the phone's own features.
const BRIDGE = `
(function(){
  if (window.FBNative) return;
  var seq = 0, pending = {};
  function call(type, args){
    return new Promise(function(ok, fail){
      var id = 'c' + (++seq); pending[id] = { ok: ok, fail: fail };
      window.ReactNativeWebView.postMessage(JSON.stringify({ id: id, type: type, args: args || {} }));
    });
  }
  window.__fbNativeReply = function(id, good, data){
    var p = pending[id]; if (!p) return; delete pending[id];
    good ? p.ok(data) : p.fail(new Error(data || 'Cancelled'));
  };
  window.FBNative = {
    platform: ${JSON.stringify(Platform.OS)},
    version: ${JSON.stringify(VERSION)},
    scan: function(opts){ return call('scan', opts); },
    locate: function(){ return call('locate'); },
    haptic: function(kind){ window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'haptic', args: { kind: kind } })); }
  };
  var geo = navigator.geolocation;
  if (geo) {
    var toPos = function(p){ return { coords: { latitude: p.lat, longitude: p.lng, accuracy: p.acc, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, timestamp: Date.now() }; };
    geo.getCurrentPosition = function(ok, err){
      call('locate').then(function(p){ ok(toPos(p)); }, function(e){ err && err({ code: 1, PERMISSION_DENIED: 1, message: e.message }); });
    };
    geo.watchPosition = function(ok, err){ geo.getCurrentPosition(ok, err); return 1; };
    geo.clearWatch = function(){};
  }
  navigator.vibrate = function(){ window.FBNative.haptic('light'); return true; };
  var mark = function(){ document.documentElement && document.documentElement.classList.add('in-app', 'in-app-' + ${JSON.stringify(Platform.OS)}); };
  document.documentElement ? mark() : document.addEventListener('DOMContentLoaded', mark);
})();
true;
`;

function Scanner({ visible, onCode, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const done = useRef(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) { done.current = false; if (permission && !permission.granted && permission.canAskAgain) requestPermission(); }
    else setTorch(false);
  }, [visible, permission?.granted]);

  const handle = ({ data }) => {
    if (done.current || !data) return;
    done.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onCode(String(data));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.scanWrap}>
        <StatusBar style="light" />
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
            onBarcodeScanned={visible ? handle : undefined}
          />
        ) : (
          <View style={styles.noCam}>
            <Text style={styles.noCamTitle}>Camera access is off</Text>
            <Text style={styles.noCamText}>Fly Bench needs the camera to read barcodes. You can turn it on in Settings.</Text>
            <Pressable style={styles.pill} onPress={() => (permission?.canAskAgain ? requestPermission() : Linking.openSettings())}>
              <Text style={styles.pillText}>{permission?.canAskAgain ? 'Allow camera' : 'Open Settings'}</Text>
            </Pressable>
          </View>
        )}
        <View pointerEvents="none" style={styles.frame} />
        <Text style={[styles.hint, { top: insets.top + 24 }]}>Line up the barcode inside the box</Text>
        <View style={[styles.scanBar, { paddingBottom: insets.bottom + 18 }]}>
          <Pressable style={[styles.pill, styles.pillGhost]} onPress={() => setTorch(t => !t)}>
            <Text style={[styles.pillText, { color: '#fff' }]}>{torch ? 'Light off' : 'Light on'}</Text>
          </Pressable>
          <Pressable style={styles.pill} onPress={onClose}>
            <Text style={styles.pillText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Main() {
  const web = useRef(null);
  const insets = useSafeAreaInsets();
  const [scanId, setScanId] = useState(null);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  const reply = useCallback((id, ok, data) => {
    web.current?.injectJavaScript(`window.__fbNativeReply(${JSON.stringify(id)}, ${ok ? 'true' : 'false'}, ${JSON.stringify(data ?? null)}); true;`);
  }, []);

  const onMessage = useCallback(async (e) => {
    let msg; try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg.type === 'haptic') { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); return; }
    if (msg.type === 'scan') { setScanId(msg.id); return; }
    if (msg.type === 'locate') {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') return reply(msg.id, false, 'Location permission was not given');
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        reply(msg.id, true, { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy ?? 0 });
      } catch (err) { reply(msg.id, false, String(err?.message || err)); }
    }
  }, [reply]);

  // Links to other sites (shops, YouTube, state agencies) open in the phone's browser.
  const onShouldStart = useCallback((req) => {
    const url = req.url || '';
    if (req.isTopFrame === false) return true;
    if (/^(about:|data:|blob:)/.test(url)) return true;
    let host = ''; try { host = new URL(url).host; } catch { return false; }
    if (host === APP_HOST) return true;
    if (/^(https?:|mailto:|tel:|sms:|maps:)/.test(url)) Linking.openURL(url).catch(() => {});
    return false;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (scanId) { reply(scanId, false, 'Cancelled'); setScanId(null); return true; }
      if (canGoBack) { web.current?.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack, scanId, reply]);

  useEffect(() => { const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 6000); return () => clearTimeout(t); }, []);

  return (
    <View style={[styles.root, Platform.OS === 'android' && { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light" backgroundColor={NAVY} />
      {failed ? (
        <View style={styles.offline}>
          <Text style={styles.offTitle}>Can't reach Fly Bench</Text>
          <Text style={styles.offText}>Check that you have a signal or Wi-Fi, then try again.</Text>
          <Pressable style={styles.pill} onPress={() => { setFailed(false); web.current?.reload(); }}>
            <Text style={styles.pillText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
      <WebView
        ref={web}
        style={[styles.web, failed && { display: 'none' }]}
        source={{ uri: APP_URL }}
        originWhitelist={['https://*', 'http://*', 'about:*', 'data:*', 'blob:*']}
        injectedJavaScriptBeforeContentLoaded={BRIDGE}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStart}
        onOpenWindow={(e) => { const u = e.nativeEvent.targetUrl; if (u) Linking.openURL(u).catch(() => {}); }}
        onNavigationStateChange={(s) => setCanGoBack(s.canGoBack)}
        onLoadEnd={() => SplashScreen.hideAsync().catch(() => {})}
        onError={() => setFailed(true)}
        onContentProcessDidTerminate={() => web.current?.reload()}
        renderLoading={() => <View style={styles.loading}><ActivityIndicator color={SLATE} size="large" /></View>}
        startInLoadingState
        applicationNameForUserAgent={`FlyBenchApp/${VERSION}`}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaCapturePermissionGrantType="grant"
        geolocationEnabled
        sharedCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        bounces={false}
        decelerationRate="normal"
        textZoom={100}
      />
      <Scanner
        visible={!!scanId}
        onCode={(code) => { reply(scanId, true, code); setScanId(null); }}
        onClose={() => { reply(scanId, false, 'Cancelled'); setScanId(null); }}
      />
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><Main /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  web: { flex: 1, backgroundColor: PAPER },
  loading: { ...StyleSheet.absoluteFillObject, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center' },
  offline: { flex: 1, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center', padding: 32 },
  offTitle: { fontSize: 22, fontWeight: '800', color: NAVY, marginBottom: 8 },
  offText: { fontSize: 16, color: SLATE, textAlign: 'center', marginBottom: 20 },
  pill: { backgroundColor: CREAM, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 22 },
  pillGhost: { backgroundColor: 'rgba(255,255,255,0.18)' },
  pillText: { color: SLATE, fontWeight: '700', fontSize: 16 },
  scanWrap: { flex: 1, backgroundColor: '#000' },
  frame: { position: 'absolute', left: '10%', right: '10%', top: '36%', height: '20%', borderWidth: 3, borderColor: CREAM, borderRadius: 14 },
  hint: { position: 'absolute', left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 17, fontWeight: '700', textShadowColor: 'rgba(0,0,0,.6)', textShadowRadius: 6 },
  scanBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 18, backgroundColor: 'rgba(0,0,0,.45)' },
  noCam: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  noCamTitle: { color: '#fff', fontSize: 21, fontWeight: '800', marginBottom: 8 },
  noCamText: { color: '#ddd', fontSize: 16, textAlign: 'center', marginBottom: 20 },
});
