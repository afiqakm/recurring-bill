"use client";

import { usePathname, useRouter } from "next/navigation";

import { Button, Card } from "@heroui/react";
import {Separator} from "@heroui/react";
import styles from "./NavMenu.module.css";
import { LuClipboardList, LuRepeat, LuUser } from "react-icons/lu";
import React from "react";
import { cn } from "@/utils/cn";

const LINKS = [
  { href: "/", label: "Recurring", icons: <LuRepeat  /> },
  { href: "/categories", label: "Categories", icons: <LuClipboardList /> },
  { href: "/profile", label: "Profile", icons: <LuUser  /> },
];

export function NavMenu() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  if(pathname === "/login") {
    return null;
  }

  return(
    <div className={styles.container}>
      {LINKS.map((item, idx) => {
        const active = pathname === item.href;

        if(LINKS.length - 1 === idx) {
          return(
            <div key={item.href} className={cn(styles.nav, active && styles.active)}  onClick={() => router.push(item.href)}>
            {item.icons}
            <span className={styles.logoText}>{item.label}</span>
          </div>
          )
        }
        return (
          <React.Fragment key={item.href}>
          <div className={cn(styles.nav, active && styles.active)}  onClick={() => router.push(item.href)}>
            {item.icons}
            <span className={styles.logoText}>{item.label}</span>
          </div>
          <Separator orientation="vertical" variant="tertiary" className="h-full " />

          </React.Fragment>
        )}
      )}
      </div>

  )
}
