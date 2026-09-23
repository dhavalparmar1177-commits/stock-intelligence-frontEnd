import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en, { Dict } from "./dict.en";
import hi from "./dict.hi";
import gu from "./dict.gu";
import { Lang, LANGS, getInitialLang } from "./lang";

const DICTS: Record<Lang, Dict> = { en, hi, gu };

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const LanguageContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: en });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => setLangState(LANGS.some((x) => x.code === l) ? l : "en");
  return <LanguageContext.Provider value={{ lang, setLang, t: DICTS[lang] }}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext);
