"use client";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { useEffect, useState } from "react";
import { user } from "@/app/(interface)/interface";
import { Socket, io } from "socket.io-client";

const socket: Socket = io("http://localhost:8080");

// Fetch current user by email
const fetchCurrentUserFromDatabase = async (email: string) => {
  try {
    const res = await fetch(`http://localhost:8080/api/users/email/${email}`);
    return await res.json();
  } catch (err) {
    console.log(err);
    return null;
  }
};

const updateChatLastMessage = async (chatId: string, message: string) => {
  try {
    await fetch(`http://localhost:8080/api/chats/${chatId}`, {
      method: "PATCH", // or "PUT" depending on your API
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastMessage: message,
        updatedAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("Failed to update last message:", err);
  }
};

// Fetch the person the user is chatting with by ID
const fetchPersonChattingFromDatabase = async (id: string) => {
  try {
    const res = await fetch(`http://localhost:8080/api/users/id/${id}`);
    return await res.json();
  } catch (err) {
    console.log(err);
    return null;
  }
};

// Fetch messages from the database
const fetchMessagesFromDatabase = async (chatId: string | undefined) => {
  try {
    const res = await fetch(`http://localhost:8080/api/messages/${chatId}`);
    return await res.json();
  } catch (err) {
    console.log(err);
    return [];
  }
};

// Save a message to the database
const sendMessageToDatabase = async (message: any) => {
  try {
    await fetch("http://localhost:8080/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.log("Failed to save message:", err);
  }
};

function Page() {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<user | null>(null);
  const [personChatting, setPersonChatting] = useState<user | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState<string>("");

  const params = useParams();
  const id = Array.isArray(params.messaging)
    ? params.messaging[0]
    : params.messaging;
  const chat = Array.isArray(params.chat) ? params.chat[0] : params.chat;

  // Fetch authenticated user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
      }
    });
    return () => unsubscribe(); // Cleanup listener
  }, []);

  // Fetch current user details
  useEffect(() => {
    if (currentUserEmail) {
      const fetchData = async () => {
        const data = await fetchCurrentUserFromDatabase(currentUserEmail);
        setCurrentUser(data);
      };
      fetchData();
    }
  }, [currentUserEmail]);

  // Fetch details of the person being chatted with
  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        const data = await fetchPersonChattingFromDatabase(id);
        setPersonChatting(data);
        setLoading(false);
      };
      fetchData();
    }
  }, [id]);

  // Generate a unique room ID (same regardless of chat initiator)
  const createRoomId = (
    idOne: string | undefined,
    idTwo: string | undefined
  ) => {
    return [idOne, idTwo].sort().join("_");
  };
  const roomId = createRoomId(currentUser?._id, id);

  // Join the chat room
  useEffect(() => {
    if (currentUser?.username && roomId) {
      socket.emit("join_room", { name: currentUser.username, roomId });
    }
  }, [currentUser, roomId]);

  // Fetch messages from DB when chat ID changes
  useEffect(() => {
    if (chat) {
      const fetchMessages = async () => {
        const data = await fetchMessagesFromDatabase(chat);
        setMessages(data);
      };
      fetchMessages();
    }
  }, [chat, messages]);

  // Handle incoming messages via socket
  useEffect(() => {
    const handleReceiveMessage = (message: any) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("receive-text", handleReceiveMessage);

    return () => {
      socket.off("receive-text", handleReceiveMessage); // Cleanup listener
    };
  }, [socket]);

  // Send message
  const handleSend = async () => {
    if (text.trim() !== "") {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = {
        text,
        sender: currentUser?._id,
        chatId: chat,
        time: formattedTime, // Store time in HH:mm format
      };

      // Emit message via socket
      socket.emit("text", message);

      // Save message to database
      await sendMessageToDatabase(message);

      // Update last message in chat
      if (chat) {
        await updateChatLastMessage(chat, text);
      }

      // Clear input field
      setText("");
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="flex items-center gap-2 p-4 bg-[#344E41] text-white font-semibold">
        <div className="w-[30px] h-[30px] bg-gray-500 rounded-full "></div>
        <p>{personChatting?.username || "Unknown"}</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg mb-2 h-auto max-w-[70%] break-words whitespace-pre-wrap ${
                  message.sender === currentUser?._id
                    ? "bg-blue-500 text-white self-end"
                    : "bg-gray-300 text-black self-start"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs">
                  {new Date(message.time).toLocaleTimeString()}
                </p>
              </div>
            ))
          ) : (
            <p className="m-auto">No messages yet</p>
          )}
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex p-2 bg-gray-200">
        <input
          type="text"
          className="flex-1 p-2 rounded-md border border-gray-400"
          placeholder="Enter Message Here"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="button"
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Page;
