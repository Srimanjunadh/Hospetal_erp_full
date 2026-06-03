import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import BackButton from '../components/BackButton'
import BackArrow from '../components/BackArrow'
import LoadingSpinner, { ButtonSpinner } from '../components/LoadingSpinner'
import UploadReportsModal from '../components/UploadReportsModal'
import SymptomsBySpecialization from '../components/SymptomsBySpecialization'
import BrandLogo from '../components/BrandLogo'
import { getExperienceBadge } from '../utils/experienceBadge'
import axios from 'axios'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'

const Appointment = () => {

    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData, userData, isDoctorsLoading } = useContext(AppContext)
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')
    const [showTicket, setShowTicket] = useState(false)
    const [appointmentData, setAppointmentData] = useState(null)
    const [isBooking, setIsBooking] = useState(false)
    const [bookingSuccess, setBookingSuccess] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [selectedSymptoms, setSelectedSymptoms] = useState([])
    const [customSymptomsDescription, setCustomSymptomsDescription] = useState('')
    const [symptomError, setSymptomError] = useState(false)
    const [patientData, setPatientData] = useState(null) // Patient data from booking modal
    const [paymentMethod, setPaymentMethod] = useState('payOnVisit') // 'payOnVisit' or 'onlinePayment'
    const [selectedPaymentGateway, setSelectedPaymentGateway] = useState(null) // 'razorpay' or 'stripe'
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const preSelectedDate = searchParams.get('date') || null
    const preSelectedTime = searchParams.get('time') || null


    const location = useLocation()

    const fetchDocInfo = async () => {
        let docInfo = doctors.find((doc) => doc._id == docId || doc.id == docId)

        // If passed via navigation state (Hospital Tie-Up Doctor), prioritize or merge it!
        // This ensures hospitalName and location enrichment is kept
        if (location.state?.doctor) {
            docInfo = { ...docInfo, ...location.state.doctor }
            // Ensure _id exists for hospital doctors (use docId from URL if available)
            if (!docInfo._id && docId) {
                docInfo._id = docId
            }
            // Don't set hardcoded images - doctors should upload their own photos in doctor panel
            // Leave image as null/empty if not provided
            // Ensure fees is present
            if (!docInfo.fees) docInfo.fees = 50 // Default consultation fee
            // Ensure about is present
            if (!docInfo.about) {
                const specialty = docInfo.specialization || docInfo.speciality || 'General Medicine'
                const experience = docInfo.experience || 0
                docInfo.about = `Dr. ${docInfo.name} is a specialist in ${specialty} with ${experience} years of experience.`
            }
            // Map specialization to speciality for compatibility
            if (!docInfo.speciality) docInfo.speciality = docInfo.specialization || 'General Medicine'
            if (!docInfo.specialization) docInfo.specialization = docInfo.speciality || 'General Medicine'
            // Ensure slots_booked exists to prevent crashes
            if (!docInfo.slots_booked) docInfo.slots_booked = {}
            // Ensure degree/qualification exists
            if (!docInfo.degree && docInfo.qualification) docInfo.degree = docInfo.qualification
            if (!docInfo.qualification && docInfo.degree) docInfo.qualification = docInfo.degree
            if (!docInfo.degree && !docInfo.qualification) {
                docInfo.degree = 'MBBS, MD'
                docInfo.qualification = 'MBBS, MD'
            }
            // Ensure available property exists (default to true for booking)
            if (docInfo.available === undefined || docInfo.available === null) {
                docInfo.available = true
            }
        } else if (!docInfo && doctors.length > 0) {
            // If still not found in doctors list, resolve by id type.
            // Embedded doctors use ids like "emb_56" and should not be sent
            // to endpoints that expect numeric doctor ids.
            try {
                if (typeof docId === 'string' && docId.startsWith('emb_')) {
                    const embeddedResponse = await axios.get(backendUrl + '/api/hospital-tieup/public/doctors')
                    const embeddedDoctors = embeddedResponse?.data?.doctors || []
                    const matchedEmbeddedDoctor = embeddedDoctors.find(
                        (doc) => String(doc._id) === String(docId) || String(doc.id) === String(docId)
                    )
                    if (matchedEmbeddedDoctor) {
                        docInfo = matchedEmbeddedDoctor
                    }
                } else {
                    const response = await axios.get(backendUrl + `/api/doctor/${docId}`)
                    if (response.data && response.data.success && response.data.doctor) {
                        docInfo = response.data.doctor
                    }
                }
            } catch (error) {
                console.error('Error fetching doctor:', error)
            }
        }

        // Ensure all required properties exist for any doctor
        if (docInfo) {
            // Ensure slots_booked exists
            if (!docInfo.slots_booked) {
                docInfo.slots_booked = {}
            }
            // Ensure available property exists (default to true for booking)
            if (docInfo.available === undefined || docInfo.available === null) {
                docInfo.available = true
            }
            // Ensure name exists
            if (!docInfo.name) {
                docInfo.name = 'Doctor'
            }
            // Ensure speciality exists
            if (!docInfo.speciality && !docInfo.specialization) {
                docInfo.speciality = 'General Medicine'
                docInfo.specialization = 'General Medicine'
            }
        }
        setDocInfo(docInfo)
    }

    // Extract MD/MBBS/MS from name or add it based on variety
    const getDoctorNameWithMD = (name, index, degree) => {
        if (!name) return 'Doctor'
        const degrees = ['MD', 'MBBS', 'MS']
        
        // Use degree if provided, else rotate based on index, else default to 'MD'
        let deg = degree;
        if (!deg) {
            const idx = typeof index === 'number' ? index : 0;
            deg = degrees[idx % degrees.length];
        }
        if (!deg) deg = 'MD';

        // Add degree in parentheses if not already present
        let formattedName = name;
        if (!name.includes(`(${deg})`)) {
            formattedName = `${name} (${deg})`;
        }
        
        // Ensure "Dr. " prefix
        return formattedName.startsWith('Dr.') ? formattedName : `Dr. ${formattedName}`;
    }

    const getAvailableSolts = async () => {
        // Safety check: ensure docInfo exists before processing
        if (!docInfo) {
            console.warn('Cannot generate slots: docInfo is null')
            setDocSlots([])
            return
        }

        let today = new Date()
        let allDaysSlots = []

        // Define two slot types: "10-1" (10 AM to 1 PM) and "4-9" (4 PM to 9 PM)
        const slotTypes = [
            { start: 10, end: 13, label: '10-1' },  // 10 AM to 1 PM
            { start: 16, end: 21, label: '4-9' }    // 4 PM to 9 PM
        ]

        for (let i = 0; i < 7; i++) {
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            let timeSlots = [];

            // Generate slots for each slot type
            slotTypes.forEach(slotType => {
                let slotStart = new Date(currentDate)
                slotStart.setHours(slotType.start, 0, 0, 0)

                let slotEnd = new Date(currentDate)
                slotEnd.setHours(slotType.end, 0, 0, 0)

                // Only show slots for today if current time is before slot end
                if (i === 0 && new Date() >= slotEnd) {
                    return // Skip past slots for today
                }

                let slotTime = new Date(slotStart)

                while (slotTime < slotEnd) {
                    let formattedTime = slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    let day = currentDate.getDate()
                    let month = currentDate.getMonth() + 1
                    let year = currentDate.getFullYear()

                    const slotDate = day.toString().padStart(2, '0') + "_" + month.toString().padStart(2, '0') + "_" + year
                    const slotTimeStr = formattedTime

                    // Check if slot is booked and count bookings for this slot type
                    const slotsBookedForDate = docInfo?.slots_booked?.[slotDate] || []
                    const slotTypeBookings = slotsBookedForDate.filter(bookedTime => {
                        const timeStr = bookedTime.toLowerCase();
                        const hour = parseInt(timeStr.split(':')[0]);
                        const isPM = timeStr.includes('pm');
                        const adjustedHour = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
                        return (adjustedHour >= slotType.start && adjustedHour < slotType.end)
                    })

                    // Check if this specific time is booked
                    const isThisSlotBooked = slotsBookedForDate.includes(slotTimeStr)

                    // Check if slot type has reached 25 bookings limit
                    const isSlotTypeFull = slotTypeBookings.length >= 25

                    if (!isThisSlotBooked && !isSlotTypeFull) {
                        timeSlots.push({
                            datetime: new Date(slotTime),
                            time: formattedTime,
                            slotType: slotType.label,
                            bookingsRemaining: 25 - slotTypeBookings.length
                        })
                    }

                    slotTime.setMinutes(slotTime.getMinutes() + 30);
                }
            })

            allDaysSlots.push(timeSlots)
        }

        setDocSlots(allDaysSlots)
    }

    const generateAppointmentId = () => {
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 100000)
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const randomLetter = letters[Math.floor(Math.random() * letters.length)]
        return `APT-${randomLetter}${timestamp.toString().slice(-6)}${random.toString().padStart(5, '0')}`
    }

    const generateQRData = (appointmentId, docId, slotDate, slotTime, patientName, doctorName, doctorSpecialty) => {
        // Generate a URL that can be scanned to view patient details
        const baseUrl = window.location.origin
        const verifyUrl = `${baseUrl}/verify-appointment?id=${appointmentId}`

        // Also include structured data for direct scanning
        const qrData = {
            type: 'appointment',
            id: appointmentId,
            doctorId: docId,
            date: slotDate,
            time: slotTime,
            patientName: patientName || 'Patient',
            doctorName: doctorName || 'Doctor',
            specialty: doctorSpecialty || 'General Medicine',
            timestamp: Date.now(),
            url: verifyUrl
        }

        // Return URL for easy scanning (most QR scanners prefer URLs)
        return verifyUrl
    }

    const getDoctorHighlights = (doctor) => {
        if (!doctor) return []
        const spec = (doctor.speciality || '').toLowerCase()
        if (spec.includes('general')) {
            return [
                'Focuses on preventive health checks and early diagnosis of lifestyle diseases.',
                'Helps coordinate care between different specialists when needed.'
            ]
        }
        if (spec.includes('gyne')) {
            return [
                'Provides end‑to‑end care from adolescent health to pregnancy and menopause.',
                'Experienced in counselling patients on fertility, PCOS, and menstrual health.'
            ]
        }
        if (spec.includes('derma')) {
            return [
                'Treats acne, pigmentation, allergies, and long‑term skin conditions.',
                'Combines medical treatment with daily‑routine skin‑care guidance.'
            ]
        }
        if (spec.includes('pediatric')) {
            return [
                'Monitors growth, nutrition, and vaccinations from infancy to adolescence.',
                'Known for a child‑friendly approach that keeps kids relaxed during visits.'
            ]
        }
        if (spec.includes('neuro')) {
            return [
                'Manages migraines, seizure disorders, and nerve‑related conditions.',
                'Works on long‑term neurological rehabilitation and follow‑up plans.'
            ]
        }
        if (spec.includes('gastro')) {
            return [
                'Experienced with acidity, IBS, liver issues, and other digestive problems.',
                'Focuses on diet, lifestyle, and medical therapy for long‑term relief.'
            ]
        }
        return [
            'Provides patient‑centric care with clear explanations at every step.',
            'Believes in building long‑term, trust‑based relationships with patients.'
        ]
    }

    const getDoctorLocation = (doc) => {
        if (!doc) return { hospitalName: 'MediClues+ Care Center', location: 'Remote Consultation' }
        
        // Embedded in a hospital
        if (doc.hospital_name || doc.hospitalName) {
            return {
                hospitalName: doc.hospital_name || doc.hospitalName,
                location: doc.location || doc.hospital_address || 'Hospital Address Pending'
            }
        }
        
        // Standalone doctor with address object
        if (doc.address && Object.keys(doc.address).length > 0) {
            try {
                const addr = typeof doc.address === 'string' ? JSON.parse(doc.address) : doc.address;
                const city = addr.city || ''
                const state = addr.state || ''
                const zip = addr.zip || addr.zipCode || ''
                const line1 = addr.line1 || ''
                const line2 = addr.line2 || ''
                
                const fullAddress = [line1, line2, city, state, zip].filter(item => item && String(item).trim() !== '').join(', ')
                return {
                    hospitalName: `${doc.name}'s Clinic`,
                    location: fullAddress || 'Address Pending'
                }
            } catch (e) {
                return {
                    hospitalName: `${doc.name}'s Clinic`,
                    location: typeof doc.address === 'string' ? doc.address : 'Address format invalid'
                }
            }
        }
        
        // Fallback
        return {
            hospitalName: 'MediClues+ Care Center',
            location: 'Remote Consultation'
        }
    }

    // Process payment for online payment method
    const processPayment = async (appointmentId, gateway, ticketData) => {
        setIsProcessingPayment(true)
        setIsBooking(false)

        try {
            if (gateway === 'razorpay') {
                // Razorpay payment
                const { data } = await axios.post(backendUrl + '/api/user/payment-razorpay', {
                    appointmentId
                }, {
                    headers: { token }
                })

                if (data && data.success && data.order) {
                    const options = {
                        key: data.order.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
                        amount: data.order.amount,
                        currency: data.order.currency,
                        name: "MediClues",
                        description: `Appointment with ${docInfo?.name || 'Doctor'}`,
                        order_id: data.order.id,
                        handler: async function (response) {
                            try {
                                const verifyResponse = await axios.post(backendUrl + '/api/user/verifyRazorpay', {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                }, {
                                    headers: { token }
                                })

                                if (verifyResponse.data.success) {
                                    toast.success('Payment successful! Appointment booked.', {
                                        position: "top-center",
                                        autoClose: 5000,
                                    })
                                    
                                    // Navigate to professional Digital Pass page
                                    const date = docSlots[slotIndex][0].datetime
                                    navigate('/appointment-confirmation', { 
                                        state: { 
                                            appointmentData: {
                                                patientName: patientData?.name || userData?.name || 'Patient',
                                                providerName: getDoctorNameWithMD(docInfo?.name, docInfo?.degree || docInfo?.qualification),
                                                providerType: 'doctor',
                                                service: docInfo?.speciality || 'General Consultation',
                                                date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                                                time: slotTime || 'N/A',
                                                location: `${ticketData.hospitalName} - ${ticketData.location}`,
                                                id: appointmentId
                                            }
                                        } 
                                    });
                                    
                                    getDoctosData()
                                } else {
                                    toast.error('Payment verification failed')
                                }
                            } catch (error) {
                                toast.error('Payment verification error')
                            } finally {
                                setIsProcessingPayment(false)
                            }
                        },
                        prefill: {
                            name: userData?.name || '',
                            email: userData?.email || '',
                            contact: userData?.phone || ''
                        },
                        theme: {
                            color: "#3b82f6"
                        },
                        modal: {
                            ondismiss: function () {
                                setIsProcessingPayment(false)
                                toast.info('Payment cancelled')
                            }
                        }
                    }

                    // Load Razorpay script if not already loaded
                    if (!window.Razorpay) {
                        const razorpayScript = document.createElement('script')
                        razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js'
                        razorpayScript.onload = () => {
                            if (window.Razorpay) {
                                const razorpay = new window.Razorpay(options)
                                razorpay.open()
                            }
                        }
                        document.body.appendChild(razorpayScript)
                    } else {
                        const razorpay = new window.Razorpay(options)
                        razorpay.open()
                    }
                } else {
                    toast.error(data?.message || 'Failed to initialize payment')
                    setIsProcessingPayment(false)
                }
            } else if (gateway === 'stripe') {
                // Stripe payment
                const { data } = await axios.post(backendUrl + '/api/user/payment-stripe', {
                    appointmentId
                }, {
                    headers: { token }
                })

                if (data && data.success && data.session_url) {
                    // Redirect to Stripe checkout
                    window.location.href = data.session_url
                } else {
                    toast.error(data?.message || 'Failed to initialize payment')
                    setIsProcessingPayment(false)
                }
            }
        } catch (error) {
            console.error('Payment error:', error)
            toast.error('Payment processing failed. Please try again.')
            setIsProcessingPayment(false)
        }
    }

    const bookAppointment = async () => {
        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        if (!slotTime) {
            toast.error('Please select a time slot')
            return
        }

        // Validate doctor selection first
        if (!docInfo || !docId) {
            toast.error('Please select a doctor first')
            return
        }

        // Validate symptoms selection (Mandatory - either tags or custom description must be provided!)
        if (selectedSymptoms.length === 0 && !customSymptomsDescription.trim()) {
            setSymptomError(true)
            toast.error('Please select at least one symptom or describe your condition to proceed.')
            return
        } else {
            setSymptomError(false)
        }

        // Validate that docSlots and selected slot exist
        if (!docSlots || docSlots.length === 0) {
            toast.error('No available slots. Please refresh and try again.')
            return
        }

        if (slotIndex < 0 || slotIndex >= docSlots.length) {
            toast.error('Invalid date selection. Please select a date again.')
            return
        }

        if (!docSlots[slotIndex] || !Array.isArray(docSlots[slotIndex]) || docSlots[slotIndex].length === 0) {
            toast.error('Invalid time slot. Please select a time slot again.')
            return
        }

        setIsBooking(true)
        const selectedSlot = docSlots[slotIndex][0]

        if (!selectedSlot || !selectedSlot.datetime) {
            toast.error('Invalid date. Please refresh and try again.')
            setIsBooking(false)
            return
        }

        const date = selectedSlot.datetime

        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const slotDate = day.toString().padStart(2, '0') + "_" + month.toString().padStart(2, '0') + "_" + year

        try {
            // Validate docId exists
            if (!docId) {
                toast.error('Doctor ID is missing. Please try again.')
                setIsBooking(false)
                return
            }

            // Prepare form data for file upload
            const formData = new FormData()
            formData.append('docId', docId)
            formData.append('slotDate', slotDate)
            formData.append('slotTime', slotTime)
            
            // Build the unified symptoms list including tags and custom description details
            const finalSymptoms = [...selectedSymptoms]
            if (customSymptomsDescription.trim()) {
                finalSymptoms.push(`Additional Details: ${customSymptomsDescription.trim()}`)
            }
            formData.append('symptoms', JSON.stringify(finalSymptoms))
            formData.append('paymentMethod', paymentMethod || 'payOnVisit') // Send payment method to backend

            // Add actualPatient data if available
            if (patientData) {
                formData.append('actualPatient', JSON.stringify(patientData))
                // Add prescription file if available
                if (patientData.prescription) {
                    formData.append('prescription', patientData.prescription)
                }
            }

            const doctorLoc = getDoctorLocation(docInfo)
            formData.append('hospitalName', doctorLoc.hospitalName)
            formData.append('location', doctorLoc.location)

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', formData, {
                headers: {
                    token
                }
            })

            if (data && data.success) {
                // Refresh doctors data to update slot counts
                if (typeof getDoctosData === 'function') await getDoctosData()

                // Validate docInfo exists before creating ticket
                if (!docInfo) {
                    toast.error('Doctor information not available. Please refresh and try again.')
                    setIsBooking(false)
                    return
                }

                const appointmentId = data.appointmentId ? `APT-${String(data.appointmentId).padStart(6, '0')}` : generateAppointmentId()

                // Use actual patient name if booking for someone else
                const displayPatientName = patientData && !patientData.isSelf
                    ? patientData.name
                    : (userData?.name || 'Patient')

                // Validate all required data before creating ticket
                if (!date || !slotTime || !docId) {
                    toast.error('Missing appointment details. Please try again.')
                    setIsBooking(false)
                    return
                }

                // Get cost breakdown from backend response
                const costBreakdown = data?.appointment?.costBreakdown || {
                    consultationFee: docInfo?.fees || 0,
                    platformFee: 0,
                    gst: 0,
                    total: docInfo?.fees || 0
                }

                const ticketData = {
                    id: appointmentId,
                    patientName: displayPatientName || 'Patient',
                    doctorName: getDoctorNameWithMD(docInfo?.name, docInfo?.degree || docInfo?.qualification),
                    doctorSpecialty: docInfo?.speciality || docInfo?.specialization || 'General Medicine',
                    date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                    day: daysOfWeek[date.getDay()] || 'N/A',
                    time: slotTime || 'N/A',
                    price: costBreakdown.total,
                    costBreakdown: costBreakdown,
                    qrData: generateQRData(
                        appointmentId,
                        docId,
                        slotDate,
                        slotTime,
                        displayPatientName || 'Patient',
                        docInfo?.name || 'Doctor',
                        docInfo?.speciality || docInfo?.specialization || 'General Medicine'
                    ),
                    whatsappLink: data?.whatsappLink || null,
                    actualPatient: patientData || null,
                    hospitalName: doctorLoc.hospitalName,
                    location: doctorLoc.location
                }

                // Decide based on payment method
                if (paymentMethod === 'payOnVisit') {
                    // Navigate to professional Digital Pass page
                    navigate('/appointment-confirmation', { 
                        state: { 
                            appointmentData: {
                                patientName: displayPatientName || 'Patient',
                                providerName: getDoctorNameWithMD(docInfo?.name, docInfo?.degree || docInfo?.qualification),
                                providerType: 'doctor',
                                service: docInfo?.speciality || 'General Consultation',
                                date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                                time: slotTime || 'N/A',
                                location: `${ticketData.hospitalName} - ${ticketData.location}`,
                                id: appointmentId
                            }
                        } 
                    });
                    
                    toast.success(data.message || 'Appointment booked successfully!', { 
                        position: "top-center", 
                        autoClose: 5000 
                    });
                } else if (paymentMethod === 'onlinePayment') {
                    const onlineAppointmentId = data.appointmentId || data._id
                    if (!onlineAppointmentId) {
                        toast.error('Appointment ID not found. Please try again.')
                        setIsBooking(false)
                        return
                    }
                    await processPayment(onlineAppointmentId.toString(), selectedPaymentGateway || 'razorpay')
                }
            } else {
                const errorMessage = data?.message || 'Failed to book appointment. Please try again.'
                toast.error(errorMessage, { position: "top-center", autoClose: 5000 })
            }
        } catch (error) {
            console.error('Booking error:', error)
            let errorMessage = 'Failed to book appointment. Please try again.'
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection and try again.'
            } else {
                errorMessage = error.message || errorMessage
            }
            toast.error(errorMessage, { position: "top-center", autoClose: 5000 })
        } finally {
            setIsBooking(false)
        }
    }

    // Load patient data from sessionStorage on mount
    useEffect(() => {
        const storedPatientData = sessionStorage.getItem('appointmentPatientData')
        if (storedPatientData) {
            try {
                const parsed = JSON.parse(storedPatientData)
                setPatientData(parsed)
                // Clear from sessionStorage after reading
                sessionStorage.removeItem('appointmentPatientData')
            } catch (e) {
                console.error('Error parsing patient data:', e)
            }
        }
    }, [])

    useEffect(() => {
        if (doctors.length > 0) {
            fetchDocInfo()
        }
    }, [doctors, docId])

    useEffect(() => {
        if (docInfo) {
            getAvailableSolts()
        }
    }, [docInfo])

    // Handle pre-selected slot from chatbot
    useEffect(() => {
        if (preSelectedDate && preSelectedTime && docSlots.length > 0 && docInfo) {
            // Find the slot index for the pre-selected date
            const dateArray = preSelectedDate.split('_')
            const targetDay = parseInt(dateArray[0])
            const targetMonth = parseInt(dateArray[1]) - 1
            const targetYear = parseInt(dateArray[2])

            const slotIndex = docSlots.findIndex(slots => {
                if (slots.length > 0) {
                    const slotDate = slots[0].datetime
                    return slotDate.getDate() === targetDay &&
                        slotDate.getMonth() === targetMonth &&
                        slotDate.getFullYear() === targetYear
                }
                return false
            })

            if (slotIndex !== -1) {
                setSlotIndex(slotIndex)
                // Find and select the time slot
                const timeSlots = docSlots[slotIndex]
                const timeSlot = timeSlots.find(slot => {
                    // Normalize time format for comparison
                    const slotTimeNormalized = slot.time.replace(/\s/g, '').toUpperCase()
                    const selectedTimeNormalized = preSelectedTime.replace(/\s/g, '').toUpperCase()
                    return slotTimeNormalized === selectedTimeNormalized
                })
                if (timeSlot) {
                    setSlotTime(timeSlot.time)
                    toast.success(`Slot pre-selected: ${timeSlot.time}`)
                }
            }
        }
    }, [preSelectedDate, preSelectedTime, docSlots, docInfo])

    // Prevent body scroll when modal is open (mobile fix)
    useEffect(() => {
        if (showTicket || showUploadModal) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }

        return () => {
            document.body.style.overflow = ''
        }
    }, [showTicket, showUploadModal])

    if (isDoctorsLoading) {
        return <LoadingSpinner fullScreen text="Loading doctor information..." />
    }

    if (!docInfo) {
        return (
            <div className="page-container">
                <BackButton to="/doctors" label="Back to Doctors" />
                <div className="empty-state card mt-6">
                    <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="empty-state-title">Doctor Not Found</h3>
                    <p className="empty-state-text">We couldn't find the doctor you're looking for.</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="page-container fade-in">
                {/* Back Arrow Button */}
                <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2 sm:gap-4">
                    <BackArrow className="flex-shrink-0" />
                    <BackButton className="flex-grow sm:flex-grow-0" docInfo={docInfo} />
                </div>

                {/* Success Banner */}
                {bookingSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg border border-green-400"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">Appointment Booked Successfully!</h3>
                                <p className="text-sm text-green-50">Your appointment has been confirmed. Check your email and phone for confirmation details.</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Doctor Details Card */}
                <div className='card mb-8 overflow-visible'>
                    <div className='flex flex-col lg:flex-row gap-6 p-4 sm:p-6'>
                        {/* Doctor Image */}
                        <div className='flex-shrink-0 mx-auto lg:mx-0'>
                            {docInfo?.image ? (
                                <img
                                    className='w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 object-cover rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100'
                                    src={docInfo.image}
                                    alt={docInfo?.name || 'Doctor'}
                                />
                            ) : (
                                <div className='w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center'>
                                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Doctor Info */}
                        <div className='flex-1 min-w-0'>
                            <div className='flex items-start gap-2 flex-wrap justify-center lg:justify-start'>
                                <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight'>
                                    {getDoctorNameWithMD(docInfo?.name, 0, docInfo?.degree || docInfo?.qualification)}
                                </h1>
                                <img className='w-5 h-5 mt-1' src={assets.verified_icon} alt="Verified" />
                            </div>

                            <div className='flex items-center gap-2 sm:gap-3 mt-2 flex-wrap justify-center lg:justify-start'>
                                <p className='text-gray-600 text-sm sm:text-base'>{docInfo?.speciality || docInfo?.specialization || 'General Medicine'}</p>
                                {(() => {
                                    const badge = getExperienceBadge(docInfo?.experience || 0)
                                    return (
                                        <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border-2 ${badge.bg} ${badge.border} ${badge.shadow} shadow-sm text-xs sm:text-sm font-medium`}>
                                            <span>{badge.emoji}</span>
                                            <span className={badge.color}>{badge.label}</span>
                                            <span className='text-gray-600 hidden sm:inline'>({docInfo?.experience || 0})</span>
                                        </span>
                                    )
                                })()}
                            </div>

                            {/* About */}
                            <div className='mt-4'>
                                <p className='flex items-center gap-2 text-sm font-semibold text-gray-800 justify-center lg:justify-start'>
                                    <svg className='w-4 h-4 text-cyan-500' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    About
                                </p>
                                <p className='text-sm text-gray-600 mt-1 leading-relaxed text-center lg:text-left'>{docInfo?.about || 'No additional information available.'}</p>
                                {docInfo && getDoctorHighlights(docInfo).length > 0 && (
                                    <ul className='mt-2 list-disc list-inside text-sm text-gray-600 space-y-1 text-left'>
                                        {getDoctorHighlights(docInfo).map((point, idx) => (
                                            <li key={idx}>{point}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Cost Breakdown - Only Consultation Fee */}
                            <div className='mt-4 flex justify-center lg:justify-start'>
                                {(() => {
                                    const consultationFee = docInfo?.fees || 0

                                    return (
                                        <div className='bg-cyan-50 px-4 py-3 rounded-lg border border-cyan-200 w-full max-w-md'>
                                            <p className='text-gray-700 font-semibold text-sm mb-2'>Consultation Fee</p>
                                            <div className='flex justify-between items-center'>
                                                <span className='text-gray-600 text-sm'>Consultation Fee:</span>
                                                <span className='text-cyan-600 font-bold text-lg'>{currencySymbol}{consultationFee}</span>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking Section */}
                <div className='card p-4 sm:p-6 overflow-visible'>
                    <div className='mb-6'>
                        <h2 className='text-lg sm:text-xl font-bold text-gray-900'>Select Date & Time</h2>
                        <p className='text-gray-600 text-sm mt-1'>Choose your preferred appointment slot</p>
                    </div>

                    {/* Date Selection */}
                    <div className='mb-6'>
                        <h3 className='text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2'>
                            <svg className='w-4 h-4 text-cyan-500' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Select Date
                        </h3>
                        <div className='flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar'>
                            {docSlots.length > 0 && docSlots.filter(slot => slot && slot.length > 0).map((item, index) => {
                                const isSelected = slotIndex === index
                                const date = item[0]?.datetime
                                if (!date) return null

                                return (
                                    <button
                                        onClick={() => { setSlotIndex(index); setSlotTime(''); }}
                                        key={index}
                                        className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[60px] sm:min-w-[70px] py-3 sm:py-4 px-2 sm:px-3 rounded-xl border-2 transition-all duration-200 ${isSelected
                                            ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white border-cyan-500 shadow-lg scale-105'
                                            : 'bg-white border-gray-200 text-gray-700 hover:border-cyan-300 hover:bg-cyan-50'
                                            }`}
                                    >
                                        <span className='text-[10px] sm:text-xs font-bold opacity-70'>
                                            {daysOfWeek[date.getDay()]}
                                        </span>
                                        <span className='text-lg sm:text-xl font-bold'>
                                            {date.getDate()}
                                        </span>
                                        <span className='text-[10px] sm:text-xs opacity-70'>
                                            {date.toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Time Slots - BookMyShow Premium Style */}
                    <div className='mb-6'>
                        <h3 className='text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2'>
                            <svg className='w-4 h-4 text-cyan-500' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Available Times
                        </h3>
                        {docSlots.length > 0 && docSlots[slotIndex]?.length > 0 ? (
                            (() => {
                                const slots = docSlots[slotIndex]
                                const morningSlots = slots.filter(s => {
                                    const timeStr = s.time.toLowerCase()
                                    const hour = parseInt(timeStr.split(':')[0])
                                    const isPM = timeStr.includes('pm')
                                    const adjustedHour = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour)
                                    return adjustedHour >= 10 && adjustedHour < 13
                                })
                                const eveningSlots = slots.filter(s => {
                                    const timeStr = s.time.toLowerCase()
                                    const hour = parseInt(timeStr.split(':')[0])
                                    const isPM = timeStr.includes('pm')
                                    const adjustedHour = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour)
                                    return adjustedHour >= 16 && adjustedHour < 21
                                })

                                return (
                                    <div className='space-y-6'>
                                        {/* Morning Slots */}
                                        {morningSlots.length > 0 && (
                                            <div>
                                                <div className='flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3'>
                                                    <span>☀️ Morning Slots</span>
                                                    <span className='px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px]'>10:00 AM - 01:00 PM</span>
                                                </div>
                                                <div className='flex flex-wrap gap-2.5'>
                                                    {morningSlots.map((item, idx) => {
                                                        const isSelected = slotTime === item.time
                                                        const isBooked = item.bookingsRemaining === 0

                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    if (isSelected) {
                                                                        setSlotTime('');
                                                                    } else {
                                                                        setSlotTime(item.time);
                                                                    }
                                                                }}
                                                                disabled={isBooked}
                                                                className={`px-4 py-2.5 text-xs font-bold rounded-lg border-2 transition-all duration-150 flex flex-col items-center justify-center min-w-[100px] cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-cyan-500 shadow-md scale-105'
                                                                        : isBooked
                                                                            ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-50'
                                                                            : 'bg-white border-gray-200 text-cyan-700 hover:border-cyan-400 hover:bg-cyan-50'
                                                                }`}
                                                            >
                                                                <span>{item.time.toUpperCase()}</span>
                                                                <span className={`text-[8px] font-bold mt-0.5 ${isSelected ? 'text-cyan-100' : isBooked ? 'text-gray-400' : 'text-emerald-600'}`}>
                                                                    {isBooked ? 'SOLD OUT' : `${item.bookingsRemaining} LEFT`}
                                                                </span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Evening Slots */}
                                        {eveningSlots.length > 0 && (
                                            <div>
                                                <div className='flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3'>
                                                    <span>🌙 Evening Slots</span>
                                                    <span className='px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 text-[10px]'>04:00 PM - 09:00 PM</span>
                                                </div>
                                                <div className='flex flex-wrap gap-2.5'>
                                                    {eveningSlots.map((item, idx) => {
                                                        const isSelected = slotTime === item.time
                                                        const isBooked = item.bookingsRemaining === 0

                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    if (isSelected) {
                                                                        setSlotTime('');
                                                                    } else {
                                                                        setSlotTime(item.time);
                                                                    }
                                                                }}
                                                                disabled={isBooked}
                                                                className={`px-4 py-2.5 text-xs font-bold rounded-lg border-2 transition-all duration-150 flex flex-col items-center justify-center min-w-[100px] cursor-pointer ${
                                                                    isSelected
                                                                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white border-cyan-500 shadow-md scale-105'
                                                                        : isBooked
                                                                            ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed opacity-50'
                                                                            : 'bg-white border-gray-200 text-cyan-700 hover:border-cyan-400 hover:bg-cyan-50'
                                                                }`}
                                                            >
                                                                <span>{item.time.toUpperCase()}</span>
                                                                <span className={`text-[8px] font-bold mt-0.5 ${isSelected ? 'text-cyan-100' : isBooked ? 'text-gray-400' : 'text-emerald-600'}`}>
                                                                    {isBooked ? 'SOLD OUT' : `${item.bookingsRemaining} LEFT`}
                                                                </span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })()
                        ) : (
                            <p className='text-gray-500 text-sm py-4'>No available slots for this date</p>
                        )}
                    </div>

                    {/* Symptoms Based on Doctor Specialization (between Date & Available Times) */}
                    <div className='mb-6 p-4 sm:p-5 bg-white rounded-lg border border-gray-200 shadow-sm'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-start'>
                            {/* Left Column: Preset Bubble Selector */}
                            <div className='space-y-4 w-full'>
                                <SymptomsBySpecialization
                                    doctorSpecialization={docInfo?.speciality}
                                    doctorName={docInfo?.name || ''}
                                    onSymptomsChange={(symptoms) => {
                                        setSelectedSymptoms(symptoms)
                                        if (symptoms.length > 0) setSymptomError(false)
                                    }}
                                    selectedSymptoms={selectedSymptoms}
                                    isLoading={false}
                                />
                                {symptomError && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-600 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Please select at least one symptom or describe your condition
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Custom Description Bar */}
                            <div className='w-full md:border-l md:border-gray-100 md:pl-6 flex flex-col h-full'>
                                <label className='block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                                    <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Describe your condition or add other symptoms (Optional)
                                </label>
                                <textarea
                                    value={customSymptomsDescription}
                                    onChange={(e) => {
                                        setCustomSymptomsDescription(e.target.value);
                                        if (e.target.value.trim().length > 0) setSymptomError(false);
                                    }}
                                    placeholder="E.g., High fever since yesterday morning, moderate throat pain while swallowing, minor headache..."
                                    maxLength={300}
                                    rows={4}
                                    className='w-full flex-1 px-4 py-3 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-500 transition-all duration-200 placeholder-gray-400 resize-none font-medium text-gray-700 min-h-[120px]'
                                />
                                <div className='flex justify-between items-center mt-2 text-[10px] sm:text-xs text-gray-400'>
                                    <span>Be as specific as possible to help your doctor</span>
                                    <span className={customSymptomsDescription.length >= 280 ? 'text-red-500 font-bold' : ''}>
                                        {customSymptomsDescription.length}/300 chars
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upload Reports Section */}
                    {token && (
                        <div className='mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200'>
                            <div className='flex items-start gap-3'>
                                <div className='flex-shrink-0 mt-1'>
                                    <svg className='w-6 h-6 text-blue-600' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className='flex-1'>
                                    <h3 className='text-sm font-semibold text-gray-900 mb-1'>Have Medical Reports?</h3>
                                    <p className='text-xs text-gray-600 mb-3'>
                                        Upload your lab reports, X-rays, or scans before your appointment. Dr. {docInfo?.name || 'the doctor'} will be able to review them during consultation.
                                    </p>
                                    <button
                                        onClick={() => setShowUploadModal(true)}
                                        className='btn btn-sm btn-secondary'
                                    >
                                        <svg className='w-4 h-4 mr-2' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload Reports
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Method Selection */}
                    <div className='mb-6 p-5 bg-white rounded-xl border border-gray-200'>
                        <h3 className='text-lg font-bold text-gray-900 mb-4'>Payment Method</h3>

                        {/* Separate Payment Buttons */}
                        <div className='space-y-4'>
                            {/* Pay on Visit Button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    setPaymentMethod('payOnVisit')
                                }}
                                disabled={!slotTime || isBooking || isProcessingPayment}
                                className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all text-left ${!slotTime || isBooking || isProcessingPayment
                                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                    : paymentMethod === 'payOnVisit'
                                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                                    }`}
                            >
                                <div className='mt-1'>
                                    <svg className={`w-5 h-5 ${paymentMethod === 'payOnVisit' ? 'text-blue-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className='flex-1'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <span className='font-semibold text-gray-900'>Pay on Visit</span>
                                        {paymentMethod === 'payOnVisit' && (
                                            <svg className='w-4 h-4 text-blue-600' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className='text-sm text-gray-600'>Pay the consultation fee when you visit the clinic</p>
                                </div>
                            </button>

                            {/* Online Payment Button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    if (!slotTime) {
                                        toast.error('Please select a time slot')
                                        return
                                    }
                                    if (!token) {
                                        toast.warning('Login to book appointment')
                                        return navigate('/login')
                                    }

                                    // Validate doctor selection
                                    if (!docInfo || !docId) {
                                        toast.error('Please select a doctor first')
                                        return
                                    }

                                    // Set payment method to onlinePayment
                                    setPaymentMethod('onlinePayment')
                                }}
                                disabled={!slotTime || isBooking || isProcessingPayment}
                                className={`w-full flex items-start gap-3 p-4 border-2 rounded-lg transition-all text-left ${!slotTime || isBooking || isProcessingPayment
                                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                    : paymentMethod === 'onlinePayment'
                                        ? 'border-blue-500 bg-blue-50 cursor-pointer'
                                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                                    }`}
                            >
                                <div className='mt-1'>
                                    <svg className={`w-5 h-5 ${paymentMethod === 'onlinePayment' ? 'text-blue-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <div className='flex-1'>
                                    <div className='flex items-center gap-2 mb-1'>
                                        <span className='font-semibold text-gray-900'>Online Payment</span>
                                        {paymentMethod === 'onlinePayment' && (
                                            <svg className='w-4 h-4 text-blue-600' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <p className='text-sm text-gray-600'>Pay securely online using credit/debit card or UPI</p>
                                </div>
                                <svg className='w-5 h-5 text-gray-400' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Book Appointment Button - Show when payment method is selected */}
                        {paymentMethod && slotTime && (
                            <div className='mt-6 pt-4 border-t border-gray-200'>
                                <button
                                    onClick={async (e) => {
                                        e.preventDefault()
                                        if (!slotTime) {
                                            toast.error('Please select a time slot')
                                            return
                                        }
                                        if (!token) {
                                            toast.warning('Login to book appointment')
                                            return navigate('/login')
                                        }

                                        // Validate doctor selection
                                        if (!docInfo || !docId) {
                                            toast.error('Please select a doctor first')
                                            return
                                        }

                                        // Book appointment with selected payment method
                                        await bookAppointment()
                                    }}
                                    disabled={!slotTime || isBooking || isProcessingPayment || !paymentMethod}
                                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${!slotTime || isBooking || isProcessingPayment || !paymentMethod
                                        ? 'bg-gray-400 cursor-not-allowed opacity-60'
                                        : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                        }`}
                                >
                                    {isBooking ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Booking Appointment...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Book Appointment</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Cost Breakdown */}
                        {slotTime && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className='mt-6 pt-4 border-t border-gray-200'
                            >
                                {(() => {
                                    const consultationFee = docInfo?.fees || 0
                                    const platformFeePercentage = 5 // 5% platform fee
                                    const gstPercentage = 18 // 18% GST
                                    const platformFee = Math.round((consultationFee * platformFeePercentage) / 100)
                                    const subtotal = consultationFee + platformFee
                                    const gst = Math.round((subtotal * gstPercentage) / 100)
                                    const total = subtotal + gst

                                    return (
                                        <div className='bg-cyan-50 px-4 py-3 rounded-lg border border-cyan-200'>
                                            <p className='text-gray-700 font-semibold text-sm mb-2'>Appointment Cost Breakdown</p>
                                            <div className='space-y-1.5'>
                                                <div className='flex justify-between items-center text-sm'>
                                                    <span className='text-gray-600'>Consultation Fee:</span>
                                                    <span className='font-semibold text-gray-800'>{currencySymbol}{consultationFee}</span>
                                                </div>
                                                <div className='flex justify-between items-center text-sm'>
                                                    <span className='text-gray-600'>Platform Fee ({platformFeePercentage}%):</span>
                                                    <span className='font-semibold text-gray-800'>{currencySymbol}{platformFee}</span>
                                                </div>
                                                <div className='flex justify-between items-center text-sm'>
                                                    <span className='text-gray-600'>GST ({gstPercentage}%):</span>
                                                    <span className='font-semibold text-gray-800'>{currencySymbol}{gst}</span>
                                                </div>
                                                <div className='border-t border-cyan-300 pt-1.5 mt-1.5'>
                                                    <div className='flex justify-between items-center'>
                                                        <span className='text-gray-700 font-bold text-base'>Total:</span>
                                                        <span className='text-cyan-600 font-bold text-lg'>{currencySymbol}{total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Upload Reports Modal */}
                {showUploadModal && (
                    <UploadReportsModal
                        docId={docId}
                        docName={docInfo?.name || 'Doctor'}
                        appointmentId={null}
                        onClose={() => setShowUploadModal(false)}
                        onSuccess={() => {
                            toast.success('Reports uploaded successfully!');
                        }}
                    />
                )}

                {/* Related Doctors - Only show if docInfo exists and has speciality */}
                {docInfo && (docInfo.speciality || docInfo.specialization) && (
                    <RelatedDoctors
                        speciality={docInfo.speciality || docInfo.specialization || 'General Medicine'}
                        docId={docId}
                    />
                )}

            </div>

            {/* Premium Digital Ticket Modal */}
            <AnimatePresence>
                {showTicket && appointmentData && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6" style={{ isolation: 'isolate' }}>
                        {/* Unified Backdrop with Blur */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTicket(false)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-xl -z-10"
                        />

                        {/* Modal Content */}
                        <motion.div
                            key="modal-content"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 300,
                                opacity: { duration: 0.2 }
                            }}
                            className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
                        >
                            {/* Fixed Header: Success Banner */}
                            <div className='bg-gradient-to-r from-blue-600 to-indigo-700 p-5 sm:p-6 md:px-8 md:py-6 flex-shrink-0'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-3 sm:gap-4'>
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                            className='w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0'
                                        >
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </motion.div>
                                        <div>
                                            <h3 className='text-white text-xl sm:text-2xl font-bold leading-tight'>Booking Confirmed</h3>
                                            <p className='text-white/90 text-xs sm:text-sm font-medium mt-1 uppercase tracking-wide'>MediClues Digital Pass</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowTicket(false)}
                                        className='w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0'
                                    >
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Main Scrollable Body */}
                            <div className='flex-1 overflow-y-auto custom-scrollbar bg-white'>
                                {/* Patient Section */}
                                <div className='p-5 sm:p-6 md:p-8 space-y-6'>
                                    {/* Patient Info Card */}
                                    <div className='bg-white rounded-xl p-5 sm:p-6 border border-gray-200'>
                                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                                            <div className='flex items-center gap-4 flex-1 min-w-0'>
                                                <div className='w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0'>
                                                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div className='min-w-0 flex-1'>
                                                    <p className='text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1'>Patient Name</p>
                                                    <h4 className='text-xl sm:text-2xl font-bold text-gray-900 break-words'>{appointmentData.patientName}</h4>
                                                    <p className='text-sm font-mono text-blue-600 mt-1 font-semibold'>#{appointmentData.id}</p>
                                                </div>
                                            </div>
                                            <div className='flex sm:block justify-start sm:text-right'>
                                                <div className='px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase tracking-wide inline-flex items-center gap-2'>
                                                    <span className='w-2 h-2 bg-green-500 rounded-full'></span>
                                                    Confirmed
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grid Info Cards */}
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                        {[
                                            { label: 'Primary Care Doctor', val: appointmentData.doctorName, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-500' },
                                            { label: 'Specialized Care', val: appointmentData.doctorSpecialty, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', iconBg: 'bg-cyan-500' },
                                            { label: 'Appointment Date', val: appointmentData.date, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-500' },
                                            { label: 'Scheduled Time', val: appointmentData.time, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', iconBg: 'bg-orange-500' }
                                        ].map((item, idx) => (
                                            <div key={idx} className={`${item.bg} p-4 sm:p-5 rounded-xl border ${item.border}`}>
                                                <div className='flex items-center gap-2.5 mb-3'>
                                                    <div className={`w-8 h-8 ${item.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                        <svg className={`w-4 h-4 text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                                        </svg>
                                                    </div>
                                                    <p className='text-xs text-gray-600 font-semibold uppercase tracking-wide'>{item.label}</p>
                                                </div>
                                                <p className={`text-sm sm:text-base font-bold ${item.text} break-words`}>{item.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className='relative py-4 mx-6'>
                                    <div className='border-t border-dashed border-gray-300'></div>
                                </div>

                                {/* Bottom Info Section */}
                                <div className='px-5 sm:px-6 md:px-8 pb-6 sm:pb-8 md:pb-10'>
                                    <div className='bg-white rounded-xl p-5 sm:p-6 md:p-8 border border-gray-200'>
                                        <div className='flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start'>
                                            {/* QR Section */}
                                            <div className='w-full lg:w-auto flex flex-col items-center gap-3 lg:border-r lg:border-dashed lg:border-gray-300 lg:pr-8'>
                                                <a 
                                                    href={appointmentData.qrData} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    title="Click to open Verification Check-in (Developer Shortcut)"
                                                    className="p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-cyan-400 hover:shadow-md transition-all duration-200 flex items-center justify-center"
                                                >
                                                    <QRCode value={appointmentData.qrData} size={120} level="H" />
                                                </a>
                                                <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Scan to Check-in</p>
                                            </div>

                                            {/* Cost Section */}
                                            <div className='flex-1 w-full space-y-4'>
                                                <h5 className='text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4'>Payment Summary</h5>
                                                <div className='space-y-3'>
                                                    <div className='flex justify-between items-center text-sm sm:text-base'>
                                                        <span className='text-gray-600'>Professional Fee</span>
                                                        <span className='text-gray-900 font-semibold'>{currencySymbol}{appointmentData.costBreakdown?.consultationFee || appointmentData.price}</span>
                                                    </div>
                                                    {appointmentData.costBreakdown?.platformFee > 0 && (
                                                        <div className='flex justify-between items-center text-sm sm:text-base'>
                                                            <span className='text-gray-600'>Service Charge</span>
                                                            <span className='text-gray-900 font-semibold'>{currencySymbol}{appointmentData.costBreakdown.platformFee}</span>
                                                        </div>
                                                    )}
                                                    <div className='pt-3 mt-2 border-t border-gray-200 flex justify-between items-center'>
                                                        <span className='text-gray-900 font-bold text-base sm:text-lg'>Total Paid</span>
                                                        <span className='text-xl sm:text-2xl font-bold text-blue-600'>{currencySymbol}{appointmentData.price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Footer: Actions */}
                            <div className='p-5 sm:p-6 md:px-8 border-t border-gray-200 bg-gray-50 flex-shrink-0'>
                                <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
                                    <button
                                        onClick={() => { setShowTicket(false); navigate('/my-appointments') }}
                                        className="flex-[2] h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm sm:text-base transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        View Appointments
                                    </button>
                                    <button
                                        onClick={() => setShowTicket(false)}
                                        className="flex-1 h-12 sm:h-14 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm sm:text-base transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}

export default Appointment
