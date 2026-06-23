import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./components/ToastProvider";
import DesktopApp from "./DesktopApp";
import { MobileRoutes } from "./mobile/MobileRouter";
import { useMobileView } from "./hooks/useMobileView";

function Root() {
  const isMobile = useMobileView();
  return isMobile ? <MobileRoutes /> : <DesktopApp />;
}

export default function AppShell() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <Root />
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}
