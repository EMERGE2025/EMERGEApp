"use client";
import Image from "next/image";
import Footer from "@/components/footer";

import {
  ChartBarIcon,
  GlobeIcon,
  MapPinIcon,
  UsersIcon,
} from "@phosphor-icons/react";

export default function HomePage() {
  return (
    <main>
      <section className="min-h-[80vh] md:min-h-[90vh] flex flex-col justify-center items-center text-white text-center px-4 py-12 md:p-8 relative bg-cover bg-center bg-blend-color bg-[#9f3122]">
        <div className="z-10 max-w-4xl">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Enhanced Emergency Response,
          </h1>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Tailored for Santa Barbara, Iloilo
          </h1>
          <p className="text-sm md:text-base font-normal max-w-[690px] mx-auto mt-4 px-2">
            EMERGE is an emergency management system that visualizes hazards,
            analyzes risk zones, and optimizes resource allocation using a
            clustering algorithm—empowering responders and protecting
            communities.
          </p>
        </div>

        <button
          className="bg-[#dde1e4] text-[#b92727] px-6 py-3 text-base md:text-lg font-bold rounded-2xl cursor-pointer mt-8 md:mt-12 border-none transition-all duration-300 z-10 hover:bg-[#b92727] hover:text-white"
          onClick={() => (window.location.href = "/hazards")}
        >
          View Risk Map
        </button>

        <div className="absolute inset-0 w-full h-full z-0" />
      </section>

      <section className="bg-[#dde1e4] py-10 md:py-15 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 mt-6 text-[#2e2c2f]">
            How <span className="text-[#b92727]">EMERGE</span> works
          </h2>
          <p className="text-center text-gray-700 mb-8 md:mb-12 text-sm md:text-base px-2">
            A clustering-enhanced GIS workflow for hazard assessment and
            strategic resource allocation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-gradient-to-b from-[#e94d58] to-[#e94d58]/80 rounded-2xl p-5 md:p-6 text-white shadow text-left">
              <div className="flex items-center mb-3 md:mb-4">
                <MapPinIcon
                  size={28}
                  weight="bold"
                  className="text-white md:w-8 md:h-8"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                Identify Hazard Areas
              </h3>
              <p className="text-xs md:text-sm">
                EMERGE uses historical records of floods, earthquakes, and
                landslides in{` `}
                <span className="font-bold"> Santa Barbara, Iloilo</span> to
                identify hazard-prone areas.
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#e94d58] to-[#e94d58]/80 rounded-2xl p-5 md:p-6 text-white shadow text-left">
              <div className="flex items-center mb-3 md:mb-4">
                <GlobeIcon
                  size={28}
                  weight="bold"
                  className="text-white md:w-8 md:h-8"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                Visualize Risk Zones
              </h3>
              <p className="text-xs md:text-sm">
                Hazards are plotted on an interactive GIS map, showing heat
                zones and vulnerability levels based on past data.
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#e94d58] to-[#e94d58]/80 rounded-2xl p-5 md:p-6 text-white shadow text-left">
              <div className="flex items-center mb-3 md:mb-4">
                <UsersIcon
                  size={28}
                  weight="bold"
                  className="text-white md:w-8 md:h-8"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                Resource Clustering
              </h3>
              <p className="text-xs md:text-sm">
                Our system applies a clustering algorithm to suggest efficient
                responder and supply distribution based on population density
                and risk severity.
              </p>
            </div>
            <div className="bg-gradient-to-b from-[#e94d58] to-[#e94d58]/80 rounded-2xl p-5 md:p-6 text-white shadow text-left">
              <div className="flex items-center mb-3 md:mb-4">
                <ChartBarIcon
                  size={28}
                  weight="bold"
                  className="text-white md:w-8 md:h-8"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                Strategic Planning
              </h3>
              <p className="text-xs md:text-sm">
                EMERGE recommends optimal responder assignments and
                pre-positioning strategies for high-risk zones.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#650000] py-10 md:py-15 px-4">
        <div className="max-w-5xl mx-auto text-[#dde1e4]">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-3 mt-6">
            What <span className="text-[#dde1e4]">EMERGE</span> can do
          </h2>
          <p className="text-center text-[#dde1e4] mb-8 md:mb-12 text-sm md:text-base px-2">
            Core features that combine hazard mapping, data clustering, and
            resource optimization.
          </p>
        </div>

        <div className="mt-8 md:mt-16 grid grid-cols-1 gap-y-12 md:gap-y-24 max-w-6xl mx-auto px-4">
          <div className="flex flex-col gap-4">
            <h3 className="text-2xl md:text-3xl font-bold text-[#dde1e4]">
              Hazard Heatmaps
            </h3>
            <p className="text-base md:text-lg text-[#dde1e4]">
              Visualize vulnerable areas using layered historical data.
            </p>
            <div className="bg-[#dde1e4] rounded-2xl w-full h-[200px] md:h-[280px]" />
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-2xl md:text-3xl font-bold text-[#dde1e4]">
              Strategic Resource Allocation
            </h3>
            <p className="text-base md:text-lg text-[#dde1e4]">
              Smart deployment of responders based on hazard clustering.
            </p>
            <div className="bg-[#dde1e4] rounded-2xl w-full h-[200px] md:h-[280px]" />
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-2xl md:text-3xl font-bold text-[#dde1e4]">
              Barangay-Level Risk Insights
            </h3>
            <p className="text-base md:text-lg text-[#dde1e4]">
              Zoom in to identify at-risk areas and population density.
            </p>
            <div className="bg-[#dde1e4] rounded-2xl w-full h-[200px] md:h-[280px]" />
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-2xl md:text-3xl font-bold text-[#dde1e4]">
              Data-Driven Recommendations
            </h3>
            <p className="text-base md:text-lg text-[#dde1e4]">
              Support planning with location-based suggestions and risk
              prioritization.
            </p>
            <div className="bg-[#dde1e4] rounded-2xl w-full h-[200px] md:h-[280px]" />
          </div>
        </div>
      </section>

      <section className="bg-[#dde1e4] py-8 md:py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-6 md:mb-10">
            <div className="h-1 md:h-2 w-12 md:w-20 bg-[#b92727] mr-2 md:mr-4" />
            <h2 className="text-lg md:text-3xl font-bold text-[#222] whitespace-nowrap">
              Developed in Coordination With
            </h2>
            <div className="flex-1 h-1 md:h-2 bg-[#b92727] ml-2" />
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Image
              src="/wvsu-logo.PNG"
              alt="Logo 1"
              width={80}
              height={80}
              className="rounded-xl w-16 h-16 md:w-28 md:h-28 object-contain"
            />
            <Image
              src="/cict-logo.PNG"
              alt="Logo 2"
              width={80}
              height={80}
              className="rounded-xl w-16 h-16 md:w-28 md:h-28 object-contain"
            />
            <Image
              src="/sb-logo.png"
              alt="Logo 3"
              width={80}
              height={80}
              className="rounded-xl w-16 h-16 md:w-28 md:h-28 object-contain"
            />
            <Image
              src="/sbdrrmo.jpg"
              alt="Logo 4"
              width={80}
              height={80}
              className="rounded-xl w-16 h-16 md:w-28 md:h-28 object-contain"
            />
            <Image
              src="/trrdmo.jpg"
              alt="Logo 5"
              width={80}
              height={80}
              className="rounded-xl w-16 h-16 md:w-28 md:h-28 object-contain"
            />
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#b92727] to-[#3f0000]/80 py-10 md:py-15 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl mb-4 text-[#dde1e4]">
            Want to know more about{" "}
            <span className="text-[#dde1e4] font-bold">EMERGE</span>?
          </h2>
          <p className="text-sm md:text-md text-[#dde1e4] mb-6 md:mb-8 px-4">
            Read more about how EMERGE helps in building a safer, more resilient
            community.
          </p>
          <button
            className="bg-[#dde1e4] text-[#b92727] px-6 py-2 text-base md:text-lg font-bold rounded-2xl cursor-pointer mt-3 md:mt-5 border-none transition-all duration-300 z-10 hover:bg-[#b92727] hover:text-white"
            onClick={() => (window.location.href = "/about")}
          >
            About EMERGE
          </button>
        </div>
      </section>
      <Footer />
    </main>
  );
}
