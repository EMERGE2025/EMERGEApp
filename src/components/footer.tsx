import Image from "next/image"
import Link from "next/link"

export default function Footer(){
    return(
    <footer className="bg-[#2e2c2f] text-[#dde1e4] py-6 md:py-12 px-4 md:px-6 shadow-lg mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-6 md:gap-8">
            <div className="flex flex-col items-center md:items-start gap-3 md:min-w-[260px] text-center md:text-left w-full md:w-auto">
                <Image src="/logo.svg" alt="EMERGE Logo" width={80} height={80} className="w-32 md:w-48 h-8 md:h-12 mb-2 transition-transform hover:scale-105" />
                <span className="font-semibold italic text-sm md:text-lg leading-relaxed text-[#f0f2f4] md:ml-4">
                    Emergency Responder Allocation System for Hazard Mapping and Planning
                </span>
            </div>

            <div className="flex flex-col items-center md:items-start gap-2 md:gap-3 text-center md:text-left w-full md:w-auto md:min-w-[180px]">
                <span className="font-bold text-base md:text-xl mb-1 text-[#f0f2f4]">EXPLORE</span>
                <Link href="/" className="hover:text-white md:hover:translate-x-1 transition-all duration-200 text-xs md:text-base">Home</Link>
                <Link href="/hazards" className="hover:text-white md:hover:translate-x-1 transition-all duration-200 text-xs md:text-base">Risk Map</Link>
                <Link href="/about" className="hover:text-white md:hover:translate-x-1 transition-all duration-200 text-xs md:text-base">About Us</Link>
            </div>

            <div className="flex flex-col items-center md:items-start gap-2 md:gap-3 text-center md:text-left w-full md:w-auto md:min-w-[220px]">
                <span className="font-bold text-base md:text-xl mb-1 text-[#f0f2f4]">CONTACTS</span>
                <div className="flex flex-col gap-1 md:gap-2 text-[#dde1e4] text-xs md:text-base">
                    <span className="break-words">Email: emerge.team@wvsu.edu.ph</span>
                    <span>Location: Iloilo City, Philippines</span>
                    <span>GitHub / Portfolio: github.me.com</span>
                </div>
            </div>
        </div>
        <div className="text-center text-[#a0a4a8] mt-6 md:mt-12 text-xs md:text-sm font-medium border-t border-gray-700 pt-4 md:pt-6">
            © EMERGE 2025. All rights reserved.
        </div>
    </footer>
    )
}