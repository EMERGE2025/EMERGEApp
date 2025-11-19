import Image from "next/image"
import Link from "next/link"

export default function Footer(){
    return(
    <footer className="bg-gradient-to-b from-[#000000] to-[#0a0a0a] text-white py-12 md:py-16 px-4 md:px-6 mb-16 md:mb-0">
        {/* Logo and Branding Section */}
        <div className="max-w-7xl mx-auto text-center mb-8 md:mb-12">
            <div className="flex justify-center mb-4">
                <Image
                    src="/logo.svg"
                    alt="EMERGE Logo"
                    width={120}
                    height={40}
                    className="h-10 md:h-12 w-auto"
                />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">EMERGE</h3>
        </div>

        {/* Navigation Links */}
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-6 md:gap-8 mb-8 md:mb-10">
            <Link href="/" className="text-sm md:text-base hover:text-[#b92727] transition-colors duration-200 font-medium">
                HOME
            </Link>
            <Link href="/hazards" className="text-sm md:text-base hover:text-[#b92727] transition-colors duration-200 font-medium">
                HAZARD VISUALIZATION
            </Link>
            <Link href="/responder-allocation" className="text-sm md:text-base hover:text-[#b92727] transition-colors duration-200 font-medium">
                RESPONDER ALLOCATION
            </Link>
            <Link href="/about" className="text-sm md:text-base hover:text-[#b92727] transition-colors duration-200 font-medium">
                ABOUT US
            </Link>
        </div>

        {/* Social/Contact Icons (optional - can be added if needed) */}
        <div className="max-w-7xl mx-auto flex justify-center gap-4 mb-8">
            {/* Social media icons can be added here */}
        </div>

        {/* Copyright */}
        <div className="max-w-7xl mx-auto text-center border-t border-gray-800 pt-6 md:pt-8">
            <p className="text-xs md:text-sm text-gray-400">
                Copyright ©2025. All rights reserved
            </p>
        </div>
    </footer>
    )
}