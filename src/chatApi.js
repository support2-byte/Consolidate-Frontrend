import axios from "axios";

export const chatApi = axios.create({
  baseURL: import.meta.env.VITE_SOCKET_URL,
  withCredentials: true,
});

export const getAdminInbox = (status) =>
  chatApi.get("/api/chat/rooms", { params: status ? { status } : {} });

export const getRoomMessages = (chatRoomId) =>
  chatApi.get(`/api/chat/rooms/${chatRoomId}/messages`);

export const markRoomRead = (chatRoomId) =>
  chatApi.patch(`/api/chat/rooms/${chatRoomId}/read`, { readerType: "admin" });

export const uploadChatAttachment = (file, participantType, participantId) => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("participantType", participantType);
  formData.append("participantId", String(participantId));
  return chatApi.post("/api/chat/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
