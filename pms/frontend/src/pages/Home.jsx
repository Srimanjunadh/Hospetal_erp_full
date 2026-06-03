import React, { useState } from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import HospitalTieUps from '../components/HospitalTieUps'
import ContactLocation from '../components/ContactLocation'
import AIChatbot from '../components/AIChatbot'

const Home = () => {
  const [showChatbot, setShowChatbot] = useState(false)

  return (
    <div>
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      <HospitalTieUps />
      <ContactLocation />

      {/* AI Chatbot */}
      {showChatbot ? (
        <AIChatbot onClose={() => setShowChatbot(false)} />
      ) : (
        <button
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full p-3 sm:p-3.5 shadow-lg hover:shadow-xl transition-all group hover:scale-110 z-[999999]"
          title="Chat with AI Assistant"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>

          <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      )}
    </div>
  )
}

export default Home
