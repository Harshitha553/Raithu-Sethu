import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const videoRef = useRef(null);
  const redirected = useRef(false);
  const [exiting, setExiting] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    if (redirected.current) return;

    const goTo = () => {
      if (redirected.current) return;
      redirected.current = true;
      // Trigger the fade-out, then navigate once the transition finishes
      // so there's never a blank frame between splash and the next page.
      setExiting(true);
      setTimeout(() => {
        if (isAuthenticated) {
          const dashboard =
            role === "farmer"
              ? "/farmer/dashboard"
              : role === "admin"
                ? "/admin"
                : "/buyer/marketplace";
          navigate(dashboard, { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      }, 500);
    };

    const fallback = setTimeout(goTo, 8000);

    const video = videoRef.current;
    if (video) {
      const handleEnd = () => goTo();
      video.addEventListener("ended", handleEnd);
      return () => {
        clearTimeout(fallback);
        video.removeEventListener("ended", handleEnd);
      };
    }

    return () => clearTimeout(fallback);
  }, [isAuthenticated, role, navigate]);

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-gradient-to-br from-green-950 via-green-900 to-teal-950 transition-opacity duration-500 ease-out ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Full-bleed background video */}
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        onCanPlay={() => setVideoReady(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Subtle gradient overlay so the wordmark stays legible over any frame */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

      {/* Decorative texture, matches the rest of the app's premium feel */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 25px 25px, rgba(255,255,255,0.3) 2px, transparent 0)", backgroundSize: "50px 50px" }}
      />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Placeholder shown until the video has a frame ready, so there's no flash of empty background */}
      {!videoReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 animate-fade-in">
          <img
            src="/logo.jpeg"
            alt="Raithu Sethu"
            className="w-28 h-28 md:w-36 md:h-36 rounded-3xl object-cover shadow-2xl shadow-green-500/25"
          />
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Raithu Sethu
          </h1>
          <p className="text-green-300/70 text-sm md:text-lg -mt-3">
            Farm-to-Market Platform
          </p>
        </div>
      )}

      {/* Loading indicator, bottom of viewport, present throughout */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}