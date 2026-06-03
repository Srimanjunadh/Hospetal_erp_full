import { useNavigate } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'

const SpecialityMenu = () => {
    const navigate = useNavigate()
    const scrollRef = useRef(null)
    const [isPaused, setIsPaused] = useState(false)

    const handleSpecialityClick = (speciality) => {
        navigate(`/hospitals?speciality=${encodeURIComponent(speciality)}`)
        window.scrollTo(0, 0)
    }

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth, scrollWidth } = scrollRef.current
            const cardWidth = 324 // approximate card width + gap
            
            if (direction === 'right') {
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
                } else {
                    scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
                }
            } else {
                if (scrollLeft <= 10) {
                    scrollRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' })
                } else {
                    scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' })
                }
            }
        }
    }

    // Auto-slide effect every 3.5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            if (!isPaused) {
                scroll('right')
            }
        }, 3500)

        return () => clearInterval(timer)
    }, [isPaused])

    const allSpecialities = [
        {
            title: 'Cardiology',
            description: 'Advanced heart care solutions',
            image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#f43f5e]', // rose-500
            textColor: 'text-[#f43f5e]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            )
        },
        {
            title: 'Orthopedics',
            description: 'Joint replacement & sports care',
            image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#2563eb]', // blue-600
            textColor: 'text-[#2563eb]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            )
        },
        {
            title: 'Psychiatry',
            description: 'Mental health & counseling',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#8b5cf6]', // violet-500
            textColor: 'text-[#8b5cf6]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            title: 'Ophthalmology',
            description: 'Comprehensive eye care',
            image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#0d9488]', // teal-600
            textColor: 'text-[#0d9488]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            )
        },
        {
            title: 'ENT',
            description: 'Ear, Nose & Throat specialist',
            image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#f59e0b]', // amber-500
            textColor: 'text-[#f59e0b]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                </svg>
            )
        },
        {
            title: 'Dentistry',
            description: 'Complete dental & oral care',
            image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#06b6d4]', // cyan-500
            textColor: 'text-[#06b6d4]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: 'General Medicine',
            description: 'Primary healthcare & wellness',
            image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#10b981]', // emerald-500
            textColor: 'text-[#10b981]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            )
        },
        {
            title: 'Gynecology',
            description: "Women's health & maternity",
            image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#ec4899]', // pink-500
            textColor: 'text-[#ec4899]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            )
        },
        {
            title: 'Dermatology',
            description: 'Advanced skin & hair treatments',
            image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#f97316]', // orange-500
            textColor: 'text-[#f97316]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
            )
        },
        {
            title: 'Pediatrics',
            description: 'Compassionate child healthcare',
            image: 'https://images.unsplash.com/photo-1584516150909-c43483ee7932?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#3b82f6]', // blue-500
            textColor: 'text-[#3b82f6]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: 'Neurology',
            description: 'Expert brain & nerve treatments',
            image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#9333ea]', // purple-600
            textColor: 'text-[#9333ea]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            )
        },
        {
            title: 'Gastroenterology',
            description: 'Digestive health & endoscopy',
            image: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=600&q=80',
            bgColor: 'bg-[#14b8a6]', // teal-500
            textColor: 'text-[#14b8a6]',
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        }
    ]

    return (
        <div id='speciality' className='flex flex-col items-center py-12 sm:py-16 md:py-20 px-4 bg-slate-50/50 overflow-hidden'>
            {/* Top Badge */}
            <div className='inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#e6f7f5] border border-teal-200/60 text-[#0d9488] text-xs font-bold tracking-wider uppercase mb-4 shadow-sm'>
                <span>☆</span> OUR SPECIALTIES
            </div>

            {/* Title */}
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 text-center tracking-tight'>
                World Class <span className='text-[#0d9488]'>Specialties</span>
            </h1>
            <div className='w-20 h-1.5 bg-[#0d9488] mx-auto mt-3 rounded-full'></div>

            {/* Subtitle */}
            <p className='text-slate-600 text-sm sm:text-base md:text-lg text-center max-w-2xl mx-auto mt-4 font-normal'>
                Advanced care. Expert doctors. Better health outcomes.
            </p>

            {/* Carousel Container */}
            <div 
                className='relative w-full max-w-7xl mx-auto mt-12 px-4 sm:px-6'
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                {/* Left Scroll Button */}
                <button 
                    onClick={() => scroll('left')}
                    className='absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-slate-800 w-12 h-12 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-slate-100 hover:scale-110 transition-all flex items-center justify-center focus:outline-none group'
                    aria-label='Scroll Left'
                >
                    <svg className='w-6 h-6 text-slate-700 group-hover:text-[#0d9488] transition-colors' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Scrollable Track */}
                <div 
                    ref={scrollRef}
                    className='flex gap-6 overflow-x-auto scrollbar-hide py-6 px-4 scroll-smooth snap-x snap-mandatory'
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {allSpecialities.map((item, index) => (
                        <div
                            onClick={() => handleSpecialityClick(item.title)}
                            className='snap-start shrink-0 w-[280px] sm:w-[300px] bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_30px_rgba(13,148,136,0.15)] hover:-translate-y-2 transition-all duration-300 flex flex-col border border-slate-100 group cursor-pointer'
                            key={index}
                        >
                            {/* Top Image */}
                            <div className='relative h-48 w-full overflow-hidden bg-slate-100'>
                                <img
                                    className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                                    src={item.image}
                                    alt={item.title}
                                />
                            </div>

                            {/* Content Box */}
                            <div className='relative pt-8 pb-6 px-4 flex flex-col items-center flex-1 bg-white'>
                                {/* Overlapping Icon Circle */}
                                <div className={`absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full ${item.bgColor} flex items-center justify-center text-white shadow-lg border-4 border-white transition-transform duration-300 group-hover:scale-110`}>
                                    {item.icon}
                                </div>

                                {/* Specialty Title */}
                                <h3 className='text-lg font-bold text-slate-900 text-center mb-1 group-hover:text-[#0d9488] transition-colors duration-300'>
                                    {item.title}
                                </h3>

                                {/* Description */}
                                <p className='text-xs text-slate-500 text-center mb-6 line-clamp-2 max-w-[180px]'>
                                    {item.description}
                                </p>

                                {/* Link Button */}
                                <div className={`mt-auto ${item.textColor} font-semibold text-xs flex items-center gap-1 group-hover:underline`}>
                                    Learn More
                                    <svg className='w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Scroll Button */}
                <button 
                    onClick={() => scroll('right')}
                    className='absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-slate-800 w-12 h-12 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-slate-100 hover:scale-110 transition-all flex items-center justify-center focus:outline-none group'
                    aria-label='Scroll Right'
                >
                    <svg className='w-6 h-6 text-slate-700 group-hover:text-[#0d9488] transition-colors' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Bottom Button */}
            <div className='mt-12 text-center'>
                <button
                    onClick={() => {
                        navigate('/hospitals')
                        window.scrollTo(0, 0)
                    }}
                    className='bg-[#008080] hover:bg-[#006666] text-white font-medium px-8 py-3.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg inline-flex items-center gap-2 text-sm sm:text-base'
                >
                    Explore All Specialties
                    <svg className='w-4 h-4' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default SpecialityMenu
