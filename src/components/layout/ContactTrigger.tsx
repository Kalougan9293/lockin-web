"use client";

import { useState, type ReactNode } from "react";

import { ContactModal } from "@/components/dashboard/ContactModal";

type ContactTriggerProps = {
  className?: string;
  children?: ReactNode;
};

export function ContactTrigger({
  className,
  children = "Contact",
}: ContactTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
