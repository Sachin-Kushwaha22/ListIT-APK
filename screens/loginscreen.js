import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";


import { signupApi, loginApi, getMe } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function LoginScreen({ onSignup, onLogin }) {
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [authDone, setAuthDone] = useState(false);
  const [userData, setUserData] = useState({});

  const isSignup = mode === "signup";

  const userDataSet = async () => {
    const user = await getMe();
    setUserData(user)
  }
  useEffect(() => {
    if (showInfo) {
      userDataSet()
    }
  }, [showInfo])

  useEffect(() => {
    if (authDone) {
      onSignup(userData);
      setShowInfo(false)
      setAuthDone(false)
    }
  }, [authDone])



  const [avatar, setAvatar] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled) return

    const asset = result.assets[0];

    setAvatar({
      uri: asset.uri,
      name: asset.fileName || `avatar.${asset.uri.split(".").pop()}`,
      type: asset.mimeType,
    });
  };

  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Image
  source={require("../assets/logo-flat.png")}
  style={{
    width: 130,
    height: 50,
    resizeMode: "contain",
    position: "absolute",
    top: insets.top + 8,   // 👈 below notch
    alignSelf: "center",
    zIndex: 10,
  }}
/>
        <View style={styles.container}>
          {/* Avatar */}
          {(isSignup || showInfo) && (
            <View style={styles.avatarWrapper}>
              <Image
                source={
                  avatar ? { uri: avatar.uri } : userData?.avatar ? { uri: userData.avatar } : require("../assets/avatar.jpg")
                }
                style={styles.avatar}
              />

              {!showInfo && <TouchableOpacity style={styles.editBtn} onPress={pickImage}>
                <MaterialIcons name="edit" size={18} color="#fff" />
              </TouchableOpacity>}
            </View>
          )}

          {showInfo && (
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // marginVertical: 8,
                marginBottom: 20
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#12293d",
                }}
              >
                {userData?.name}
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  color: "#666",
                  marginTop: 2,
                }}
              >
                {userData?.email}
              </Text>
            </View>

          )}

          {/* Title */}
          {isSignup && <Text style={styles.title}>
            Need Anything ?{'\n'} Just Write It
          </Text>}

          {/* Subtitle */}
          {!showInfo && <Text style={styles.subtitle}>
            {isSignup
              ? "Create your account to get started"
              : "Enter your email to continue"}
          </Text>}

          {/* Inputs */}
          {isSignup && (
            <TextInput
              placeholder="Your name"
              placeholderTextColor="#9A9A9A"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          )}

          {!showInfo && <TextInput
            placeholder="Email address"
            placeholderTextColor="#9A9A9A"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />}

          {/* Primary Button */}
          <Pressable
            style={styles.primaryButton}
            onPress={async () => {
              try {
                console.log("GET STARTED CLICKED", { name, email, avatar });
                if (showInfo) {
                  setAuthDone(true)
                  return
                }
                if (isSignup) {
                  await signupApi({ name, email, avatar });
                  const user = await getMe();
                  onSignup(user);
                } else {
                  await loginApi({ email });
                  setShowInfo(true)
                }



              } catch (err) {
                Alert.alert(
                  "Error",
                  isSignup
                    ? "Signup failed. Try again."
                    : "User not found. Please sign up."
                );

                // smart UX: auto switch to signup if login fails
                if (!isSignup) {
                  setMode("signup");
                }
              }
            }}

          >
            <Text style={styles.primaryButtonText}>
              {isSignup ? "Get Started" : !showInfo ? "Log In" : "Continue"}
            </Text>
          </Pressable>

          {/* Bottom Switch */}
          {!showInfo && <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>
              {isSignup
                ? "Already have an account?"
                : "New here?"}
            </Text>

            <Pressable
              onPress={() =>
                setMode(isSignup ? "login" : "signup")
              }
            >
              <Text style={styles.linkText}>
                {isSignup ? " Log In" : " Get Started"}
              </Text>
            </Pressable>
          </View>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F5",
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  avatarWrapper: {
    marginBottom: 20,
    padding: 0,
    alignSelf: "center",
    position: "relative",
  },

  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#E0E0E0",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    elevation: 8,
  },
  editBtn: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    color: "#2F2F2F",
    marginBottom: 10,
  },

  subtitle: {
    textAlign: "center",
    color: "#9A9A9A",
    marginBottom: 30,
    fontSize: 14,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 14,
    color: "#2F2F2F",
  },

  primaryButton: {
    backgroundColor: "#2F2F2F",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },

  bottomText: {
    color: "#9A9A9A",
    fontSize: 14,
  },

  linkText: {
    color: "#E53935",
    fontWeight: "600",
    fontSize: 14,
  },
});
