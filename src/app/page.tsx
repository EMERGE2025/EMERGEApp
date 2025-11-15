'use client';
import Image from 'next/image';

import { 
ChartBarIcon, 
GlobeIcon, 
MapPinIcon, 
PlayCircleIcon, 
UsersIcon
} from '@phosphor-icons/react';

export default function HomePage() {
  return (
      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-[#fafafa] to-[#f0f0f2]">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] md:w-[800px] h-[500px] md:h-[800px] rounded-full bg-[#ffebe9] opacity-40 blur-[80px] pointer-events-none" aria-hidden />
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 md:py-28 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1C1C1C] leading-tight">
              Enhanced Prepositioning for a
              <span className="block mt-2">
                <span className="text-[#1C1C1C]"> </span>
                <span className="text-[#1C1C1C"> </span>
                <span className="text-[#E53935]">Secure and Resilient</span>
                <span className="text-[#1C1C1C]"> Community.</span>
              </span>
            </h1>

            <p className="mt-3 sm:mt-4 max-w-2xl mx-auto text-xs sm:text-sm md:text-base text-[#1C1C1C]">
              Visualize hazards, assign responders, and plan smarter with EMERGE's data-driven disaster management system.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white text-[#333] border border-gray-200 shadow-sm text-xs sm:text-sm font-semibold hover:shadow-md transition"
                onClick={() => (window.location.href = '/about')}
              >
                Learn more
              </button>

              <button
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-[#E53935] text-white text-xs sm:text-sm font-semibold hover:bg-[#a21f1f] transition"
                onClick={() => (window.location.href = '/risk-map')}
              >
                View hazard map
              </button>
            </div>

            <div className="mt-10 sm:mt-16 flex flex-col items-center justify-center">
              <div className="w-full max-w-[280px] sm:max-w-[600px] md:max-w-[900px] flex justify-center">
                <Image
                  src="/images/pc-2x.png"
                  width={920}
                  height={560}
                  className="w-full h-auto object-contain"
                  priority alt={''}                
                />
              </div>

              <p className="mt-3 sm:mt-4 max-w-full sm:max-w-4xl px-4 text-center text-xs sm:text-sm md:text-base text-[#1C1C1C]">
                Powered by proprietary algorithms, EMERGE enhances emergency response and team allocation through a web-based decision support system built around accurate, location-specific data from local governments.
              </p>
            </div>
          </div>

          <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-10" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)', backgroundSize: '4px 4px' }} aria-hidden />
        </section>

        <section className="bg-gradient-to-b from-[#fafafa] to-[#f0f0f2]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1C1C1C]">
              What <span className="text-[#E53935]">EMERGE</span> can do
            </h2>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-[#1C1C1C] max-w-2xl mx-auto px-2">
              Core features that combine hazard mapping, data clustering, and resource optimization
            </p>
          </div>

          <div className="mt-12 sm:mt-20 max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20 space-y-12 sm:space-y-20">
            <div className="mt-12 sm:mt-20 max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20 space-y-12 sm:space-y-20">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
              <div className="w-full md:w-1/2 text-left">
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#E53935]">Hazard Heatmaps</h3>
                <p className="mt-8 sm:mt-3 text-xs sm:text-sm md:text-base text-[#1C1C1C] max-w-md">
                  EMERGE combines hazard data, population density, and geography to pinpoint high‑risk areas. This visualization empowers decision‑makers to identify vulnerabilities before disaster hits.
                </p>
              </div>

               <div className="w-full md:w-1/2 flex justify-center">
                <div className="w-full max-w-[280px] sm:max-w-[400px] md:max-w-[600px]">
                  <Image
                    src="/images/F1.png"
                    alt="Hazard Heatmaps"
                    width={1020}
                    height={820}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
            </div>
            

            <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-6 md:gap-8">
              <div className="w-full md:w-1/2 text-left">
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#E53935]">Data-Driven Recommendations</h3>
                <p className="mt-8 sm:mt-3 text-xs sm:text-sm md:text-base text-[#1C1C1C] max-w-md">
                  EMERGE uses smart clustering algorithms to assess hazard intensity and location, ensuring responders are deployed quickly and effectively where they're needed most.
                </p>
              </div>

              <div className="w-full md:w-1/2 flex justify-center">
                <div className="w-full max-w-[280px] sm:max-w-[400px] md:max-w-[600px]">
                  <Image
                    src="/images/F2.png"
                    alt="Strategic Resource Allocation"
                    width={520}
                    height={320}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>

             <div className="mt-12 sm:mt-20 max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-20 space-y-12 sm:space-y-20">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
              <div className="w-full md:w-1/2 text-left">
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#E53935]">Barangay-Level Insights</h3>
                <p className="mt-8 sm:mt-3 text-xs sm:text-sm md:text-base text-[#1C1C1C] max-w-md">
                  EMERGE provides granular hazard analysis at the barangay level, allowing local governments to tailor emergency response plans and resource allocation to the specific needs of each community.
                </p>
              </div>

               <div className="w-full md:w-1/2 flex justify-center">
                <div className="w-full max-w-[280px] sm:max-w-[400px] md:max-w-[600px]">
                  <Image
                    src="/images/F3.png"
                    alt="Hazard Heatmaps"
                    width={1020}
                    height={820}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-6 md:gap-8">
              <div className="w-full md:w-1/2 text-left">
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#E53935]">Data-Driven Recommendations</h3>
                <p className="mt-8 sm:mt-3 text-xs sm:text-sm md:text-base text-[#1C1C1C] max-w-md">
                  EMERGE generates precise recommendations using verified data from local government units, ensuring that every decision reflects real, location-specific conditions.
                </p>
              </div>

              <div className="w-full md:w-1/2 flex justify-center">
                <div className="w-full max-w-[280px] sm:max-w-[400px] md:max-w-[600px]">
                  <Image
                    src="/images/F4.png"
                    alt="Strategic Resource Allocation"
                    width={520}
                    height={320}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
            </div>
          </div>
        </section>


        <section className="bg-[#111] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
                How <span className="text-[#E53935]">EMERGE</span> works
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-gray-300 max-w-2xl mx-auto">
                A clustering-enhanced GIS workflow for hazard assessment and strategic resource allocation
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <article className="rounded-2xl p-6 bg-gradient-to-b from-[#e94d58] to-[#b92727] shadow-md">
                <div className="text-sm font-semibold opacity-90">01</div>
                <h3 className="mt-4 text-lg sm:text-xl font-bold">Analyze Historical Data</h3>
                <div className="mt-3 text-sm text-white/90">
                  EMERGE maps hazard-prone areas in Santa Barbara, Iloilo using past disaster data.
                </div>
              </article>

              <article className="rounded-2xl p-6 bg-gradient-to-b from-[#e94d58] to-[#b92727] shadow-md">
                <div className="text-sm font-semibold opacity-90">02</div>
                <h3 className="mt-4 text-lg sm:text-xl font-bold">Visualize Risk Zones with GIS</h3>
                <div className="mt-3 text-sm text-white/90">
                  Hazards appear on an interactive map with heat zones and vulnerability levels.
                </div>
              </article>

              <article className="rounded-2xl p-6 bg-gradient-to-b from-[#e94d58] to-[#b92727] shadow-md">
                <div className="text-sm font-semibold opacity-90">03</div>
                <h3 className="mt-4 text-lg sm:text-xl font-bold">Response Allocation with Clustering</h3>
                <div className="mt-3 text-sm text-white/90">
                  Clustering algorithms guide efficient responder and supply distribution.
                </div>
              </article>

              <article className="rounded-2xl p-6 bg-gradient-to-b from-[#e94d58] to-[#b92727] shadow-md">
                <div className="text-sm font-semibold opacity-90">04</div>
                <h3 className="mt-4 text-lg sm:text-xl font-bold">Support Planning and Readiness</h3>
                <div className="mt-3 text-sm text-white/90">
                  EMERGE suggests optimal responder placement in high-risk zones.
                </div>
              </article>
            </div>
          </div>
        </section>


        <section className="bg-[#111] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="flex flex-col md:flex-row items-center md:items-center">
              <div className="w-full md:w-1/3 text-center md:text-left mb-4 md:mb-0">
                <p className="text-sm text-white-300 mb-40">Developed in partnership with</p>
              </div>

              <div className="w-full md:w-2/3 flex justify-center md:justify-start gap-10 items-center flex-wrap">
                <Image src="/images/alerto.png" alt="Partner 1" width={80} height={80} className="h-16 w-auto object-contain" />
                <Image src="/images/wvsu.png" alt="Partner 2" width={80} height={80} className="h-16
                w-auto object-contain" />
                <Image src="/images/cict.png" alt="Partner 3" width={80} height={80} className="h-16 w-auto object-contain" />
                {/* <Image src="/images/partner-4.png" alt="Partner 4" width={80} height={80} className="h-12 w-auto object-contain" />
                <Image src="/images/partner-5.png" alt="Partner 5" width={80} height={80} className="h-12 w-auto object-contain" /> */}
              </div>
            </div>
          </div>
        </section>

    </main>
  );
}
