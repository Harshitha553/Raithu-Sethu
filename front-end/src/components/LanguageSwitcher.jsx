import { useState } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher({ variant = "sidebar" }) {
  const { lang, changeLanguage, SUPPORTED_LANGUAGES, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const current = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];

  if (variant === "sidebar") {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="sidebar-link w-full text-left"
        >
          <Globe size={17} />
          <span className="flex-1">{current.native}</span>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
              {SUPPORTED_LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => { changeLanguage(l.code); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${l.code === lang ? 'bg-green-600/20 text-green-400' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  <span className="text-xs opacity-70 w-6">{l.code.toUpperCase()}</span>
                  <span>{l.native}</span>
                  <span className="text-xs text-slate-500 ml-auto">{l.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
        title={t("lang.label")}
      >
        <Globe size={20} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden animate-scale-in">
            {SUPPORTED_LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { changeLanguage(l.code); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${l.code === lang ? 'bg-green-50 text-green-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span className="text-xs opacity-60 w-5">{l.code.toUpperCase()}</span>
                <span>{l.native}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
