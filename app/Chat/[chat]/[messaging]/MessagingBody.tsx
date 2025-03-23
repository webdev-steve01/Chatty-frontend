"use client";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { useEffect, useState } from "react";
import { user } from "@/app/(interface)/interface";
import { io, Socket } from "socket.io-client";

type message = {
  chatId: string;
  sender: string;
  text: string;
  time: string;
};

const socket: Socket = io("https://chatty-0o87.onrender.com");

const fetchUserByEmail = async (email: string) => {
  try {
    const res = await fetch(
      `https://chatty-0o87.onrender.com/api/users/email/${email}`
    );
    return await res.json();
  } catch (err) {
    console.error("Error fetching user:", err);
    return null;
  }
};

const fetchUserById = async (id: string) => {
  try {
    const res = await fetch(
      `https://chatty-0o87.onrender.com/api/users/id/${id}`
    );
    return await res.json();
  } catch (err) {
    console.error("Error fetching user by ID:", err);
    return null;
  }
};

const fetchMessages = async (chatId: string) => {
  try {
    const res = await fetch(
      `https://chatty-0o87.onrender.com/api/messages/${chatId}`
    );
    return await res.json();
  } catch (err) {
    console.error("Error fetching messages:", err);
    return [];
  }
};

const sendMessageToDB = async (message: message) => {
  try {
    await fetch("https://chatty-0o87.onrender.com/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error("Failed to save message:", err);
  }
};

function MessagingBody() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<user | null>(null);
  const [personChatting, setPersonChatting] = useState<user | null>(null);
  const [messages, setMessages] = useState<message[]>([]);
  const [text, setText] = useState("");
  const [activeUsers, setActiveUsers] = useState<string[]>([]);

  const params = useParams();
  const chatId = params.chat as string;
  const userId = params.messaging as string;

  // Fetch authenticated user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const fetchedUser = await fetchUserByEmail(user.email!);
        setCurrentUser(fetchedUser);
        socket.emit("user-online", fetchedUser._id);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch the person the user is chatting with
  useEffect(() => {
    if (userId) {
      fetchUserById(userId).then(setPersonChatting);
      setLoading(false);
    }
  }, [userId]);

  // Fetch messages for the chat
  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId).then(setMessages);
    }
  }, [chatId]);

  // Listen for active users
  useEffect(() => {
    socket.on("active-users", setActiveUsers);
    return () => {
      socket.off("active-users");
    };
  }, [activeUsers]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("receive-text", (message: message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("receive-text");
    };
  }, []);

  // Send message
  const handleSend = async () => {
    if (text.trim() !== "" && currentUser?._id) {
      const newMessage: message = {
        text,
        sender: currentUser._id,
        chatId,
        time: new Date().toISOString(),
      };

      // Update UI immediately
      setMessages((prev) => [...prev, newMessage]);

      // Emit to server
      socket.emit("text", { ...newMessage, room: chatId });

      // Save to database
      await sendMessageToDB(newMessage);
      setText("");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex justify-between flex-col h-[100vh]">
      <div>
        <div className="flex items-center gap-2 p-4 bg-[#BC6C25] text-white">
          <div
            style={{
              backgroundImage: `url(${personChatting?.profilePic})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            className="w-[50px] h-[50px] rounded-full"
          ></div>
          <p>{personChatting?.username || "Unknown"}</p>
          <p>
            {activeUsers.includes(personChatting?._id ?? "")
              ? "(Online)"
              : "(Offline)"}
          </p>
        </div>
        <div className="flex flex-col overflow-y-auto p-4 h-[82vh]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 my-2 rounded-md max-w-[50%] break-words ${
                msg.sender === currentUser?._id
                  ? "bg-gray-300 self-end"
                  : "bg-gray-700 self-start"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-self-end">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter Message"
          className="w-full"
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default MessagingBody;
