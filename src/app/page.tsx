"use client";
import Image from "next/image";
import Footer from "@/components/footer";

export default function HomePage() {
  return (
    <main>
      {/* HERO SECTION - Light/white background */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 py-20 relative overflow-hidden bg-white">
        <div className="z-10 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-2 text-[#2e2c2f]">
            Enhanced Prepositioning for a
          </h1>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-[#2e2c2f]">
            <span className="text-[#b92727]">Secure and Resilient</span>{" "}
            Community.
          </h1>
          <p className="text-base md:text-lg font-normal max-w-[720px] mx-auto mt-6 px-2 leading-relaxed text-gray-700">
            Visualize hazards, assign responders, and plan smarter with EMERGE's
            data-driven disaster management system.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-10 md:mt-14 z-10">
          <button
            className="bg-[#2e2c2f] text-white px-6 py-3 text-base md:text-lg font-semibold rounded-lg cursor-pointer transition-all duration-300 hover:bg-[#1a1a1a]"
            onClick={() => (window.location.href = "/about")}
          >
            Learn more
          </button>
          <button
            className="bg-[#b92727] text-white px-6 py-3 text-base md:text-lg font-semibold rounded-lg cursor-pointer border-none transition-all duration-300 hover:bg-[#8a1d1d]"
            onClick={() => (window.location.href = "/hazards")}
          >
            View Hazard Map
          </button>
        </div>

        {/* Device Mockup Display */}
        <div className="mt-16 md:mt-20 z-10 max-w-6xl mx-auto px-4">
          <div className="relative">
            <Image
              src="/feature1.png"
              alt="EMERGE Dashboard Preview"
              width={1200}
              height={700}
              className="rounded-lg shadow-2xl w-full h-auto"
            />
          </div>
        </div>

        {/* Powered by text */}
        <div className="mt-12 md:mt-16 z-10 max-w-4xl mx-auto px-6">
          <p className="text-sm md:text-base text-gray-600 text-center leading-relaxed">
            Powered by proprietary algorithms, EMERGE enhances emergency
            response and team allocation through a web-based decision support
            system that analyzes accurate, location-specific data from local
            governments.
          </p>
        </div>
      </section>

      {/* WHAT EMERGE CAN DO - Gray gradient background */}
      <section
        className="bg-gradient-to-b from-gray-400 via-gray-400 to-black py-16 md:py-20 px-4 text-[#f5f5f5] bg-cover"
        // style={{ backgroundImage: "url('/features.png')" }}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            What <span className="text-[#b92727]">EMERGE</span> can do
          </h2>
          <p className="text-center mb-12 md:mb-16 text-base md:text-lg px-2">
            Core features that combine hazard mapping, data clustering, and
            resource optimization
          </p>
        </div>

        <div className="mt-8 md:mt-12 grid grid-cols-1 gap-y-16 md:gap-y-20 max-w-6xl mx-auto px-4">
          {/* Hazard Heatmaps */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
            <div className="md:w-1/2 order-2 md:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/feature1.png"
                  alt="Hazard Heatmaps"
                  width={1200}
                  height={280}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="md:w-1/2 order-1 md:order-2">
              <h3 className="text-3xl md:text-4xl font-bold text-[#b92727] mb-4">
                Hazard Heatmaps
              </h3>
              <p className="text-lg md:text-xl leading-relaxed">
                EMERGE combines hazard data, population density, and geography
                to pinpoint high-risk areas. This visualization helps identify
                where vulnerabilities intersect before disaster strikes.
              </p>
            </div>
          </div>

          {/* Strategic Resource Allocation */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
            <div className="md:w-1/2">
              <h3 className="text-3xl md:text-4xl font-bold text-[#b92727] mb-4">
                Strategic Resource Allocation
              </h3>
              <p className="text-lg md:text-xlleading-relaxed">
                EMERGE uses smart clustering algorithms to assist hazard
                intensity and location, ensuring responders are strategically
                positioned to minimize response time in emergencies.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/feature2.png"
                  alt="Strategic Resource Allocation"
                  width={1200}
                  height={280}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Barangay-Level Risk Insights */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
            <div className="md:w-1/2 order-2 md:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/feature3.png"
                  alt="Emergency-Level Risk Insights"
                  width={1200}
                  height={280}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="md:w-1/2 order-1 md:order-2">
              <h3 className="text-3xl md:text-4xl font-bold text-[#b92727] mb-4">
                Emergency-Level Risk Insights
              </h3>
              <p className="text-lg md:text-xl leading-relaxed">
                By zooming in to help users dive into hazard-prone areas, EMERGE
                can check population zones and determine which spots need urgent
                care, allowing for more localized emergency strategies.
              </p>
            </div>
          </div>

          {/* Data-Driven Recommendations */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
            <div className="md:w-1/2">
              <h3 className="text-3xl md:text-4xl font-bold text-[#b92727] mb-4">
                Data-Driven Recommendations
              </h3>
              <p className="text-lg md:text-xl leading-relaxed">
                EMERGE generates precise recommendations using verified data
                from local government units, ensuring that every decision
                reflects real, location-specific conditions.
              </p>
            </div>
            <div className="md:w-1/2">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/feature4.png"
                  alt="Data-Driven Recommendations"
                  width={1200}
                  height={280}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW EMERGE WORKS - Dark red to black gradient background */}
      <section className="bg-gradient-to-b from-[#8B0000] via-[#450000] to-[#0a0000] py-16 md:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 text-white">
            How <span className="text-[#dde1e4]">EMERGE</span> works
          </h2>
          <p className="text-center text-gray-300 mb-12 md:mb-16 text-base md:text-lg px-2">
            A{" "}
            <span className="text-[#7dc0cc] font-semibold">
              clustering-enhanced GIS workflow
            </span>{" "}
            for hazard assessment and strategic resource allocation
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
            {/* Card 01 */}
            <div className="bg-gradient-to-br from-[#e94d58] to-[#d43d4a] rounded-xl p-6 md:p-7 text-white shadow-lg text-left hover:shadow-xl transition-shadow">
              <div className="bg-white/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">01</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">
                Analyze Historical Data
              </h3>
              <p className="text-sm md:text-base leading-relaxed opacity-95">
                EMERGE uses hazard-prone historical data like floods and
                disaster data
              </p>
            </div>

            {/* Card 02 */}
            <div className="bg-gradient-to-br from-[#e94d58] to-[#d43d4a] rounded-xl p-6 md:p-7 text-white shadow-lg text-left hover:shadow-xl transition-shadow">
              <div className="bg-white/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">02</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">
                Visualize Risk Zones with GIS
              </h3>
              <p className="text-sm md:text-base leading-relaxed opacity-95">
                Hazards appear on an interactive map with heat zones identifying
                vulnerability
              </p>
            </div>

            {/* Card 03 */}
            <div className="bg-gradient-to-br from-[#e94d58] to-[#d43d4a] rounded-xl p-6 md:p-7 text-white shadow-lg text-left hover:shadow-xl transition-shadow">
              <div className="bg-white/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">03</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">
                Response Allocation with Clustering
              </h3>
              <p className="text-sm md:text-base leading-relaxed opacity-95">
                Clustering algorithms group hotspots, enabling smart resource
                positioning
              </p>
            </div>

            {/* Card 04 */}
            <div className="bg-gradient-to-br from-[#e94d58] to-[#d43d4a] rounded-xl p-6 md:p-7 text-white shadow-lg text-left hover:shadow-xl transition-shadow">
              <div className="bg-white/20 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold">04</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">
                Support Planning and Readiness
              </h3>
              <p className="text-sm md:text-base leading-relaxed opacity-95">
                EMERGE suggests strategic pre-deployment options based on area
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERSHIP LOGOS - Very dark background */}
      <section className="bg-gradient-to-b from-[#0a0000] to-[#000000] py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10 md:mb-12">
            Developed in partnership with
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="bg-white rounded-xl p-4 hover:shadow-xl transition-shadow">
              <Image
                src="/wvsu-logo.PNG"
                alt="WVSU Logo"
                width={100}
                height={100}
                className="w-20 h-20 md:w-24 md:h-24 object-contain"
              />
            </div>
            <div className="bg-white rounded-xl p-4 hover:shadow-xl transition-shadow">
              <Image
                src="/cict-logo.PNG"
                alt="CICT Logo"
                width={100}
                height={100}
                className="w-20 h-20 md:w-24 md:h-24 object-contain"
              />
            </div>
            <div className="bg-white rounded-xl p-4 hover:shadow-xl transition-shadow">
              <Image
                src="/sb-logo.png"
                alt="Santa Barbara Logo"
                width={100}
                height={100}
                className="w-20 h-20 md:w-24 md:h-24 object-contain"
              />
            </div>
            <div className="bg-white rounded-xl p-4 hover:shadow-xl transition-shadow">
              <Image
                src="/sbdrrmo.jpg"
                alt="SBDRRMO Logo"
                width={100}
                height={100}
                className="w-20 h-20 md:w-24 md:h-24 object-contain"
              />
            </div>
            <div className="bg-white rounded-xl p-4 hover:shadow-xl transition-shadow">
              <Image
                src="/trrdmo.jpg"
                alt="TRRDMO Logo"
                width={100}
                height={100}
                className="w-20 h-20 md:w-24 md:h-24 object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
