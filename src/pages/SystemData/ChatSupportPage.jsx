import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Divider,
  TextField,
  IconButton,
  Typography,
  Stack,
  Paper,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import moment from "moment";
import { getSocket } from "../../lib/socket";
import {
  getAdminInbox,
  getRoomMessages,
  markRoomRead,
  uploadChatAttachment,
} from "../../chatApi";
import { useAuth } from "../../context/AuthContext";

// Brand palette
const TEAL = "#097D76";
const TEAL_DARK = "#065F5A";
const TEAL_SOFT = "#E6F3F2";
const ORANGE = "#F38120";
const ORANGE_SOFT = "#FEF1E4";

export default function ChatSupportPage() {
  const { user } = useAuth();
  const adminId = user?.id;

  const [tab, setTab] = useState("receiver");
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const listEndRef = useRef(null);

  const activeRoom = useMemo(
    () => (rooms ?? []).find((r) => r.id === activeRoomId) ?? null,
    [rooms, activeRoomId],
  );

  const filteredRooms = useMemo(
    () => (rooms ?? []).filter((r) => r.participant_type === tab),
    [rooms, tab],
  );

  useEffect(() => {
    if (!adminId) return;
    const socket = getSocket();
    socket.emit("register_admin", adminId);

    getAdminInbox().then((res) => setRooms(res.data?.rooms ?? []));

    socket.on("chat_inbox_update", () => {
      getAdminInbox().then((res) => setRooms(res.data?.rooms ?? []));
    });

    return () => {
      socket.off("chat_inbox_update");
    };
  }, [adminId]);

  useEffect(() => {
    if (!activeRoomId) return;
    const socket = getSocket();

    setLoadingMessages(true);
    socket.emit("join_admin_chat_window", { chatRoomId: activeRoomId });

    socket.on("chat_history", ({ chatRoomId, messages: history }) => {
      if (chatRoomId !== activeRoomId) return;
      setMessages(history);
      setLoadingMessages(false);
      markRoomRead(chatRoomId);
    });

    socket.on("new_message", ({ chatRoomId, message }) => {
      if (chatRoomId !== activeRoomId) return;
      setMessages((prev) => [...prev, message]);
      markRoomRead(chatRoomId);
    });

    return () => {
      socket.emit("leave_admin_chat_window", { chatRoomId: activeRoomId });
      socket.off("chat_history");
      socket.off("new_message");
    };
  }, [activeRoomId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !activeRoomId || !adminId) return;

    getSocket().emit("send_message", {
      senderType: "admin",
      senderId: adminId,
      chatRoomId: activeRoomId,
      message: trimmed,
      attachments: [],
    });
    setInputText("");
  };

  const handleCloseChat = () => {
    if (!activeRoomId) return;
    getSocket().emit("close_chat", { chatRoomId: activeRoomId });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom || !adminId) return;

    setUploading(true);
    try {
      const res = await uploadChatAttachment(
        file,
        activeRoom.participant_type,
        activeRoom.participant_id,
      );
      getSocket().emit("send_message", {
        senderType: "admin",
        senderId: adminId,
        chatRoomId: activeRoom.id,
        attachments: res.data?.attachments ?? [],
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "calc(100vh - 100px)",
        bgcolor: "#FAFAF9",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "rgba(9,125,118,0.15)",
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: 340,
          borderRight: "1px solid",
          borderColor: "rgba(9,125,118,0.15)",
          bgcolor: "#fff",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 48,
            borderBottom: "1px solid",
            borderColor: "rgba(9,125,118,0.12)",
            "& .MuiTabs-indicator": {
              backgroundColor: TEAL,
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
            "& .MuiTab-root": {
              minHeight: 48,
              fontWeight: 600,
              textTransform: "none",
              color: "text.secondary",
              "&.Mui-selected": { color: TEAL },
            },
          }}
        >
          <Tab label="Receivers" value="receiver" />
          <Tab label="Shippers" value="shipper" />
        </Tabs>
        <List sx={{ overflowY: "auto", flex: 1, py: 0 }}>
          {filteredRooms.map((room) => {
            const selected = room.id === activeRoomId;
            return (
              <ListItemButton
                key={room.id}
                selected={selected}
                onClick={() => setActiveRoomId(room.id)}
                sx={{
                  borderLeft: "3px solid",
                  borderColor: selected ? `${TEAL} !important` : "transparent",
                  bgcolor: selected ? `${TEAL_SOFT} !important` : "transparent",
                  "&.Mui-selected": {
                    bgcolor: `${TEAL_SOFT} !important`,
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: `${TEAL_SOFT} !important`,
                  },
                  "&:hover": {
                    bgcolor: selected
                      ? `${TEAL_SOFT} !important`
                      : "rgba(9,125,118,0.05)",
                  },
                  py: 1.25,
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor:
                        room.participant_type === "receiver" ? TEAL : ORANGE,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {room.participant_type === "receiver" ? "R" : "S"}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    room.participant_name ??
                    `${room.participant_type === "receiver" ? "Receiver" : "Shipper"} #${room.participant_id}`
                  }
                  secondary={room.last_message_preview ?? "No messages yet"}
                  primaryTypographyProps={{
                    fontWeight: selected ? 700 : 600,
                    fontSize: 14,
                    sx: { color: "#1A1A1A !important" },
                  }}
                  secondaryTypographyProps={{
                    noWrap: true,
                    fontSize: 13,
                    sx: { color: "rgba(0,0,0,0.6) !important" },
                  }}
                />
                {room.unread_count > 0 && (
                  <Chip
                    label={room.unread_count}
                    size="small"
                    sx={{
                      bgcolor: ORANGE,
                      color: "#fff",
                      fontWeight: 700,
                      height: 20,
                      minWidth: 20,
                    }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* Conversation panel */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!activeRoom ? (
          <Box
            sx={{
              m: "auto",
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: TEAL_SOFT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 22, color: TEAL }}>💬</Typography>
            </Box>
            <Typography color="text.secondary">
              Select a conversation to start chatting
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid",
                borderColor: "rgba(9,125,118,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "#fff",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    bgcolor:
                      activeRoom.participant_type === "receiver"
                        ? TEAL
                        : ORANGE,
                    fontWeight: 600,
                  }}
                >
                  {activeRoom.participant_type === "receiver" ? "R" : "S"}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {activeRoom.participant_name ??
                      `${activeRoom.participant_type === "receiver" ? "Receiver" : "Shipper"} #${activeRoom.participant_id}`}
                  </Typography>
                  {(activeRoom.participant_email ||
                    activeRoom.participant_phone) && (
                    <Typography variant="caption" color="text.secondary">
                      {[
                        activeRoom.participant_email,
                        activeRoom.participant_phone,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={activeRoom.status === "open" ? "Open" : "Closed"}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor:
                      activeRoom.status === "open"
                        ? TEAL_SOFT
                        : "rgba(0,0,0,0.06)",
                    color:
                      activeRoom.status === "open"
                        ? TEAL_DARK
                        : "text.secondary",
                  }}
                />
                {activeRoom.status === "open" && (
                  <IconButton
                    size="small"
                    onClick={handleCloseChat}
                    title="Close chat"
                    sx={{
                      color: ORANGE,
                      "&:hover": { bgcolor: ORANGE_SOFT },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", p: 2, bgcolor: "#FAFAF9" }}>
              {loadingMessages ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                  <CircularProgress size={24} sx={{ color: TEAL }} />
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {messages.map((msg) => {
                    if (msg.sender_type === "system") {
                      return (
                        <Stack
                          key={msg.id}
                          direction="row"
                          alignItems="center"
                          spacing={1}
                        >
                          <Divider
                            sx={{ flex: 1, borderColor: "rgba(9,125,118,0.2)" }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: TEAL_DARK,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {msg.message}
                          </Typography>
                          <Divider
                            sx={{ flex: 1, borderColor: "rgba(9,125,118,0.2)" }}
                          />
                        </Stack>
                      );
                    }

                    const isAdmin = msg.sender_type === "admin";
                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          display: "flex",
                          justifyContent: isAdmin ? "flex-end" : "flex-start",
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            maxWidth: "70%",
                            bgcolor: isAdmin ? TEAL : "#fff",
                            color: isAdmin ? "#fff" : "text.primary",
                            border: isAdmin
                              ? "none"
                              : "1px solid rgba(0,0,0,0.08)",
                            borderRadius: isAdmin
                              ? "14px 14px 4px 14px"
                              : "14px 14px 14px 4px",
                          }}
                        >
                          {msg.message && (
                            <Typography variant="body2">
                              {msg.message}
                            </Typography>
                          )}
                          {msg.attachments?.map((att) => (
                            <Box key={att.id} sx={{ mt: 1 }}>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: isAdmin ? "#fff" : ORANGE,
                                  fontWeight: 600,
                                  textDecoration: "underline",
                                }}
                              >
                                {att.url}
                              </a>
                            </Box>
                          ))}
                          <Typography
                            variant="caption"
                            sx={{ display: "block", mt: 0.5, opacity: 0.75 }}
                          >
                            {moment(msg.created_at).format("h:mm A")}
                          </Typography>
                        </Paper>
                      </Box>
                    );
                  })}
                  <div ref={listEndRef} />
                </Stack>
              )}
            </Box>

            <Divider sx={{ borderColor: "rgba(9,125,118,0.15)" }} />
            <Box
              sx={{
                p: 2,
                display: "flex",
                gap: 1,
                alignItems: "center",
                bgcolor: "#fff",
              }}
            >
              <IconButton
                component="label"
                disabled={uploading}
                htmlFor="chat-attachment-input"
                sx={{
                  color: TEAL,
                  "&:hover": { bgcolor: TEAL_SOFT },
                }}
              >
                <AttachFileIcon />
              </IconButton>
              <input
                id="chat-attachment-input"
                ref={fileInputRef}
                type="file"
                hidden
                onChange={handleFileSelect}
              />
              <TextField
                fullWidth
                size="small"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && handleSend()
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: "#FAFAF9",
                    "& fieldset": { borderColor: "rgba(9,125,118,0.2)" },
                    "&:hover fieldset": { borderColor: TEAL },
                    "&.Mui-focused fieldset": { borderColor: TEAL },
                  },
                }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!inputText.trim()}
                sx={{
                  bgcolor: inputText.trim() ? TEAL : "rgba(0,0,0,0.08)",
                  color: inputText.trim() ? "#fff" : "text.disabled",
                  "&:hover": {
                    bgcolor: inputText.trim() ? TEAL_DARK : "rgba(0,0,0,0.08)",
                  },
                  transition: "background-color 0.15s",
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
