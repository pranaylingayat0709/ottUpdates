"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The detail view (dialog, reviews, verdict cards, cast, diary...) is a large
// chunk that most visitors never open. Loading it on demand keeps it out of
// the home page's initial JS; hovering/focusing a card preloads it so the
// first open still feels instant.
const loader = () => import("@/components/TitleModal").then((m) => m.TitleModal);
const Inner = dynamic(loader, { ssr: false });

export function preloadTitleModal() {
  void loader();
}

export function TitleModal(props: { titleId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [everOpened, setEverOpened] = useState(props.open);
  useEffect(() => {
    if (props.open) setEverOpened(true);
  }, [props.open]);
  return everOpened ? <Inner {...props} /> : null;
}
