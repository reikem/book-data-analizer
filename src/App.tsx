import { Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/page" 

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}