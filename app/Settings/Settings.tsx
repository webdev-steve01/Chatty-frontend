"use client";
import ChatNavFooter from "../(components)/ChatNavFooter";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { user } from "../(interface)/interface";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";

const handleProfilePic = async (id: string, url: string) => {
  if (!id || !url) {
    console.error("Invalid user ID or image URL");
    return;
  }

  try {
    const userRef = doc(db, "allUsers", id); // Reference to user document
    await updateDoc(userRef, { profilePic: url }); // Update Firestore

    console.log("Profile picture updated successfully in Firestore!");
  } catch (error) {
    console.error("Error updating profile picture:", error);
  }
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
      const userData = { id: doc.id, ...doc.data() }; // Add Firestore document ID because it does not give you if it isn't requested

      return userData as user;
    } else {
      console.log("No user found with this email.");
    }
  } catch (err) {
    console.log(err);
  }
};

function Settings() {
  const [currentUser, setCurrentUser] = useState<user>();
  const [email, setEmail] = useState<string | null>();
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState("");

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "my_preset"); // Replace with your Cloudinary preset

    try {
      // Upload to Cloudinary
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dlpty7kky/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.secure_url) {
        setImageUrl(data.secure_url);
        console.log("Image URL:", imageUrl); // Log the image URL

        // Update Firestore with new image URL
        if (currentUser?.id) {
          await handleProfilePic(currentUser.id, data.secure_url);
          setCurrentUser((prev) =>
            prev ? { ...prev, profilePic: data.secure_url } : prev
          );
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

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
  //! Fetch logged-in user
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

  useEffect(() => {
    if (!email) return;
    fetchUserFromDatabase(email).then((user) => setCurrentUser(user));
  }, [email]);

  // !log out function
  const handleLogOut = async () => {
    await signOut(auth);
    router.push("../");
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }
  return (
    <section>
      <div className="h-[90vh] flex justify-center items-center">
        <div>
          <div className="flex flex-col items-center">
            <div
              className=" w-[100px] h-[100px] rounded-full "
              style={{
                backgroundImage: currentUser?.profilePic
                  ? `url(${currentUser?.profilePic})`
                  : `url(https://res.cloudinary.com/dlpty7kky/image/upload/v1742671118/istockphoto-1495088043-612x612_dkfloi.jpg)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            ></div>
            <div className="">
              <input
                type="file"
                id="fileInput"
                accept="image/*"
                className="hidden" // Hides the default input
                onChange={(e) => handleImageUpload(e)}
              />
              <label
                htmlFor="fileInput"
                className="cursor-pointer bg-[#bc6b25d6] text-white px-4 py  rounded-md hover:bg-[#bc6b25a9]"
              >
                Change Image
              </label>
            </div>
          </div>
          <div>
            <p>
              <span className="font-semibold">username</span> {""}
              {currentUser?.name ? currentUser.name : "Loading..."}
            </p>
            <p>
              <span className="font-semibold">email</span>:{" "}
              {currentUser?.email ? currentUser.email : "Loading..."}
            </p>
            <p>
              <span className="font-semibold">user Id</span>:{" "}
              {currentUser?.id ? currentUser.id : "Loading..."}
            </p>
          </div>
          <div className="py-2">
            <button type="button" className="w-full" onClick={handleLogOut}>
              Log Out
            </button>
          </div>
        </div>
      </div>
      <ChatNavFooter />
    </section>
  );
}

export default Settings;
