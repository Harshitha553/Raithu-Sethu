import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function PageLayout({ children, pageTitle, maxWidth = "max-w-7xl" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar setMobileOpen={setMobileOpen} pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto">
          <div className={`${maxWidth} mx-auto px-4 md:px-6 py-6`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
