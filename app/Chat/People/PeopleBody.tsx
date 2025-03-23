"use client";
import { user } from "@/app/(interface)/interface";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import Image from "next/image";
import plus from "@/public/plus-svgrepo-com.svg";
import tick from "@/public/tick-svgrepo-com.svg";
import ChatNavFooter from "@/app/(components)/ChatNavFooter";

type chatProp = {
  _id: string;
  members: string[];
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

// * Function to fetch users by name
const fetchUsersFromDatabase = async (people: string): Promise<user[]> => {
  try {
    const res = await fetch(
      `https://chatty-0o87.onrender.com/api/users/${people}`
    );
    if (!res.ok) {
      console.log("Error fetching users:");
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
};

const fetchChatsFromDatabase = async (id: string): Promise<chatProp[]> => {
  try {
    const res = await fetch(`https://chatty-0o87.onrender.com/api/chats/${id}`);
    if (!res.ok) {
      console.log("Failed to fetch chats");
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching chats:", err);
    return [];
  }
};

// * Function to add a chat
const addDataToDatabase = async (
  userOne: string | undefined,
  userTwo: string | undefined
) => {
  try {
    await fetch("https://chatty-0o87.onrender.com/api/chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userOne, userTwo }),
    });

    return true; // Return true on success
  } catch (err) {
    console.log("Error adding chat:", err);
    return false; // Return false on error
  }
};

function PeopleBody() {
  const [friend, setFriend] = useState<user[]>([]);
  const [person, setPerson] = useState<string>("");
  const [email, setEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<user | null>(null);
  const [prevChats, setPrevChats] = useState<chatProp[]>([]);

  // * Fetch users by name as they are being typed
  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchUsersFromDatabase(person);
      setFriend(data);
    };
    fetchData();
  }, [person]);

  // * Fetch the current user
  useEffect(() => {
    if (!email) return;
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://chatty-0o87.onrender.com/api/users/email/${email}`
        );
        const data = await res.json();
        setCurrentUser(data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [email]);

  // * Firebase auth listener
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmail(user.email);
      }
    });
  }, []);

  // * Fetch previous chats
  useEffect(() => {
    if (!currentUser?._id) return;
    const fetchChats = async () => {
      const data = await fetchChatsFromDatabase(currentUser._id);
      setPrevChats(data);
    };
    fetchChats();
  }, [currentUser]);

  // * Function to handle adding a friend
  const handleFriends = async (personId: string) => {
    if (!currentUser?._id) return;

    const chatExists = prevChats.some((chat) =>
      chat.members.includes(personId)
    );
    if (chatExists) {
      alert("Chat already exists!");
      return;
    }

    // Add chat to database
    const success = await addDataToDatabase(currentUser._id, personId);

    if (success) {
      // Refetch chats immediately to update UI
      const updatedChats = await fetchChatsFromDatabase(currentUser._id);
      setPrevChats(updatedChats);
    }
  };

  // * Function to handle user input for searching friends
  const handlePerson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerson(e.target.value);
  };

  // * JSX for available friends
  const peopleElement = friend
    .slice(0, 10)
    .filter((person: user) => person._id !== currentUser?._id)
    .map((person: user, index: number) => {
      const isChatExisting = prevChats.some((chat) =>
        chat.members.includes(person._id)
      );

      return (
        <div key={index} className="cursor-pointer">
          <section className="flex justify-between items-center px-6 py-2">
            <div className="flex gap-5">
              <section className="rounded-[50%] bg-gray-400 w-[40px] h-[40px]"></section>
              <section>
                <p className="font-semibold">{person.username}</p>
                <p className="text-[0.8em]">Add friend to start chatting</p>
              </section>
            </div>
            <section onClick={() => handleFriends(person._id)}>
              <Image
                src={isChatExisting ? tick : plus}
                height={20}
                width={20}
                alt="status"
              />
            </section>
          </section>
        </div>
      );
    });

  return (
    <div>
      <section className="text-[#283618] bg-[#BC6C25] text-[1.5em] font-semibold px-6 py-2">
        <p>Search friends and start a chat</p>
      </section>
      <section className="flex justify-center text-[#283618] py-2">
        <input
          type="text"
          className="m-auto w-[90%] border-[#283618]"
          placeholder="Search"
          onChange={handlePerson}
        />
      </section>
      <section className="flex flex-col gap-2 h-[80vh] overflow-x-hidden friends overflow-scroll">
        {friend.length > 0 ? (
          peopleElement
        ) : (
          <p className="mx-auto italic text-gray-400">No such person</p>
        )}
      </section>
      <section>
        <ChatNavFooter />
      </section>
    </div>
  );
}

export default PeopleBody;
