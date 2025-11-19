"use client";
import Image from "next/image";
import Footer from "@/components/footer";

export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 py-20 bg-white">
        <div className="z-10 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-2 text-[#2e2c2f]">Enhanced Prepositioning for a</h1>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight text-[#2e2c2f]">
            <span className="text-[#b92727]">Secure and Resilient</span> Community.
          </h1>
          <p className="text-base md:text-lg max-w-[720px] mx-auto mt-6 px-2 leading-relaxed text-gray-700">
            Visualize hazards, assign responders, and plan smarter with EMERGE's data-driven disaster management system.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-10 md:mt-14 z-10">
          <button className="bg-[#2e2c2f] text-white px-6 py-3 text-base md:text-lg font-semibold rounded-lg hover:bg-[#1a1a1a]" onClick={() => (window.location.href = "/about")}>
            Learn more
          </button>
          <button className="bg-[#b92727] text-white px-6 py-3 text-base md:text-lg font-semibold rounded-lg hover:bg-[#8a1d1d]" onClick={() => (window.location.href = "/hazards")}>
            View Hazard Map
          </button>
        </div>
        <div className="mt-16 md:mt-20 z-10 max-w-6xl mx-auto px-4">
          <Image src="/feature1.png" alt="EMERGE dashboard preview" width={1200} height={700} className="rounded-lg shadow-2xl w-full h-auto" />
        </div>
        <div className="mt-12 md:mt-16 z-10 max-w-4xl mx-auto px-6">
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
            Powered by proprietary algorithms, EMERGE enhances emergency response and team allocation through a decision support system using verified, location-specific data.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-gradient-to-b from-gray-400 via-gray-400 to-black py-16 md:py-20 px-4 text-[#f5f5f5]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            What <span className="text-[#b92727]">EMERGE</span> can do
          </h2>
          <p className="text-base md:text-lg mb-12 md:mb-16">
            Core features combining hazard mapping, data clustering, and resource optimization
          </p>
        </div>
        <div className="max-w-6xl mx-auto space-y-20 px-4">
          {/* Hazard Heatmaps */}
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2 order-2 md:order-1">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <Image src="/feature1.png" alt="Hazard heatmaps visualization" width={1200} height={280} className="w-full h-auto object-cover" />
              </div>
            </div>
            <div className="md:w-1/2 order-1 md:order-2">
              <h3 className="text-3xl md:text-4xl font-bold text-[#b92727] mb-4">Hazard Heatmaps</h3>
              <p className="text-lg md:text-xl leading-relaxed">
                Integrates hazard data, population density, and terrain to surface vulnerability intersections before disasters occur.
              </p>
            </div>
          </div>
          {/* Barangay-Level Insights */}
          <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
            <div className="md:w-1/2">
              <div className="rounded-2xl overflow-hidden shadow-xl bg-white/5 p-4">
                <Image src="/images/F3.png" alt="Barangay level insights" width={1020} height={820} className="w-full h-auto object-contain" />
              </div>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-3xl md:text-4xl font-bold text-[#b92727] mb-4">Barangay-Level Insights</h3>
              <p className="text-lg md:text-xl leading-relaxed">
                Granular analysis enables tailored response planning and allocation aligned with distinct community risk profiles.
              </p>
            </div>
          </div>
          {/* Data-Driven Recommendations */}
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2 order-2 md:order-2">
              <div className="rounded-2xl overflow-hidden shadow-xl bg-white/5 p-4">
                <Image src="/images/F2.png" alt="Data-driven recommendations graphic" width={520} height={320} className="w-full h-auto object-contain" />
              </div>
            </div>
            <div className="md:w-1/2 order-1 md:order-1">
              <h3 className="text-3xl md:text-4xl font-bold text-[#b92727] mb-4">Data-Driven Recommendations</h3>
              <p className="text-lg md:text-xl leading-relaxed">
                Smart clustering assesses intensity & proximity, accelerating optimal responder deployment to critical points.
              </p>
            </div>
          </div>
          {/* Strategic Resource Allocation */}
          <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
            <div className="md:w-1/2">
              <div className="rounded-2xl overflow-hidden shadow-xl bg-white/5 p-4">
                <Image src="/images/F4.png" alt="Strategic resource allocation graphic" width={520} height={320} className="w-full h-auto object-contain" />
              </div>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-3xl md:text-4xl font-bold text-[#b92727] mb-4">Strategic Resource Allocation</h3>
              <p className="text-lg md:text-xl leading-relaxed">
                Algorithmic guidance places teams and supplies where they reduce response time and maximize coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW EMERGE WORKS */}
      <section className="bg-[#111] text-white py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">How EMERGE Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Analyze Historical Data",
                desc: "Maps hazard-prone zones using verified local historical datasets.",
              },
              {
                step: "02",
                title: "Visualize Risk Zones",
                desc: "Interactive GIS layers highlight intensity, spread, and vulnerability.",
              },
              {
                step: "03",
                title: "Cluster & Allocate",
                desc: "Clustering algorithms guide efficient responder & supply positioning.",
              },
              {
                step: "04",
                title: "Support Readiness",
                desc: "Generates pre-deployment options for high-risk sectors before impact.",
              },
            ].map((c) => (
              <article key={c.step} className="rounded-2xl p-6 bg-gradient-to-b from-[#e94d58] to-[#b92727] shadow-md">
                <div className="text-sm font-semibold opacity-90">{c.step}</div>
                <h3 className="mt-4 text-lg sm:text-xl font-bold">{c.title}</h3>
                <p className="mt-3 text-sm text-white/90 leading-relaxed">{c.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="bg-gradient-to-b from-[#0a0000] to-black py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-10">Developed in partnership with</h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[
              { src: "/wvsu-logo.PNG", alt: "WVSU" },
              { src: "/cict-logo.PNG", alt: "CICT" },
              { src: "/sb-logo.png", alt: "Santa Barbara" },
              { src: "/sbdrrmo.jpg", alt: "SBDRRMO" },
              { src: "/trrdmo.jpg", alt: "TRRDMO" },
            ].map((p) => (
              <div key={p.alt} className="bg-white rounded-xl p-4 hover:shadow-xl transition-shadow">
                <Image src={p.src} alt={`${p.alt} Logo`} width={100} height={100} className="w-20 h-20 md:w-24 md:h-24 object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
