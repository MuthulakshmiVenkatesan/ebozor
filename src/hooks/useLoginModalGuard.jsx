"use client";

import { useCallback, useState } from "react";
import LoginModal from "@/components/Auth/LoginModal";
import { isLogin } from "@/utils";

/**
 * Opens {@link LoginModal} when the user is not logged in; otherwise runs the callback.
 * Render `loginModal` once near the root of the same component.
 */
export function useLoginModalGuard() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isMailSentOpen, setIsMailSentOpen] = useState(false);

  const openSentMailModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setIsMailSentOpen(true);
  }, []);

  const requireLogin = useCallback((fn) => {
    if (!isLogin()) {
      setIsLoginModalOpen(true);
      return false;
    }
    if (typeof fn === "function") fn();
    return true;
  }, []);

  const loginModal = (
    <LoginModal
      IsLoginModalOpen={isLoginModalOpen}
      setIsLoginModalOpen={setIsLoginModalOpen}
      setIsRegisterModalOpen={setIsRegisterModalOpen}
      IsMailSentOpen={isMailSentOpen}
      setIsMailSentOpen={setIsMailSentOpen}
      IsRegisterModalOpen={isRegisterModalOpen}
      openSentMailModal={openSentMailModal}
    />
  );

  return { requireLogin, loginModal };
}
