"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { user } from "../(interface)/interface";
import { useUser } from "../(context)/UserContext";

function SignIn() {
  const [emailAddr, setEmailAddr] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { email, setEmail } = useUser();
  const router = useRouter();

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailAddr(e.target.value);
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (emailAddr === "" || password === "") {
      alert("Please fill all the fields");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, emailAddr, password).then(
        (user) => {
          setEmail(emailAddr);
          alert(email);
          setEmailAddr("");
          setPassword("");
          router.push("/Chat");
        }
      );
    } catch (error) {
      console.error(error);
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
        <button type="submit"> sign in</button>
      </form>
    </>
  );
}

export default SignIn;
