import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center animate-fade-in">
      <img src="/logo.jpeg" alt="Raithu Sethu" className="w-16 h-16 rounded-2xl object-cover shadow-lg mb-8" />
      <h1 className="text-8xl font-bold text-slate-200 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('error.notFound')}</h2>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto">
        {t('error.notFoundDesc')}
      </p>
      <Link to="/" className="btn btn-primary inline-flex">
        <ArrowLeft size={16} /> {t('error.goHome')}
      </Link>
    </div>
  );
}