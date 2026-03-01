'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button, toast } from "@heroui/react";

import styles from "./Profile.module.css";

const Profile = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      toast.success("Logged out");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : "Failed to logout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.layout}>
     <Button fullWidth variant="danger" onClick={() => onLogout().catch(() => undefined)} isDisabled={loading}>
            {loading ? "Logging out..." : "Logout"}
          </Button>
    </div>
  );
};

export default Profile;
