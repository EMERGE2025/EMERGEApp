import React from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/footer";

export default function AboutPage() {
  return (
    <div>
      <main className="min-h-screen bg-[#f5f6fa] flex flex-col items-center py-8 md:py-12 px-4">
        <section className="max-w-4xl w-full text-center mb-8 md:mb-12">
          <Image
            src="/logo.svg"
            width={80}
            height={80}
            alt="EMERGE Logo"
            className="mx-auto w-12 h-12 md:w-16 md:h-16 mb-6 md:mb-8 animate-bounce"
          />
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#b92727] mb-4 md:mb-6">
            About EMERGE
          </h1>
          <p className="text-sm md:text-lg text-gray-700 mb-4 leading-relaxed">
            <span className="font-semibold text-[#b92727]">EMERGE</span> is an
            undergraduate thesis project that enhances emergency response team
            allocation and prepositioning. It combines a Risk-based Emergency
            Modelling Algorithm (REM) and a Resource Allocation Method (RAM)
            with Geographic Information Systems (GIS) for hazard visualization.
            <br />
            <br />
            This system boosts disaster preparedness and response efficiency by
            analyzing emergency reports, visualizing risks on a GIS platform,
            and prepositioning emergency resource teams through clustering
            algorithms. Focusing on natural disasters like floods, landslides,
            and earthquakes in Santa Barbara, Iloilo City, EMERGE provides
            hazard probability mapping and resource placement recommendations,
            optimizing responder and equipment deployment to minimize casualties
            and damages.
          </p>
        </section>

        <section className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          <div className="bg-white rounded-2xl shadow p-6 md:p-8 flex flex-col items-center">
            <span className="text-2xl md:text-3xl mb-2">🎯</span>
            <h2 className="text-xl md:text-2xl font-bold text-[#b92727] mb-2">
              Our Mission
            </h2>
            <p className="text-sm md:text-base text-gray-700 text-center">
              To enhance emergency preparedness and response efficiency by
              strategically prepositioning response teams and resources using
              risk assessment and GIS visualization.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6 md:p-8 flex flex-col items-center">
            <span className="text-2xl md:text-3xl mb-2">🌈</span>
            <h2 className="text-xl md:text-2xl font-bold text-[#b92727] mb-2">
              Our Vision
            </h2>
            <p className="text-sm md:text-base text-gray-700 text-center">
              Empowered communities and improve overall resilience against
              hazards through data-driven emergency management
            </p>
          </div>
        </section>

        <section className="max-w-5xl w-full mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-[#b92727] mb-6 md:mb-8">
            Meet the Team
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8 w-full">
            <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6 flex flex-col items-center hover:scale-105 transition-transform duration-300">
              <Image
                src="/dhom.png"
                alt="Dev 1"
                width={80}
                height={80}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full mb-2 md:mb-3 border-2 md:border-4 border-[#b92727] object-cover"
              />
              <h3 className="text-sm md:text-xl font-bold text-[#b92727] text-center leading-tight">
                Dhominick John Billena
              </h3>
              <p className="text-gray-700 text-xs md:text-sm mb-1">
                Project Leader
              </p>
              <span className="text-xs text-gray-500 text-center hidden md:block">
                " Turns plans into buttons, code, and magic."
              </span>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6 flex flex-col items-center hover:scale-105 transition-transform duration-300">
              <Image
                src="/berg.png"
                alt="Dev 2"
                width={80}
                height={80}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full mb-2 md:mb-3 border-2 md:border-4 border-[#b92727] object-cover"
              />
              <h3 className="text-sm md:text-xl font-bold text-[#b92727] text-center leading-tight">
                Mauricio Manuel Bergancia
              </h3>
              <p className="text-gray-700 text-xs md:text-sm mb-1">
                System Architect
              </p>
              <span className="text-xs text-gray-500 text-center hidden md:block">
                "Draws the map before anyone starts the journey."
              </span>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6 flex flex-col items-center hover:scale-105 transition-transform duration-300">
              <Image
                src="/cha.png"
                alt="Dev 3"
                width={80}
                height={80}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full mb-2 md:mb-3 border-2 md:border-4 border-[#b92727] object-cover"
              />
              <h3 className="text-sm md:text-xl font-bold text-[#b92727] text-center leading-tight">
                Mherlie Joy Chavez
              </h3>
              <p className="text-gray-700 text-xs md:text-sm mb-1">
                Project Manager
              </p>
              <span className="text-xs text-gray-500 text-center hidden md:block">
                "Schedules the chaos and makes it look easy."
              </span>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6 flex flex-col items-center hover:scale-105 transition-transform duration-300">
              <Image
                src="/cal.png"
                alt="Dev 4"
                width={80}
                height={80}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full mb-2 md:mb-3 border-2 md:border-4 border-[#b92727] object-cover"
              />
              <h3 className="text-sm md:text-xl font-bold text-[#b92727] text-center leading-tight">
                Gillie Calanuga
              </h3>
              <p className="text-gray-700 text-xs md:text-sm mb-1">
                System Documentator
              </p>
              <span className="text-xs text-gray-500 text-center hidden md:block">
                "Keeps the system alive, awake, and updated."
              </span>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl shadow p-4 md:p-6 flex flex-col items-center hover:scale-105 transition-transform duration-300 col-span-2 md:col-span-1 mx-auto">
              <Image
                src="/tua.jpg"
                alt="Dev 5"
                width={80}
                height={80}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full mb-2 md:mb-3 border-2 md:border-4 border-[#b92727] object-cover"
              />
              <h3 className="text-sm md:text-xl font-bold text-[#b92727] text-center leading-tight">
                Michael Rey Tuando
              </h3>
              <p className="text-gray-700 text-xs md:text-sm mb-1">
                UI/UX Architect
              </p>
              <span className="text-xs text-gray-500 text-center hidden md:block">
                "Makes sure users smile, not squint. "
              </span>
            </div>
          </div>
        </section>

        <section className="max-w-4xl w-full text-center mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-[#b92727] mb-4 md:mb-6">
            A Thesis with a Purpose
          </h2>
          <p className="text-sm md:text-base text-gray-700 mb-2">
            EMERGE is an undergraduate thesis project developed by Bachelor of
            Science in Computer Science students at West Visayas State
            University.
          </p>
          <p className="text-sm md:text-base text-gray-700 mb-2">
            While fulfilling academic requirements, its aim is to provide
            real-world impact by enhancing disaster response efforts through
            hazard visualization and optimized resource distribution. The
            project seeks to empower local communities, responders, and
            government agencies like the Iloilo City CDRRMO and NDRRMC with
            data-driven technology to strategically deploy resources, plan
            evacuations, and improve preparedness.
          </p>
        </section>

        <section className="max-w-3xl w-full text-center mt-8 md:mt-12 mb-8 md:mb-10">
          <h2 className="text-xl md:text-2xl font-bold text-[#b92727] mb-2 md:mb-4">
            Contact Us
          </h2>
          <p className="text-sm md:text-base text-gray-700 mb-2">
            Email:{" "}
            <Link
              href="mailto:emerge.team@wvsu.edu.ph"
              className="text-[#b92727] underline"
            >
              emerge.team@wvsu.edu.ph
            </Link>
          </p>
          <p className="text-sm md:text-base text-gray-700 mb-2">
            Location: Iloilo City, Philippines
          </p>
          <p className="text-sm md:text-base text-gray-700 mb-2">
            GitHub / Portfolio:{" "}
            <Link
              href="https://github.me.com"
              className="text-[#b92727] underline"
            >
              github.me.com
            </Link>
          </p>
          <p className="text-xs md:text-base text-gray-500 mt-4">
            Thank you for supporting our mission to make Santa Barbara safer and
            more resilient! <span className="text-xl md:text-2xl">💖</span>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
