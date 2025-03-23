"use client";
import ChatNavFooter from "../(components)/ChatNavFooter";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { user } from "../(interface)/interface";

const handleProfilePic = async (id: string, url: string) => {
  try {
    const response = await fetch(
      "https://chatty-0o87.onrender.com/api/users/upload",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: id,
          profilePic: url, // ✅ Match backend field name
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error updating profile picture:", data.error);
      return;
    }

    console.log("Profile picture updated:", data);
  } catch (err) {
    console.error("Failed to save profile picture:", err);
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
      console.log("Cloudinary Upload Response:", data);

      if (data.secure_url) {
        console.log("Uploaded Image URL:", data.secure_url);
        setImageUrl(data.secure_url);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  useEffect(() => {
    const updateProfilePic = async () => {
      if (!imageUrl) {
        console.error("Error: Image URL is missing!");
        return;
      }

      if (!currentUser?._id) {
        console.error("Error: User ID is missing!");
        return;
      }

      console.log("Updating profile picture with:", {
        userId: currentUser?._id,
        profilePic: imageUrl,
      });

      await handleProfilePic(currentUser?._id, imageUrl);

      // Fetch the updated user profile after the update
      try {
        const res = await fetch(
          `https://chatty-0o87.onrender.com/api/users/email/${email}`
        );
        if (!res.ok) throw new Error("Failed to fetch updated user");
        setCurrentUser(await res.json());
      } catch (err) {
        console.error("Error fetching updated user:", err);
      }
    };

    if (imageUrl && currentUser?._id) {
      updateProfilePic();
    }
  }, [imageUrl, currentUser?._id, email]);

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
      <div className="border flex gap-1 items-end">
        <div
          className="border relative w-[100px] h-[100px] rounded-full "
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
            className="cursor-pointer bg-[#bc6b25d6] text-white px-4  rounded-md hover:bg-blue-600"
          >
            Change Image
          </label>
        </div>
      </div>
      <div>
        <p>
          username: {""}
          {currentUser?.username ? currentUser.username : "Loading..."}
        </p>
        <p>email: {currentUser?.email ? currentUser.email : "Loading..."}</p>
        <p>user Id: {currentUser?._id ? currentUser._id : "Loading..."}</p>
      </div>
      <button type="button" onClick={handleLogOut}>
        Log Out
      </button>
      <ChatNavFooter />
    </section>
  );
}

export default Settings;
