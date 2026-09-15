import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar/Sidebar";
import PlayerBar from "./components/PlayerBar/PlayerBar";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Library from "./pages/Library/Library";
import Albums from "./pages/Albums/Albums";
import AlbumDetail from "./pages/AlbumDetail/AlbumDetail";
import Studio from "./pages/Studio/Studio";
import LikedSongs from "./pages/LikedSongs/LikedSongs";
import RecentlyPlayed from "./pages/RecentlyPlayed/RecentlyPlayed";
import ArtistProfile from "./pages/ArtistProfile/ArtistProfile";
import NotFound from "./pages/NotFound/NotFound";
import AIAssistant from "./pages/AIAssistant/AIAssistant";
import OnlineSearch from "./pages/OnlineSearch/OnlineSearch";
import VerifyOtp from "./pages/VerifyOtp/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">{children}</main>
      <PlayerBar />
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/library" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/library" replace /> : <Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <AppShell>
              <Library />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/albums"
        element={
          <ProtectedRoute>
            <AppShell>
              <Albums />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/albums/:albumId"
        element={
          <ProtectedRoute>
            <AppShell>
              <AlbumDetail />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/studio"
        element={
          <ProtectedRoute role="artist">
            <AppShell>
              <Studio />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/liked"
        element={
          <ProtectedRoute>
            <AppShell>
              <LikedSongs />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recent"
        element={
          <ProtectedRoute>
            <AppShell>
              <RecentlyPlayed />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/artists/:artistId"
        element={
          <ProtectedRoute>
            <AppShell>
              <ArtistProfile />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai"
        element={
          <ProtectedRoute>
            <AppShell>
              <AIAssistant />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/online"
        element={
          <ProtectedRoute>
            <AppShell>
              <OnlineSearch />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to={user ? "/library" : "/login"} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}