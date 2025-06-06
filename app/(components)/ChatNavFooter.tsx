"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import settings_inactive from "@/public/settings-inactive.svg";
import settings_active from "@/public/settings-active.svg";
import addFriends_inactive from "@/public/add-friend-inactive.svg";
import addFriends_active from "@/public/add-friend-active.svg";
import chats_active from "@/public/chats-active.svg";
import chats_inactive from "@/public/chats-inactive.svg";

function ChatNavFooter() {
  const pathname = usePathname(); // Get current route

  return (
    <div className="small_nav_container fixed left-0 right-0 bottom-[20px] w-full">
      <section className="flex  w-full  justify-between px-6 bg-[#BC6C25] py-2 small_nav">
        <Link
          href="/Chat"
          className={`flex flex-col items-center ${
            pathname === "/Chat" ? "bg-[#bc6b25d6]" : ""
          }`}
        >
          <Image
            alt="chats"
            src={pathname === "/Chat" ? chats_active : chats_inactive}
            width={40}
            height={40}
          />
        </Link>
        <Link
          href="/Chat/People"
          className={`flex flex-col items-center ${
            pathname === "/Chat/People" ? "bg-[#bc6b25d6]" : ""
          }`}
        >
          <Image
            alt="add-friends"
            src={
              pathname === "/Chat/People"
                ? addFriends_active
                : addFriends_inactive
            }
            width={40}
            height={30}
          />
        </Link>
        <Link
          href="/Settings"
          className={`flex flex-col items-center ${
            pathname === "/Settings" ? "bg-[#bc6b25d6]" : ""
          }`}
        >
          <Image
            alt="settings"
            src={pathname === "/Settings" ? settings_active : settings_inactive}
            width={40}
            height={30}
          />
        </Link>
      </section>
    </div>
  );
}

export default ChatNavFooter;
