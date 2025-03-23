"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import io from "socket.io-client";
import { user } from "../(interface)/interface";
import ChatNavFooter from "../(components)/ChatNavFooter";
import Image from "next/image";
import empty from "@/public/empty.svg";

const socket = io("http://localhost:8080");

type chatProp = {
  _id: string;
  members: string[];
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

type lastMessageType = {
  _id: string;
  chatId: string;
  sender: string;
  text: string;
  time: string;
  __v: number;
};

// Function to fetch last message
const fetchLastMessageFromDatabase = async (
  id: string
): Promise<lastMessageType | null> => {
  try {
    const res = await fetch(
      `https://chatty-0o87.onrender.com/api/messages/id/${id}`
    );
    if (!res.ok) throw new Error("Failed to fetch last message");
    return await res.json();
  } catch (err) {
    console.log("Error fetching last message:", err);
    return null;
  }
};

const fetchUserFromDatabase = async (id: string) => {
  try {
    const res = await fetch(
      `https://chatty-0o87.onrender.com/api/users/id/${id}`
    );
    const data = await res.json();
    return data;
  } catch (err) {
    console.log(err);
  }
};

function ChatBody() {
  const [chats, setChats] = useState<chatProp[]>([]);
  const [lastMessages, setLastMessages] = useState<
    Record<string, lastMessageType | null>
  >({});
  const [friends, setFriends] = useState<Record<string, user>>({});
  const [currentUser, setCurrentUser] = useState<user>();
  const [email, setEmail] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(true);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const router = useRouter();

  // Fetch logged-in user
  useEffect(() => {
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setEmail(user.email);
        setLoading(false);
      } else {
        router.push("../");
      }
    });
    if (currentUser) {
      socket.emit("user-online", currentUser?._id);
    }
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      socket.emit("user-online", currentUser?._id);
      socket.on("active-users", (users: string[]) => {
        setActiveUsers(users);
        console.log(activeUsers);
      });
    }

    return () => {
      socket.off("active-users");
    };
  });

  // Fetch user details
  useEffect(() => {
    if (!email) return;
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `https://chatty-0o87.onrender.com/api/users/email/${email}`
        );
        if (!res.ok) throw new Error("Failed to fetch user");
        setCurrentUser(await res.json());
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, [email]);

  // Fetch chats
  useEffect(() => {
    if (!currentUser?._id) return;
    const fetchChats = async () => {
      try {
        const res = await fetch(
          `https://chatty-0o87.onrender.com/api/chats/${currentUser._id}`
        );
        if (!res.ok) throw new Error("Failed to fetch chats");
        const data = await res.json();
        setChats(data);
      } catch (err) {
        console.error("Error fetching chats:", err);
      }
    };
    fetchChats();
  }, [currentUser?._id]);

  // Fetch last messages for each chat
  useEffect(() => {
    if (chats.length === 0) return;
    const fetchLastMessages = async () => {
      const messages = await Promise.all(
        chats.map(async (chat) => {
          if (chat.lastMessage) {
            return {
              [chat._id]: await fetchLastMessageFromDatabase(chat.lastMessage),
            };
          }
          return { [chat._id]: null };
        })
      );
      setLastMessages(Object.assign({}, ...messages));
    };
    fetchLastMessages();
  }, [chats]);

  // Sorting chats based on last update
  useEffect(() => {
    if (chats.length > 0) {
      setChats(
        [...chats].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      );
    }
  }, [lastMessages]);

  // ! fetching the user friends, AI helped
  useEffect(() => {
    if (!currentUser || chats?.length === 0) return; // Ensure currentUser is set

    const fetchFriends = async () => {
      const uniqueIds = new Set(
        chats?.flatMap((chat) =>
          chat.members.filter((member) => member !== currentUser._id)
        )
      );

      const friendData = await Promise.all(
        Array.from(uniqueIds).map(async (userId) => {
          const user = await fetchUserFromDatabase(userId);
          return { [userId]: user };
        })
      );

      setFriends(Object.assign({}, ...friendData.sort()));
    };

    fetchFriends();
  }, [chats]);

  // Redirect if still authenticating
  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  const goToMessages = (id: string | undefined, chatId: string | undefined) => {
    router.push(`/Chat/${chatId}/${id}`);
  };

  return (
    <div>
      <section className="text-[#283618] bg-[#BC6C25] text-[1.5em] font-semibold px-6 py-2">
        <div className="flex gap-3 items-center">
          <div
            className="w-[50px] h-[50px] rounded-full"
            style={{
              backgroundImage: currentUser?.profilePic
                ? `url(${currentUser?.profilePic})`
                : `url(https://res.cloudinary.com/dlpty7kky/image/upload/v1742671118/istockphoto-1495088043-612x612_dkfloi.jpg)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <p>Hello {currentUser?.username}</p>
        </div>
      </section>
      <section>
        {chats?.length > 0 ? (
          chats?.map((chat, index) => {
            const friendId = chat.members.find(
              (member) => member !== currentUser?._id
            );
            const friend = friendId ? friends[friendId] : null;
            return (
              <div
                key={index}
                onClick={() => goToMessages(friendId, chat._id)}
                className="p-4 border-b flex items-center gap-4 cursor-default "
              >
                <div
                  className="w-[50px] h-[50px] rounded-full"
                  style={{
                    backgroundImage: friend?.profilePic
                      ? `url(${friend?.profilePic})`
                      : `url(https://res.cloudinary.com/dlpty7kky/image/upload/v1742671118/istockphoto-1495088043-612x612_dkfloi.jpg)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                ></div>
                <div>
                  <p className="font-semibold">
                    {friend ? friend.username : "Loading..."}
                  </p>
                  <p className="text-gray-500 text-[0.8em] italic truncate w-[200px] overflow-hidden whitespace-nowrap">
                    {lastMessages[chat._id]?.text || "no messages yet"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full h-[80vh] flex justify-center items-center">
            <Image src={empty} height={500} width={500} alt="empty" />
          </div>
        )}
      </section>
      <section>
        <ChatNavFooter />
      </section>
    </div>
  );
}

export default ChatBody;
