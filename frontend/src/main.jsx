import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";
import { LikesProvider } from "./context/LikesContext";
import { ToastProvider } from "./components/Toast/ToastContext";
import { installReactDomMutationGuard } from "./utils/reactDomMutationGuard";
import "./styles/global.css";

installReactDomMutationGuard();

const app = (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ToastProvider>
      <AuthProvider>
        <LikesProvider>
          <PlayerProvider>
            <App />
          </PlayerProvider>
        </LikesProvider>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")).render(app);
