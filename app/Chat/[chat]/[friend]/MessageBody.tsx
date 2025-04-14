"use client";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { useRouter, useParams } from "next/navigation";
// import { useParams } from "next/navigation";
import { user, Message } from "@/app/(interface)/interface";

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

const fetchUserById = async (userId: string) => {
  try {
    const userRef = doc(db, "allUsers", userId); // Reference the document
    const userSnap = await getDoc(userRef); // Get the document

    if (userSnap.exists()) {
      // const data = userSnap.data();
      return { id: userSnap.id, ...userSnap.data() } as user;
    } else {
      console.log("User not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

const fetchMessagesRealTime = (
  chatId: string,
  setMessages: (messages: Message[]) => void
) => {
  try {
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc") // Sort messages in ascending order
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: Message[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp,
          ...data, // In case there are other properties you want to include
        };
      });
      setMessages(messages);
    });

    return unsubscribe; // Return the unsubscribe function to stop listening when needed
  } catch (error) {
    console.error("Error fetching messages:", error);
    return () => {};
  }
};

// updating last message
const updateLastMessage = (message: Message) => {
  const chatRef = doc(db, "chats", message.chatId); // Reference the chat document
  updateDoc(chatRef, {
    lastMessage: message.text,
    lastSender: message.senderId,
    lastTimestamp: message.timestamp,
  })
    .then(() => {
      console.log("Last message updated successfully!");
    })
    .catch((error) => {
      console.error("Error updating last message:", error);
    });
};

function MessageBody() {
  const route = useRouter();
  const params = useParams();
  const [text, setText] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<user | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  // const [lastMessage, setLastMessage] = useState<Message | undefined>();
  const [friend, setFriend] = useState<user | null>(null); // State to store friend data
  const friendId = Array.isArray(params.friend)
    ? params.friend[0]
    : params.friend;
  const chatId = Array.isArray(params.chat) ? params.chat[0] : params.chat;

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmail(user.email || "");
      } else {
        console.log("User is not logged in");
        route.push("../../");
      }
    });
  }, [route]);

  useEffect(() => {
    if (email) {
      fetchUserFromDatabase(email).then((user) => {
        if (user) {
          setCurrentUser(user);
        }
      });
    }
  }, [email]);

  useEffect(() => {
    if (!chatId) return;

    const unsubscribe = fetchMessagesRealTime(chatId, setMessages);

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [chatId]);

  useEffect(() => {
    if (!friendId) return; // Ensure friendId is available
    fetchUserById(friendId).then((user) => {
      if (user) {
        setFriend(user);
      }
    });
  });
  // if (friend) console.log(friend);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return; // Prevent empty messages

    if (currentUser === null) return;
    try {
      // Add a new message document to Firestore
      if (!chatId) {
        alert("complex error");
        return;
      }
      const message: Message = {
        text,
        senderId: currentUser.id,
        chatId,
        timestamp: new Date(), // Firebase timestamp
      };
      await addDoc(collection(db, "messages"), message);
      await addDoc(collection(db, "messages"), message);
      updateLastMessage(message); // immediately update last message

      setText(""); // Clear input after sending
      console.log("Message sent!");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };
  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };
  return (
    <div className="flex flex-col">
      <div className="flex gap-4 items-center bg-red-700 w-full px-4 py-2 fixed">
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
        <p>{friend?.name}</p>
      </div>
      <div className="absolute bottom-0 w-full border h-[90vh]">
        <div className="w-full h-[80vh] overflow-auto justify-self-end">
          {messages.map((message: Message, index: number) => (
            <div key={index} className="p-2 my-1 border-b">
              <strong>
                {message.senderId === currentUser?.id ? "You" : friend?.name}:
              </strong>{" "}
              {message.text}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="fixed bottom-[10px] flex w-full gap-2 px-4"
        >
          <input
            type="text"
            name=""
            onChange={(e) => handleText(e)}
            value={text}
            placeholder="Enter Text"
            className="w-full"
            id=""
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default MessageBody;
