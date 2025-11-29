import { ReactNode } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "./context/auth";
import Loading from "./components/Loading";
import { Auth, Kiosk } from "./pages";
import "./App.css";

const Screen = ({ children }: { children: ReactNode }) => {
  return (
    <main className="w-full h-screen bg-background flex flex-col items-center justify-center gap-4">
      {children}
    </main>
  );
};

function App() {
  const { page, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }
  if (page === "auth") return <Auth />;

  if (page === "kiosk")
    return (
      <ProtectedRoute allowedRole="KIOSK">
        <Kiosk />
      </ProtectedRoute>
    );
}

export default App;
