"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase";
// import io from "socket.io-client";
import { user, chats } from "../(interface)/interface";
import ChatNavFooter from "../(components)/ChatNavFooter";
import Image from "next/image";
import empty from "@/public/undraw_back-home_3dun.svg";
import { collection, query, where, getDocs } from "firebase/firestore";

// const socket = io("http://localhost:8080");

type lastMessageType = {
  _id: string;
  chatId: string;
  sender: string;
  text: string;
  time: string;
  __v: number;
};

const fetchUserFromDatabase = async (email: string) => {
  try {
    const userRef = collection(db, "allUsers");
    const q = query(userRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        console.log("User Found:", doc.id, doc.data());
      });
      const doc = querySnapshot.docs[0];
      const userData = { id: doc.id, ...doc.data() }; // Add Firestore document ID
      return userData as user;
    } else {
      console.log("No user found with this email.");
    }
  } catch (err) {
    console.log(err);
  }
};

const fetchChats = async (userId: string) => {
  try {
    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", userId)
    );
    const querySnapshot = await getDocs(q);
    const chats = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        createdAt: data.createdAt.toDate?.() ?? new Date(), // ensure Date
        updatedAt: data.updatedAt.toDate?.() ?? new Date(),
        lastMessage: data.lastMessage ?? null,
        members: data.members ?? [],
      } as chats;
    });

    console.log("User Chats:", chats);
    return chats;
  } catch (err) {
    console.log("Error fetching chats:", err);
  }
};
function ChatBody() {
  const [chats, setChats] = useState<chats[]>([]);
  const [lastMessages, setLastMessages] = useState<
    Record<string, lastMessageType | null>
  >({});
  const [friends, setFriends] = useState<Array<user>>([]);
  const [friendEmail, setFriendEmail] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<user>();
  const [email, setEmail] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(true);
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
  }, [router]);

  // Fetch user details
  useEffect(() => {
    if (!email) return;
    // fetchLastMessageFromDatabase(email);
    fetchUserFromDatabase(email).then((userData) => {
      if (userData) {
        setCurrentUser(userData);
      }
    });
  }, [email]);

  useEffect(() => {
    setLastMessages({});
  }, []);
  useEffect(() => {
    if (currentUser) {
      fetchChats(currentUser?.email).then((chatsData) =>
        setChats(chatsData ?? [])
      );
    }
  }, [currentUser]);

  // Fetch chats from the server
  useEffect(() => {
    if (!chats.length || !currentUser?.email) return;

    const filterChatMembers = (chats: chats[], myEmail: string) => {
      const emails: string[] = chats
        .map((chat) => chat.members.find((email) => email !== myEmail))
        .filter((email): email is string => Boolean(email)); // Type assertion

      setFriendEmail(emails);
      console.log("Friend Emails:", emails);
    };

    filterChatMembers(chats, currentUser.email);
  }, [chats, currentUser]);

  useEffect(() => {
    if (friendEmail.length === 0) return;

    const fetchFriends = async () => {
      const friendsData = await Promise.all(
        friendEmail.map(async (email) => {
          const userData = await fetchUserFromDatabase(email);
          return userData || null;
        })
      );

      // TypeScript-safe filtering of null values
      setFriends(friendsData.filter((user): user is user => user !== null));
    };

    fetchFriends();
  }, [friendEmail]);

  useEffect(() => {
    if (friends) console.log(friends);
  }, [friends]);

  // Fetch last messages for each chat

  // Sorting chats based on last update
  // useEffect(() => {
  //   if (chats.length > 0) {
  //     setChats(
  //       [...chats].sort(
  //         (a, b) =>
  //           new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  //       )
  //     );
  //   }
  // }, [lastMessages]);

  // Redirect if still authenticating
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
    if (!friendId) return;
    router.push(`/Chat/${chatId}/${friendId}`);
  };

  return (
    <div className="">
      <div className="bg-red-700 px-4 py-2">
        <p className="text-[1.3em]">Chats</p>
      </div>
      {chats?.length > 0 ? (
        <div>
          {chats.map((chat, index) => {
            // Get the friend's ID (the member that is NOT the current user)
            const friendId = chat.members.find(
              (member: string) => member !== currentUser?.email
            );
            const friend = friends.find(
              (user: user) => user.email === friendId
            ); // Find the friend in the friends array
            const lastMessage =
              lastMessages[chat.id]?.text || "No messages yet"; // Get last message

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
                      {lastMessage}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-[100%] h-[70vh] flex justify-center items-center">
          <div>
            <Image src={empty} height={300} width={300} alt="empty" />
            <p className="text-center">make some friends and start chatting!</p>
          </div>
        </div>
      )}

      <ChatNavFooter />
    </div>
  );
}

export default ChatBody;
