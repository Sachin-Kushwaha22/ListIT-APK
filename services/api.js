import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://192.168.1.7:8000";
// const BASE_URL = "https://list-apk-server.onrender.com";

export async function signupApi({ name, email, avatar }) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  if (avatar) {
    formData.append("avatar_file", avatar);
  }

  console.log("gett items")


  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Signup failed");
  }

  const data = await res.json();
  await AsyncStorage.setItem("token", data.token);
  return data;
}

export async function loginApi({ email }) {
  const formData = new FormData();
  formData.append("email", email);
  console.log("GET STARTED CLICKED", { email });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("User not found");
  }

  const data = await res.json();
  await AsyncStorage.setItem("token", data.token);
  return data;
}

export async function getMe() {
  const token = await AsyncStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function createItem(item) {
  const token = await AsyncStorage.getItem("token");

  if (!token) throw new Error("No token found");

  const formData = new FormData();
  formData.append("item", item);
  console.log("GET STARTED CLICKED", { item });
  const res = await fetch(`${BASE_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      text: item,
    }),
  });

  if (!res.ok) {
    throw new Error("User not found");
  }

  const data = await res.json();
  return data;
}

export async function getGroupedItems() {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("NO_TOKEN");
  }

  const res = await fetch(`${BASE_URL}/items/grouped`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("FETCH_FAILED");
  }

  return res.json();
}

export async function getGroupedItemsById(email) {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("NO_TOKEN");
  }

  const res = await fetch(`${BASE_URL}/items/grouped/${email}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!res.ok) {
    throw new Error("FETCH_FAILED");
  }

  return res.json();
}

export async function deleteItem(itemId) {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("NO_TOKEN");
  }

  const res = await fetch(`${BASE_URL}/items/${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (res.status === 403) {
    throw new Error("FORBIDDEN");
  }

  if (res.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!res.ok) {
    throw new Error("DELETE_FAILED");
  }

  return res.json(); // { success: true }
}

export async function updateItemStatus(itemId, status) {
  const token = await AsyncStorage.getItem("token");

  if (!token) {
    throw new Error("NO_TOKEN");
  }

  const res = await fetch(`${BASE_URL}/items/${itemId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 403) throw new Error("FORBIDDEN");
  if (!res.ok) throw new Error("UPDATE_FAILED");

  return res.json();
}

export const updateUserAvatar = async (avatar) => {
  const token = await AsyncStorage.getItem("token");
  if (!token) {
    throw new Error("NO_TOKEN");
  }

  if (!avatar) return;

  const form = new FormData();

  form.append("avatar_file", {
    uri: avatar.uri,
    name: avatar.name,
    type: avatar.type,
  });

  const res = await fetch(`${BASE_URL}/user/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Avatar update failed");
  }

  return res.json();
};
