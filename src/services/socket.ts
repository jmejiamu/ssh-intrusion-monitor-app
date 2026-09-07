import { io } from "socket.io-client";

import { SOCKET_API_URL } from "@/config/apiConfig";

export const socket = io(SOCKET_API_URL, {
  autoConnect: false,
});
