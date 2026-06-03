"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, ShieldAlert, Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Terminate Active Session
    // Terminate All Active Sessions
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("medclues_session")) {
        localStorage.removeItem(key);
      }
    });
    
    // Controlled Redirect
    const timer = setTimeout(() => {
      router.push("/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', textAlign: 'center' }}>
      <div style={{ padding: '3rem', border: '2px solid rgba(255,255,255,0.1)', maxWidth: '400px' }}>
        <Activity size={48} className="animate-pulse" style={{ margin: '0 auto 2rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '1rem' }}>TERMINATING SESSION</h1>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, marginBottom: '2rem' }}>PURGING ENCRYPTED AUTH TOKENS • NODE DISCONNECTING</p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
           <Loader2 size={16} className="animate-spin" />
           <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px' }}>SECURE REDIRECT IN PROGRESS</span>
        </div>

        <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.2)', justifyContent: 'center' }}>
           <ShieldAlert size={14} /> SYSTEM IP LOGGED • SESSION TERMINATED
        </div>
      </div>
    </div>
  );
}
