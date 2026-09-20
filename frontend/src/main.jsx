import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";
import { LikesProvider } from "./context/LikesContext";
import { ToastProvider } from "./components/Toast/ToastContext";
import { installReactDomMutationGuard } from "./utils/reactDomMutationGuard";
import "./styles/global.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

installReactDomMutationGuard();

const app = (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ToastProvider>
        <AuthProvider>
          <LikesProvider>
            <PlayerProvider>
              <App />
            </PlayerProvider>
          </LikesProvider>
        </AuthProvider>
      </ToastProvider>
    </ClerkProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")).render(app);
