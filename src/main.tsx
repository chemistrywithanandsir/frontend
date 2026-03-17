import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "katex/dist/katex.min.css";
import "./styles/index.css";
import { AuthProvider } from "./app/context/AuthContext";
import { ProfileProvider } from "./app/context/ProfileContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ProfileProvider>
      <App />
    </ProfileProvider>
  </AuthProvider>
);