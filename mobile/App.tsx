import { SafeAreaView, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <WebView
        source={require("./assets/quran.html")}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        setSupportMultipleWindows={false}
        startInLoadingState
        style={styles.webview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#07111f" },
  webview: { flex: 1, backgroundColor: "#07111f" },
});
