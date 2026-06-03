"use client";
import { motion } from "framer-motion";
import { Activity, Users, ChevronLeft, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PMSPortal() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#000000', fontFamily: 'Inter, sans-serif' }}>
      {/* Navigation */}
      <nav style={{ padding: '1.5rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 900, textDecoration: 'none', color: '#000' }}>
          <ChevronLeft size={24} /> BACK TO MEDCLUES+
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', fontWeight: 900 }}>
          <Activity size={32} /> PMS ECOSYSTEM
        </div>
      </nav>

      {/* Selection Section */}
      <section style={{ padding: '6rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: '5rem' }}
        >
          <h1 style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '1.5rem' }}>
            SELECT YOUR PORTAL
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#666', maxWidth: '700px', margin: '0 auto', lineHeight: 1.5 }}>
            Access the integrated Patient Management System. Manage appointments, medical records, and hospital operations in one place.
          </p>
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* Patient Portal Card */}
          <Link href="http://localhost:5173" target="_blank" style={{ textDecoration: 'none', color: 'inherit', maxWidth: '600px', width: '100%' }}>
            <motion.div
              whileHover={{ scale: 1.02, backgroundColor: '#f8f8f8' }}
              style={{ 
                padding: '4rem 3rem', 
                border: '3px solid #000', 
                height: '100%', 
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ position: 'absolute', top: '20px', right: '20px', opacity: 0.1 }}>
                <Users size={120} />
              </div>
              <div style={{ background: '#000', color: '#fff', width: 'fit-content', padding: '8px 16px', fontSize: '0.7rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '1px' }}>
                PATIENT INTERFACE
              </div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem' }}>PATIENT <br /> PORTAL & WEBSITE</h2>
              <p style={{ fontSize: '1rem', opacity: 0.6, lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '300px' }}>
                Book appointments, view medical history, and explore our healthcare services.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 900, fontSize: '0.9rem' }}>
                LAUNCH WEBSITE <ExternalLink size={18} />
              </div>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Security Banner */}
      <div style={{ margin: '4rem 3rem', padding: '2rem', background: '#f0f0f0', display: 'flex', alignItems: 'center', gap: '2rem', border: '2px dashed #ccc' }}>
        <ShieldCheck size={40} />
        <div>
          <h4 style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '1px' }}>SECURE INTEGRATION</h4>
          <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>The PMS Ecosystem is fully integrated with MediClues+ security protocols and database infrastructure.</p>
        </div>
      </div>
    </div>
  );
}
