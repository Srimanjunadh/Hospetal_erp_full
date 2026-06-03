import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, OAuthProvider, FacebookAuthProvider } from 'firebase/auth'

// Firebase configuration
// These values are used from environment variables or fallback to defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
}

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId']
  
  // Check for placeholder values
  const placeholderPatterns = [
    'YOUR_',
    'your-',
    'your_',
    'placeholder',
    'example',
    'demo'
  ]
  
  const isPlaceholder = (value) => {
    if (!value || value.trim() === '') return true
    return placeholderPatterns.some(pattern => 
      value.toUpperCase().includes(pattern.toUpperCase())
    )
  }
  
  const missingFields = requiredFields.filter(field => {
    const value = firebaseConfig[field]
    return !value || isPlaceholder(value)
  })
  
  if (missingFields.length > 0) {
    // If fields are missing, we just skip initialization silently
    // This allows the app to run without Firebase if not needed
    return false
  }
  
  return true
}

// Initialize Firebase
let app = null
let auth = null
let googleProvider = null
let appleProvider = null
let facebookProvider = null

// Only initialize if configuration is valid
const isValid = validateFirebaseConfig()

if (isValid) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
    appleProvider = new OAuthProvider('apple.com')
    facebookProvider = new FacebookAuthProvider()
    
    console.log('✅ Firebase initialized successfully')
  } catch (error) {
    console.error('❌ Firebase initialization error:', error)
  }
} else {
  // Silent fallback - no warnings as per user request to do it without Firebase
}

export { auth, googleProvider, appleProvider, facebookProvider }
export default app

