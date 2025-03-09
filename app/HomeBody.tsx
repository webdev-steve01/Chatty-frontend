"use client";
import React, { useEffect, useState } from "react";
import SignIn from "./(components)/SignIn";
import SignUp from "./(components)/SignUp";
function HomeBody() {
  const [prevUser, setPrevUser] = useState<boolean>(false);

  const handlePrevUser = () => {
    if (prevUser) {
      setPrevUser(false);
    } else {
      setPrevUser(true);
    }
  };
  return (
    <div className="m-auto p-4">
      <section className="">
        <p className="text-center text-[#283618] font-semibold text-[1.4em]">
          Sign up to ChatApp Now!
        </p>
        <div className="py-4">{prevUser ? <SignIn /> : <SignUp />}</div>
        <p className="text-[#283618]">
          Already have an account?{" "}
          <span
            className="cursor-pointer text-[#606C38]"
            onClick={handlePrevUser}
          >
            {prevUser ? "sign up" : "sign in"}
          </span>
        </p>
      </section>
    </div>
  );
}

export default HomeBody;
