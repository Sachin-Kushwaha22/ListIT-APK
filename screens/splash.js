import { View, Image, StyleSheet } from "react-native";

export default function Splash() {
    console.log("splash is showing")
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/splash.png")}
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
});
