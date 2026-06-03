import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { toast } from 'react-toastify'
import BackArrow from '../components/BackArrow'
import BackButton from '../components/BackButton'

const BookService = () => {
    const { backendUrl } = useAppContext()
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        user_name: '',
        email: '',
        appointment_date: '',
        appointment_time: '',
        service_type: 'General Checkup'
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            const res = await fetch(`${backendUrl}/api/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Appointment booked successfully!')
                setFormData({
                    user_name: '',
                    email: '',
                    appointment_date: '',
                    appointment_time: '',
                    service_type: 'General Checkup'
                })
            } else {
                toast.error(data.message || 'Failed to book appointment.')
            }
        } catch (error) {
            toast.error('Something went wrong.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="mb-6 flex items-center gap-4">
                <BackArrow />
                <BackButton to="/" label="Back to Home" />
            </div>

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900">Book a <span className="text-cyan-500">Service</span></h1>
                <p className="text-gray-500 mt-2">Choose your service and preferred time. Our team will contact you for confirmation.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                name="user_name"
                                required
                                value={formData.user_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                placeholder="Enter your name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                placeholder="Enter your email"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                            <input
                                type="date"
                                name="appointment_date"
                                required
                                value={formData.appointment_date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                            <input
                                type="time"
                                name="appointment_time"
                                required
                                value={formData.appointment_time}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                            <select
                                name="service_type"
                                value={formData.service_type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                            >
                                <option>General Checkup</option>
                                <option>Lab Test</option>
                                <option>Blood Donation</option>
                                <option>Vaccination</option>
                                <option>Consultation</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-cyan-500/30 transition-all hover:-translate-y-0.5"
                        >
                            {submitting ? 'Booking...' : 'Book Appointment Now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default BookService
