import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const ContactUs = () => {
    const navigate = useNavigate();

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [enquiry, setEnquiry] = useState('');

    // Route form submission directly to your WhatsApp
    const handleWhatsAppSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Format the message cleanly
        const message = `*New Farma Contact Form*\n\n*Name:* ${name}\n*Email:* ${email}\n*Phone:* ${phone}\n\n*Enquiry:* ${enquiry}`;
        const encodedMessage = encodeURIComponent(message);
        
        // Open WhatsApp in a new tab with your number and the pre-filled message
        window.open(`https://wa.me/2349137772112?text=${encodedMessage}`, '_blank');
        
        // Optional: clear form after sending
        setName(''); setEmail(''); setPhone(''); setEnquiry('');
    };

    return (
        <div className="min-h-screen bg-[#ECE6D6] text-[#161F17] font-['IBM_Plex_Sans',sans-serif] selection:bg-[#3F6B47] selection:text-white pb-16">
            
            {/* ===== NAV HEADER ===== */}
            <header className="bg-[#101B14] border-b border-[#F2EFE3]/10 text-[#F2EFE3]">
                <div className="max-w-[1180px] mx-auto px-4 sm:px-8 flex items-center justify-between h-[72px]">
                    <button onClick={() => navigate('/')} className="font-['Fraunces',serif] font-semibold text-[1.4rem] flex items-center gap-2 cursor-pointer">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D9A63E]"></span>
                        Farma
                    </button>
                    <button onClick={() => navigate('/')} className="text-[0.92rem] opacity-80 hover:opacity-100 transition-opacity flex items-center gap-2">
                        ← Back to Home
                    </button>
                </div>
            </header>

            {/* ===== HERO SECTION ===== */}
            <section className="relative bg-[#101B14] text-[#F2EFE3] overflow-hidden py-20 text-center">
                <div className="absolute inset-0 opacity-90" style={{
                    background: `repeating-linear-gradient(180deg, transparent 0 64px, rgba(63,107,71,0.16) 64px 66px), linear-gradient(180deg, transparent 55%, #101B14 100%)`
                }}></div>
                <div className="relative z-10 max-w-[1180px] mx-auto px-4 sm:px-8">
                    <h1 className="font-['Fraunces',serif] font-medium text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] mb-3">
                        Contact Us
                    </h1>
                    <p className="text-[#8FA091] text-[1.1rem]">
                        We are here to answer all your agribusiness and technical questions.
                    </p>
                </div>
            </section>

            {/* ===== DEPARTMENT GRID ===== */}
            <section className="max-w-[1180px] mx-auto px-4 sm:px-8 py-16">
                <h2 className="font-['Fraunces',serif] text-2xl sm:text-3xl font-semibold text-center text-[#101B14] mb-10">
                    Contact by Service or Department
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "General Enquiry", email: "support@farma.com.ng" },
                        { title: "Technical Support", email: "support@farma.com.ng" },
                        { title: "Enterprise Sales", email: "support@farma.com.ng" },
                        { title: "Partnerships", email: "support@farma.com.ng" }
                    ].map((dept, i) => (
                        <div key={i} className="bg-[#F5F1E6] border border-[#101B14]/10 rounded-md p-6 text-center shadow-sm hover:border-[#3F6B47]/40 transition-colors">
                            <h3 className="font-bold text-[#101B14] mb-2">{dept.title}:</h3>
                            <a href={`mailto:${dept.email}`} className="font-['IBM_Plex_Mono',monospace] text-[0.85rem] text-[#3F6B47] hover:underline">
                                {dept.email}
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== SPLIT FORM & MAP SECTION ===== */}
            <section className="max-w-[1180px] mx-auto px-4 sm:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
                    
                    {/* Left: Contact Form */}
                    <div className="bg-[#101B14] rounded-xl p-8 sm:p-10 shadow-xl border border-[#101B14]/20 flex flex-col">
                        <h3 className="font-['Fraunces',serif] text-2xl font-semibold text-[#F2EFE3] mb-6">
                            Drop us a message!
                        </h3>
                        
                        <form onSubmit={handleWhatsAppSubmit} className="flex flex-col gap-5 flex-1">
                            <input 
                                type="text" 
                                placeholder="Name" 
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#F5F1E6] text-[#101B14] placeholder-[#101B14]/50 px-4 py-3.5 rounded-sm outline-none focus:ring-2 focus:ring-[#D9A63E] font-medium"
                            />
                            <input 
                                type="email" 
                                placeholder="Email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#F5F1E6] text-[#101B14] placeholder-[#101B14]/50 px-4 py-3.5 rounded-sm outline-none focus:ring-2 focus:ring-[#D9A63E] font-medium"
                            />
                            <input 
                                type="tel" 
                                placeholder="Phone" 
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-[#F5F1E6] text-[#101B14] placeholder-[#101B14]/50 px-4 py-3.5 rounded-sm outline-none focus:ring-2 focus:ring-[#D9A63E] font-medium"
                            />
                            <textarea 
                                placeholder="Enquiry" 
                                required
                                rows={5}
                                value={enquiry}
                                onChange={(e) => setEnquiry(e.target.value)}
                                className="w-full bg-[#F5F1E6] text-[#101B14] placeholder-[#101B14]/50 px-4 py-3.5 rounded-sm outline-none focus:ring-2 focus:ring-[#D9A63E] font-medium resize-none"
                            ></textarea>
                            
                            <button 
                                type="submit" 
                                className="mt-auto w-full sm:w-auto self-start bg-[#F2EFE3] text-[#101B14] font-bold tracking-wide uppercase text-sm px-10 py-3.5 rounded-sm hover:bg-[#D9A63E] transition-colors shadow-md"
                            >
                                Submit via WhatsApp
                            </button>
                        </form>
                    </div>

                    {/* Right: Google Map */}
                    <div className="bg-[#F5F1E6] rounded-xl border border-[#101B14]/10 p-2 shadow-sm h-[400px] lg:h-auto min-h-[400px]">
                        <iframe
                            title="Farma Location"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0, borderRadius: '8px' }}
                            src="https://maps.google.com/maps?q=Yoaco,%20Ogbomoso,%20Oyo%20State,%20Nigeria&t=&z=14&ie=UTF8&iwloc=&output=embed"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>

                </div>
            </section>
        </div>
    );
};