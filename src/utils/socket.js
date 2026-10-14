import { io } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://143.110.251.34:6002";

let socketInstance = null;

export const getSocket = (token) => {
  // reuse single instance per tab
  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      path: "/socket.io/",
      transports: ["websocket"],
      auth: token ? { token: `Bearer ${token}` } : {},
      autoConnect: false,
    });
  } else if (token) {
    socketInstance.auth = { token: `Bearer ${token}` };
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

