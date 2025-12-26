import { View, FlatList, Image, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Text, Checkbox, TextInput, Button } from "react-native-paper";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  getGroupedItems,
  createItem,
  deleteItem,
  updateItemStatus,
  getGroupedItemsById
} from "../services/api";

export default function GroupDetailsScreen({ route }) {
  const { group, user } = route.params;

  const [text, setText] = useState("");
  const [checkedItems, setCheckedItems] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const toggleCheck = async (item) => {
    if (!isMe(group.user_email)) return;

    const prevChecked = checkedItems[item.id];
    const newChecked = !prevChecked;
    const newStatus = newChecked ? "done" : "pending";

    // 1️⃣ optimistic UI
    setCheckedItems((prev) => ({
      ...prev,
      [item.id]: newChecked,
    }));

    setLoadingItems((prev) => ({
      ...prev,
      [item.id]: true,
    }));

    try {
      // 2️⃣ API call
      await updateItemStatus(item.id, newStatus);
    } catch (err) {
      // 🔁 rollback on failure
      setCheckedItems((prev) => ({
        ...prev,
        [item.id]: prevChecked,
      }));
      console.error("Status update failed:", err.message);
    } finally {
      setLoadingItems((prev) => ({
        ...prev,
        [item.id]: false,
      }));
    }
  };

  const isMe = (email) => email === user.email;

  const load = async () => {
    try {
      setLoading(true);

      const data = await getGroupedItemsById(group.user_email);
      const fetchedItems = data[0]?.items || [];
      console.log("data here", fetchedItems)
      setItems(fetchedItems);

      const initialChecked = {};
      fetchedItems.forEach((item) => {
        initialChecked[item.id] = item.status === "done";
      });

      setCheckedItems(initialChecked);
    } catch (err) {
      console.log("LOAD ERROR:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image
            source={group.user_avatar ? { uri: group.user_avatar } : require("../assets/avatar.jpg")}
            style={styles.avatar}
          />
          <Text style={styles.username}>{group.user_name}</Text>
        </View>

        {/* ITEMS LIST */}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 90 }}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Checkbox
                status={checkedItems[item.id] ? "checked" : "unchecked"}
                disabled={!isMe(group.user_email)}
                onPress={() => toggleCheck(item)}
              />
              <Text
                style={[
                  styles.itemText,
                  checkedItems[item.id] && styles.checkedText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
        />

        {/* INPUT BAR */}
        {!!isMe(group.user_email) && (
          <View style={styles.inputBar}>
          <TextInput
            mode="outlined"
            placeholder="Add a new item..."
            value={text}
            onChangeText={setText}
            style={styles.input}
            outlineColor="#e0e0e0"
            activeOutlineColor="#4CAF50"
            dense
          />
        
          <Button
            mode="contained"
            onPress={async () => {
              if (!text.trim()) return;
              await createItem(text);
              setText("");
              load();
            }}
            style={styles.addBtn}
            contentStyle={{ height: 44 }}
          >
            Add
          </Button>
        </View>
        
        )}
      </View>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 22,
    marginRight: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  checkedText: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  // inputBar: {
  //   position: "absolute",
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   flexDirection: "row",
  //   padding: 10,
  //   backgroundColor: "#fff",
  //   borderTopWidth: 1,
  //   borderColor: "#eee",
  // },
  inputBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",

    // premium feel
    borderTopWidth: 1,
    borderColor: "#eee",
    // elevation: 12,
    // shadowColor: "#ffffff",
    // shadowOpacity: 0.08,
    // shadowOffset: { width: 0, height: -2 },
    // shadowRadius: 8,
  },

  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#fff",
    marginRight: 8,
  },

  addBtn: {
    borderRadius: 5,
  },
});
