"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
import { user, chats } from "../(interface)/interface";
import ChatNavFooter from "../(components)/ChatNavFooter";
import Image from "next/image";
import empty from "@/public/undraw_back-home_3dun.svg";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

// Set to `true` if you want real-time updates from Firestore
const REALTIME = true;

const fetchUserFromDatabase = async (email: string) => {
  try {
    const userRef = collection(db, "allUsers");
    const q = query(userRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as user;
    } else {
      console.log("No user found with this email.");
    }
  } catch (err) {
    console.log(err);
  }
};

const ChatBody = () => {
  const [chats, setChats] = useState<chats[]>([]);
  const [friends, setFriends] = useState<user[]>([]);
  const [friendEmail, setFriendEmail] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<user>();
  const [email, setEmail] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // 🔐 Auth
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

  // 👤 Get user info
  useEffect(() => {
    if (!email) return;
    fetchUserFromDatabase(email).then((userData) => {
      if (userData) {
        setCurrentUser(userData);
      }
    });
  }, [email]);

  // 💬 Fetch chats (either realtime or one-time)
  useEffect(() => {
    if (!currentUser?.email) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", currentUser.email)
    );

    const handleSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
      const chats = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          createdAt: data.createdAt.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt.toDate?.() ?? new Date(),
          lastMessage: data.lastMessage ?? null,
          members: data.members ?? [],
        } as chats;
      });

      const sortedChats = chats.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      setChats(sortedChats);
    };

    if (REALTIME) {
      const unsubscribe = onSnapshot(q, handleSnapshot);
      return () => unsubscribe(); // Cleanup
    } else {
      getDocs(q).then(handleSnapshot);
    }
  }, [currentUser]);

  // 👥 Get friends from chat members
  useEffect(() => {
    if (!chats.length || !currentUser?.email) return;

    const emails: string[] = chats
      .map((chat) => chat.members.find((email) => email !== currentUser.email))
      .filter((email): email is string => Boolean(email));

    setFriendEmail(emails);
  }, [chats, currentUser]);

  // 👤 Fetch friend user info
  useEffect(() => {
    if (friendEmail.length === 0) return;

    const fetchFriends = async () => {
      const friendsData = await Promise.all(
        friendEmail.map(async (email) => {
          const userData = await fetchUserFromDatabase(email);
          return userData || null;
        })
      );
      setFriends(friendsData.filter((user): user is user => user !== null));
    };

    fetchFriends();
  }, [friendEmail]);

  // 🕐 Loading state
  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  const goToMessages = (
    friendId: string | undefined,
    chatId: string | undefined
  ) => {
    if (!friendId || !chatId) return;
    router.push(`/Chat/${chatId}/${friendId}`);
  };

  return (
    <div>
      <div className="bg-red-700 px-4 py-2">
        <p className="text-[1.3em]">Chats</p>
      </div>

      {chats?.length > 0 ? (
        <div>
          {chats.map((chat, index) => {
            const friendId = chat.members.find(
              (member) => member !== currentUser?.email
            );
            const friend = friends.find((u) => u.email === friendId);
            const lastMessage = chat.lastMessage || "No messages yet";

            return (
              <div
                key={index}
                className="border px-4 py-2 cursor-pointer"
                onClick={() => goToMessages(friend?.id, chat.id)}
              >
                <div className="flex gap-2 items-center">
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
                      {friend?.name || "Loading..."}
                    </p>
                    <p className="text-gray-500 text-[0.8em] italic truncate w-[200px] overflow-hidden whitespace-nowrap">
                      {typeof lastMessage === "string"
                        ? lastMessage
                        : lastMessage?.text || "No messages yet"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full h-[70vh] flex justify-center items-center">
          <div>
            <Image src={empty} height={300} width={300} alt="empty" />
            <p className="text-center">make some friends and start chatting!</p>
          </div>
        </div>
      )}

      <ChatNavFooter />
    </div>
  );
};

export default ChatBody;
