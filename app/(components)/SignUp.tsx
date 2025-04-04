"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { FirebaseError } from "firebase/app";

function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState<boolean>(false);

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSigningIn(true);
    if (name === "" || email === "" || password === "") {
      alert("Please fill all the fields");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password).then(
        (userCredential) => {
          const user = userCredential.user;
          console.log(user);
          addDoc(collection(db, `allUsers`), {
            name,
            email,
            createdAt: new Date(),
          });
          setEmail("");
          setPassword("");
          setName("");
          setSigningIn(false);
          alert("User Created Successfully, click on sign in");
        }
      );
    } catch (error: unknown) {
      console.error(error);

      // Firebase errors have a `.code` property
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "auth/email-already-in-use":
            alert("This email is already in use.");
            break;
          case "auth/invalid-email":
            alert("The email address is invalid.");
            break;
          case "auth/weak-password":
            alert("Password should be at least 6 characters.");
            break;
          case "auth/network-request-failed":
            alert("Network error. Please check your connection.");
            break;
          default:
            alert("Something went wrong. Please try again.");
            break;
        }
      }

      setSigningIn(false);
    }
  };

  return (
    <>
      <form action="" className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            onChange={(e) => handleName(e)}
            value={name}
            placeholder="Enter Your Name"
            name=""
            className="w-full"
            id=""
          />
        </div>
        <div>
          <input
            type="email"
            onChange={(e) => handleEmail(e)}
            placeholder="Enter Your Email"
            value={email}
            name=""
            id=""
            className="w-full"
          />
        </div>
        <div>
          <input
            type="password"
            onChange={(e) => handlePassword(e)}
            placeholder="Enter Your Password"
            name=""
            value={password}
            id=""
            className="w-full"
          />
        </div>

        <button type="submit">{signingIn ? "Signing In..." : "Sign Up"}</button>
      </form>
    </>
  );
}

export default SignUp;
