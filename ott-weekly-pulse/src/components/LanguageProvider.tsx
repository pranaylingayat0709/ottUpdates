"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { type Locale, translate } from "@/lib/translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}
const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("owp-locale") as Locale | null;
    if (stored && ["en", "hi", "mr"].includes(stored)) setLocaleState(stored);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    window.localStorage.setItem("owp-locale", l);
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: (key: string) => translate(locale, key) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
