"use client";
import { user, chats } from "@/app/(interface)/interface";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import Image from "next/image";
import plus from "@/public/plus-svgrepo-com.svg";
import tick from "@/public/tick-svgrepo-com.svg";
import ChatNavFooter from "@/app/(components)/ChatNavFooter";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { User } from "firebase/auth";

const fetchCurrentUserFromDatabase = async (email: string) => {
  try {
    const userRef = collection(db, "allUsers");
    const q = query(userRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        console.log("User Found:", doc.id, doc.data());
      });
      const userData = querySnapshot.docs[0].data();
      return userData as user;
    } else {
      console.log("No user found with this email.");
    }
  } catch (err) {
    console.log(err);
  }
};

// * Function to fetch users by name
const fetchUsersFromDatabase = async (people: string): Promise<user[]> => {
  try {
    let q;
    const usersRef = collection(db, "allUsers");
    if (people.trim() !== "") {
      q = query(usersRef, where("name", "==", people));
    } else {
      q = query(usersRef);
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name ?? "",
        email: data.email ?? "",
        password: data.password ?? "",
        profilePic: data.profilePic ?? "",
        isOnline: String(data.isOnline ?? "false"),
        createdAt:
          data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return [];
  }
};

const fetchChatsFromDatabase = async (userId: string) => {
  try {
    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", userId)
    );
    const querySnapshot = await getDocs(q);
    const chats = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("User Chats:", chats);
    return chats as chats[];
  } catch (err) {
    console.log("Error fetching chats:", err);
  }
};

// * Function to add a chat
const addDataToDatabase = async (
  userOne: string | undefined,
  userTwo: string | undefined
) => {
  try {
    const chatRef = collection(db, "chats");
    const newChat = {
      members: [userOne, userTwo],
      lastMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await addDoc(chatRef, newChat);
    console.log("Chat added successfully");
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
  const [prevChats, setPrevChats] = useState<chats[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // * Fetch the current user
  useEffect(() => {
    if (!email) return;
    fetchCurrentUserFromDatabase(email).then((userData) => {
      if (userData) {
        setCurrentUser(userData);
      }
    });
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
    if (!currentUser?.email) return;
    const fetchChats = async () => {
      const data = await fetchChatsFromDatabase(currentUser.email);
      if (data) setPrevChats(data);
    };
    fetchChats();
  }, [currentUser]);

  // * Function to handle adding a friend
  const handleFriends = async (personId: string) => {
    if (!currentUser?.email) return;

    const chatExists = prevChats.some((chat) =>
      chat.members.includes(personId)
    );
    if (chatExists) {
      alert("Chat already exists!");
      return;
    }

    // Add chat to database
    const success = await addDataToDatabase(currentUser.email, personId);

    if (success) {
      // Refetch chats immediately to update UI
      const updatedChats = await fetchChatsFromDatabase(currentUser.email);
      if (updatedChats) setPrevChats(updatedChats);
    }
  };

  // * Function to handle user input for searching friends
  const handlePerson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerson(e.target.value);
  };

  // ! Authentication function
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

  // !search function
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchLoading(true);
    if (!person.trim()) return; // Prevent empty input
    const fetchData = async () => {
      await fetchUsersFromDatabase(person)
        .then((data) => setFriend(data))
        .catch((err) => console.log(err))
        .finally(() => setSearchLoading(false));
    };
    fetchData();
    setPerson("");
  };

  // * JSX for available friends
  // Redirect if still authenticating
  if (loading === true) {
    return (
      <div className="h-[80vh] flex items-center justify-center" key={1}>
        <div className="loader"></div>
      </div>
    );
  }
  const peopleElement = friend
    .filter((person: user) => person.email !== currentUser?.email)
    .map((person: user, index: number) => {
      const isChatExisting = prevChats.some((chat) =>
        chat.members.includes(person.email)
      );

      return (
        <div key={index} className="cursor-pointer">
          <section className="flex justify-between items-center px-6 py-2">
            <div className="flex gap-5">
              <div
                className="w-[50px] h-[50px] rounded-full"
                style={{
                  backgroundImage: person.profilePic
                    ? `url(${person.profilePic})`
                    : `url(https://res.cloudinary.com/dlpty7kky/image/upload/v1742671118/istockphoto-1495088043-612x612_dkfloi.jpg)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
              <section>
                <p className="font-semibold">{person.name}</p>
                <p className="text-[0.8em]">Add friend to start chatting</p>
              </section>
            </div>
            <section onClick={() => handleFriends(person.email)}>
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
      <section className="text-[#283618] bg-[#BC6C25] text-[1.3em] font-semibold px-6 py-2">
        <p>Search friends and start a chat</p>
      </section>
      <section className="flex justify-center text-[#283618] py-2">
        <form
          action=""
          onSubmit={(e) => handleSubmit(e)}
          className="flex gap-2   w-full px-6"
        >
          <input
            type="text"
            className="m-auto w-full border-[#283618]"
            placeholder="e.g andre"
            value={person}
            onChange={handlePerson}
          />
          <button type="submit">search</button>
        </form>
      </section>
      <section className="flex flex-col gap-2 h-[80vh] overflow-x-hidden friends overflow-scroll">
        {searchLoading ? (
          <div className="h-[100%] flex items-center justify-center">
            <div className="loader"></div>
          </div>
        ) : friend.length > 0 ? (
          peopleElement
        ) : (
          <p className="mx-auto italic text-gray-400">List is empty</p>
        )}
      </section>
      <section>
        <ChatNavFooter />
      </section>
    </div>
  );
}

export default PeopleBody;
