"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { useUser } from "../(context)/UserContext";
import { FirebaseError } from "firebase/app";

function SignIn() {
  const [emailAddr, setEmailAddr] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  // const [err, setErr] = useState<string>("");
  const { setEmail } = useUser();
  const router = useRouter();

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailAddr(e.target.value);
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoggingIn(true);
    if (emailAddr === "" || password === "") {
      alert("Please fill all the fields");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, emailAddr, password).then(() => {
        setEmail(emailAddr);
        setEmailAddr("");
        setPassword("");
        router.push("/Chat");
      });
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

      setLoggingIn(false);
    }
  };
  return (
    <>
      <form action="" className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="email"
          value={emailAddr}
          onChange={(e) => handleEmail(e)}
          placeholder="Enter Your Email"
          name=""
          className="w-full"
          id=""
        />

        <input
          type="password"
          placeholder="Enter Your Password"
          name=""
          id=""
          className="w-full"
          onChange={(e) => handlePassword(e)}
          value={password}
        />
        <button type="submit">{loggingIn ? "Logging In..." : "Sign In"}</button>
      </form>
    </>
  );
}

export default SignIn;
