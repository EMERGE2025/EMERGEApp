import Image from "next/image"
import Link from "next/link"

export default function Footer(){
    return(
    <footer className="bg-[#2e2c2f] text-[#dde1e4] py-8 md:py-12 px-4 md:px-6 mt-0 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-start gap-8 md:gap-4">
            {/* Logo and Tagline Section */}
            <div className="flex flex-col items-center md:items-start gap-4 min-w-[260px] text-center md:text-left">
                <Image src="/logo.svg" alt="EMERGE Logo" width={100} height={100} className="w-40 md:w-52 h-10 md:h-12 mb-3 transition-transform hover:scale-105" />
                <span className="font-semibold italic text-base md:text-lg leading-relaxed text-[#f0f2f4] md:ml-4">
                    Emergency Responder Allocation<br />
                    System for<br />
                    Hazard Mapping and Planning
                </span>
            </div>

            {/* Navigation Links Section */}
            <div className="flex flex-col items-center md:items-start gap-3 min-w-[180px] text-center md:text-left">
                <span className="font-bold text-lg md:text-xl mb-2 text-[#f0f2f4]">EXPLORE</span>
                <Link href="/" className="hover:text-white hover:translate-x-1 transition-all duration-200 text-sm md:text-base">Home</Link>
                <Link href="/risk-map" className="hover:text-white hover:translate-x-1 transition-all duration-200 text-sm md:text-base">Risk Map</Link>
                <Link href="/hazard-visualization" className="hover:text-white hover:translate-x-1 transition-all duration-200 text-sm md:text-base">Hazard Visualization</Link>
                <Link href="/responder-allocation" className="hover:text-white hover:translate-x-1 transition-all duration-200 text-sm md:text-base">Responder Allocation</Link>
                <Link href="/about" className="hover:text-white hover:translate-x-1 transition-all duration-200 text-sm md:text-base">About Us</Link>
            </div>

            {/* Contact Information Section */}
            <div className="flex flex-col items-center md:items-start gap-3 min-w-[220px] text-center md:text-left">
                <span className="font-bold text-lg md:text-xl mb-2 text-[#f0f2f4]">CONTACTS</span>
                <div className="flex flex-col gap-2 text-[#dde1e4] hover:text-white transition-colors text-sm md:text-base">
                    <span>Email: emerge.team@wvsu.edu.ph</span>
                    <span>Location: Iloilo City, Philippines</span>
                    <span>GitHub / Portfolio: github.me.com</span>
                </div>
            </div>
        </div>
        <div className="text-center text-[#a0a4a8] mt-12 text-sm font-medium border-t border-gray-700 pt-6">
            © EMERGE 2025. All rights reserved.
        </div>
    </footer>
    )
}