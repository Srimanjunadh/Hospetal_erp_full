"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, ChevronRight, Activity } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ToastProvider";

export default function Register() {
  const router = useRouter();
  const { showToast } = useToast();
  const [role, setRole] = useState("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiService.register({
        ...formData,
        role: role === "admin" ? "hospital_admin" : role
      });

      if (data.access_token) {
        showToast("Account created successfully!", "success");
        router.push("/login");
      } else {
        showToast(data.detail || "Registration failed", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", display: "flex", color: "#000000" }}>
      {/* Left Branding Side */}
      <div style={{ flex: 1, background: "#000000", padding: "4rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#ffffff", fontSize: "1.5rem", fontWeight: 800, whiteSpace: "nowrap" }}>
          <Activity size={32} style={{ flexShrink: 0, color: '#29ABE2' }} />
          <span>MediClues+</span>
        </div>
        <div>
          <h1 style={{ color: "#ffffff", fontSize: "3.5rem", fontWeight: 900, lineHeight: 1.1, marginBottom: "2rem" }}>
            JOIN THE <br /> NETWORK.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", maxWidth: "400px" }}>
            Register as a patient, doctor, or administrator and become part of the future of connected healthcare.
          </p>
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
          © 2026 MediClues+ Enterprise. All rights reserved.
        </div>
      </div>

      {/* Right Register Side */}
      <div style={{ width: "550px", padding: "4rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ maxWidth: "400px", margin: "0 auto", width: "100%" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Create Account</h2>
          <p style={{ color: "#666", marginBottom: "2rem" }}>Select your professional role and register your profile.</p>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "2.5rem" }}>
            {["patient", "doctor", "admin"].map((r) => (
              <button 
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{ 
                  flex: 1, 
                  padding: "10px", 
                  border: "2px solid #000000", 
                  background: role === r ? "#000000" : "transparent",
                  color: role === r ? "#ffffff" : "#000000",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textTransform: "uppercase"
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ borderBottom: "2px solid #000000", padding: "10px 0" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>Full Identity Name</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <User size={20} color="#000" />
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Johnathan Doe" 
                  style={{ width: "100%", border: "none", outline: "none", fontSize: "1.1rem", fontWeight: 500, background: "transparent" }} 
                />
              </div>
            </div>
            
            <div style={{ borderBottom: "2px solid #000000", padding: "10px 0" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>Network Email</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Mail size={20} color="#000" />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="name@medclues.com" 
                  style={{ width: "100%", border: "none", outline: "none", fontSize: "1.1rem", fontWeight: 500, background: "transparent" }} 
                />
              </div>
            </div>
            
            <div style={{ borderBottom: "2px solid #000000", padding: "10px 0" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>Access Password</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Lock size={20} color="#000" />
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••" 
                  style={{ width: "100%", border: "none", outline: "none", fontSize: "1.1rem", fontWeight: 500, background: "transparent" }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              style={{ 
                background: "#000000", 
                color: "#ffffff", 
                border: "none", 
                padding: "1.25rem", 
                borderRadius: "0", 
                fontWeight: 700, 
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                marginTop: "1rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? "PROCESSING..." : "REGISTER PROFILE"} <ChevronRight size={20} />
            </button>
          </form>

          <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #eee", textAlign: "center" }}>
            <p style={{ color: "#666", fontSize: "0.9rem" }}>
              Already have an account? <Link href="/login" style={{ color: "#000", fontWeight: 700, textDecoration: "none" }}>Access Terminal</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

