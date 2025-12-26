import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, FlatList, Image, TouchableOpacity } from "react-native";
import {
  Text,
  Button,
  Card,
  Avatar,
  FAB,
  Portal,
  Modal,
  TextInput,
  Checkbox
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import {
  getGroupedItems,
  createItem,
  deleteItem,
  updateItemStatus,
  updateUserAvatar,
  getMe
} from "../services/api";
import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";

export default function HomeScreen({ navigation, user, reloadUser, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState({});

  const [profileVisible, setProfileVisible] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupModalVisible, setGroupModalVisible] = useState(false);


  const load = async () => {
    try {
      setLoading(true);
      const data = await getGroupedItems();
      console.log("data grouped", data)
      setGroups(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );


  // useEffect(() => {
  //   load();
  //   connectSocket((data) => {
  //     if (data.event === "ITEM_CREATED") load();
  //   });
  //   return () => disconnectSocket();
  // }, []);

  useEffect(() => {
    if (!activeGroup?.items) return;

    const initialChecked = {};

    activeGroup.items.forEach((item) => {
      initialChecked[item.id] = item.status === "done";
    });

    setCheckedItems(initialChecked);
  }, [activeGroup]);

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

    const ava = await updateUserAvatar(avatar)
    if (ava?.avatar) {
      const freshUser = await getMe();
      console.log("reloading page with data", ava?.avatar)
      reloadUser(freshUser);
    }
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: 'center' }}>
          <Image
            source={require("../assets/logo-flat.png")}
            style={{ width: 130, height: 50, resizeMode: "contain" }}
          />

          <View
            style={{
              borderWidth: 1,
              borderColor: "rgb(161, 158, 158)",
              borderRadius: 50,
              padding: 1,
            }}
          >
            <Avatar.Image
              size={40}
              source={
                user.avatar
                  ? { uri: user.avatar }
                  : require("../assets/avatar.jpg")
              }
              onTouchEnd={() => setProfileVisible(true)}
            />
          </View>


        </View>

        {/* USER CONTAINERS */}
        <FlatList
          data={groups}
          keyExtractor={(g, i) => g.user_email ?? i.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Card
              style={{ marginBottom: 12 }}
              // onPress={() => setActiveGroup(item)}            
              onPress={() =>
                navigation.navigate("Group", { group: item, user: user })
              }
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 12,
                }}
              >
                <Avatar.Image
                  size={30}
                  source={
                    item.user_avatar
                      ? { uri: item.user_avatar }
                      : require("../assets/avatar.jpg")
                  }
                />

                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 16,
                    fontWeight: "500",
                  }}
                >
                  {item.user_name}
                </Text>
              </View>
              <Card.Content>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: "column", justifyContent: "flex-end" }}>
                    <Text variant="bodySmall">
                      <Text style={{ color: "green", fontWeight: "600" }}>
                        {item.done_count ?? 0}
                      </Text>{" "}
                      : Done
                    </Text>

                    <Text variant="bodySmall">
                      <Text style={{ color: "red", fontWeight: "600" }}>
                        {item.pending_count ?? 0}
                      </Text>{" "}
                      : Pending
                    </Text>
                  </View>

                  <Text variant="bodySmall">
                    {item.items?.length ?? 0} items
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
          refreshing={loading}
          onRefresh={load}
        />

        {/* ADD BUTTON */}
        <FAB
          icon="plus"
          style={{ position: "absolute", right: 16, bottom: 30 }}
          onPress={() =>
            navigation.navigate("Group", {
              group: {
                user_avatar:user.avatar,
                user_name: user.name,
                user_email: user.email,
                items: [], 
              },
              user: user, 
            })
          }
        />

        {/* PROFILE MODAL */}
        <Portal>
          <Modal
            visible={profileVisible}
            onDismiss={() => setProfileVisible(false)}
          >
            <Card style={{ margin: 20 }}>
              <Card.Content style={{ alignItems: "center" }}>

                {/* Avatar wrapper */}
                <View
                  style={{
                    position: "relative",
                  }}
                >
                  <Avatar.Image
                    size={150}
                    source={
                      user.avatar
                        ? { uri: user.avatar }
                        : require("../assets/avatar.jpg")
                    }
                  />

                  {/* Edit button */}
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 20,
                      width: 30,
                      height: 30,
                      borderRadius: 50,
                      backgroundColor: "#4CAF50",
                      justifyContent: "center",
                      alignItems: "center",
                      elevation: 4,
                      borderWidth: 1,
                      borderColor: "#fff",
                    }}
                  >
                    <MaterialIcons name="edit" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={{ marginTop: 10, fontSize: 18 }}>
                  {user.name}
                </Text>
                <Text style={{ marginTop: 5, color: '#706e6e', fontSize: 13 }}>
                  {user.email}
                </Text>

                <Button
                  mode="outlined"
                  style={{ marginTop: 16 }}
                  onPress={onLogout}
                  textColor="red"
                >
                  Logout
                </Button>
              </Card.Content>
            </Card>
          </Modal>
        </Portal>


        {/* CONTAINER MODAL */}
        {/* <Portal>
          <Modal
            visible={!!activeGroup}
            onDismiss={() => setActiveGroup(null)}
          >
            {activeGroup && (
              <Card style={{ margin: 16 }}>
                <Card.Title title={activeGroup.user_name} />

                <Card.Content>
                  {activeGroup.items?.map((i) => (
                    <View
                      key={i.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginVertical: 6,
                      }}
                    >
                      <Checkbox
                        status={checkedItems[i.id] ? "checked" : "unchecked"}
                        disabled={loadingItems[i.id]}
                        onPress={() => onCheckboxPress(i)}
                      />

                      <Text
                        style={{
                          flex: 1,
                          textDecorationLine: checkedItems[i.id]
                            ? "line-through"
                            : "none",
                          opacity: checkedItems[i.id] ? 0.5 : 1,
                        }}
                      >
                        {i.text}
                      </Text>
                    </View>

                  ))}

                  {isMe(activeGroup.user_email) && (
                    <>
                      <TextInput
                        label="Add item"
                        value={text}
                        onChangeText={setText}
                        style={{ marginTop: 12 }}
                      />
                      <Button
                        mode="contained"
                        style={{ marginTop: 8 }}
                        onPress={() => {
                          if (!text.trim()) return;
                          createItem(text).then(() => {
                            setText("");
                            load();
                          });
                        }}
                      >
                        Add
                      </Button>
                    </>
                  )}
                </Card.Content>
              </Card>
            )}
          </Modal>
        </Portal> */}
      </SafeAreaView>
    </>
  );
}
