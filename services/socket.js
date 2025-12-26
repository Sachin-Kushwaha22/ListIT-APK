const BASE_URL = "http://192.168.1.11:8000"; 

let socket = null;

export function connectSocket(onMessage) {
  if (socket) return; 

  const WS_URL = BASE_URL.replace("http", "ws") + "/ws";
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("🟢 WebSocket connected");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  socket.onerror = (error) => {
    console.log("❌ WebSocket error", error);
  };

  socket.onclose = () => {
    console.log("🔴 WebSocket closed");
    socket = null;
  };
}

export function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
