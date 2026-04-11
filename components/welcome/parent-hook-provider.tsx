"use client";

import { useState, useCallback } from "react";
import { HeroSection } from "./hero-section";
import { ParentModal } from "./parent-modal";
import { ParentBubble } from "./parent-bubble";
import { trackParentHookClicked, trackParentRegistrationStarted } from "@/lib/analytics";

export function ParentHookProvider() {
  const [modalOpen, setModalOpen] = useState(false);
  const [parentSource, setParentSource] = useState(false);

  const openModal = useCallback((trigger: "hero_button" | "floating_bubble") => {
    trackParentHookClicked(trigger);
    setModalOpen(true);
  }, []);

  const handleRegister = useCallback(() => {
    trackParentRegistrationStarted();
    setModalOpen(false);
    setParentSource(true);
  }, []);

  const handleParentFormOpened = useCallback(() => {
    setParentSource(false);
  }, []);

  return (
    <>
      <HeroSection
        onParentHookClick={() => openModal("hero_button")}
        parentSource={parentSource}
        onParentFormOpened={handleParentFormOpened}
      />
      <ParentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onRegister={handleRegister}
      />
      {!modalOpen && (
        <ParentBubble onClick={() => openModal("floating_bubble")} />
      )}
    </>
  );
}
