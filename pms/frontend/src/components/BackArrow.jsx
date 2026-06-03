import React from 'react'
import { useNavigate } from 'react-router-dom'

const BackArrow = ({ className = '', fallback = '/' }) => {
    const navigate = useNavigate()

    const handleGoBack = () => {
        // If there's no history to go back to (e.g. opened from QR code), go to fallback
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1)
        } else {
            navigate(fallback)
        }
    }

    return (
        <button
            onClick={handleGoBack}
            className={`w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors ${className}`}
            title="Go back"
        >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>
    )
}

export default BackArrow

