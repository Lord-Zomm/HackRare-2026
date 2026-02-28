import { Routes, Route } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CasePage } from "./pages/CasePage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<CasePage />} />
      </Routes>
    </AppShell>
  );
}