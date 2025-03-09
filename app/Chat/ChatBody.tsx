"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase";
import { user } from "../(interface)/interface";
import ChatNavFooter from "../(components)/ChatNavFooter";

type chatProp = {
  _id: string;
  members: string[];
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

// !function to fetch chats
const fetchChatsFromDatabase = async (id: string | undefined) => {
  try {
    if (id) {
      const res = await fetch(
        `https://chatty-0o87.onrender.com/api/chats/${id}`
      );
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.log(err);
    return [];
  }
};

// !function to fetch users

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

// ! main function
function ChatBody() {
  const [chats, setChats] = useState<chatProp[]>([]);
  const [friends, setFriends] = useState<Record<string, user>>({});
  const [currentUser, setCurrentUser] = useState<user>();
  const [email, setEmail] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // ! checking to see if the user is currently logged in
  useEffect(() => {
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setEmail(user.email);
        setLoading(false);
      } else {
        router.push("../");
      }
    });
  }, [router]);

  // ! fetching the current user
  useEffect(() => {
    if (!email) return; // Prevents running fetch when email is undefined

    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://chatty-0o87.onrender.com/api/users/email/${email}`
        );
        if (!res.ok) throw new Error("Failed to fetch user"); // Handle errors properly
        const data = await res.json();
        setCurrentUser(data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchData();
  }, [email]); // Runs only when email changes

  // ! fetching the chats
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchChatsFromDatabase(currentUser?._id);
      setChats(data);
    };
    fetchData();
  }, [currentUser?._id]);

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

      setFriends(Object.assign({}, ...friendData));
    };

    fetchFriends();
  }, [chats, currentUser]);

  // ! if onAuthStateChanged is still authenticating, show this
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
        <p>Chatty</p>
        {/* <p>{props.user?._id}</p> */}
      </section>
      <section>
        {chats?.map((chat, index) => {
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
              <div className="w-[40px] h-[40px] rounded-full bg-gray-500"></div>
              <div>
                <p className="font-semibold">
                  {friend ? friend.username : "Loading..."}
                </p>
                <p className="text-gray-500 text-[0.8em] italic">
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>
            </div>
          );
        })}
      </section>
      <section>
        <ChatNavFooter />
      </section>
    </div>
  );
}

export default ChatBody;
