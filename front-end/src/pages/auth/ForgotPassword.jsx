import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "../../api/auth";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useLanguage();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error(t('error.generic')); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch {
      toast.error(t('error.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-50 px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <img src="/logo.jpeg" alt="Raithu Sethu" className="w-9 h-9 rounded-xl object-cover shadow-md" />
          <span className="font-bold text-xl text-slate-800">RaithuSethu</span>
        </div>

        {!sent ? (
          <div className="card p-8">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
              <Mail size={24} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('auth.forgotPassword')}</h1>
            <p className="text-slate-500 text-sm mb-8">
              {t('auth.forgotPassword')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('auth.email')}</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-9"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full btn-lg">
                {loading ? t('common.saving') : t('auth.resetPassword')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5">
                <ArrowLeft size={14} /> {t('auth.login')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('auth.resetPassword')}</h2>
            <p className="text-slate-500 text-sm mb-2">
              {t('auth.email')}
            </p>
            <Link to="/login" className="btn btn-primary inline-flex">
              {t('auth.login')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}