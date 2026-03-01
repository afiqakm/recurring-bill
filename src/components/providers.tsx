"use client";

import { Toast } from "@heroui/react";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
      <Toast.Provider placement="bottom end" />
    </>
  );
}
