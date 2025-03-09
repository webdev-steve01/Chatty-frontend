"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";

const addDataToDatabase = async (
  name: string,
  email: string,
  password: string
) => {
  try {
    await fetch("http://localhost:8080/api/users", {
      method: "POST", // ✅ Set method to POST
      headers: {
        "Content-Type": "application/json", // ✅ Tell the server it's JSON data
      },
      body: JSON.stringify({
        username: name,
        email: email,
        password: password,
      }),
    })
      .then((response) => response.json()) // ✅ Convert response to JSON
      .then((data) => console.log("Chat Created:", data)) // ✅ Handle response
      .catch((error) => console.error("Error:", error));
  } catch (err) {
    console.log(err);
  }
};

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
          addDataToDatabase(name, email, password);
          setEmail("");
          setPassword("");
          setName("");
          setSigningIn(false);
          alert("User Created Successfully, click on sign in");
        }
      );
    } catch (error) {
      console.error(error);
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
