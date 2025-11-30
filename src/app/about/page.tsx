import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-[#f5f6fa] flex flex-col items-center">
      <section
        className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url('/images/responder.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* dark overlay to keep text readable */}
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative z-10 max-w-4xl px-6 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Readiness is our response.
          </h1>
          <p className="mt-4 text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto">
            Preparedness, response, and recovery — guided by data-driven
            insights and local coordination.
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 sm:h-48 md:h-56 lg:h-72">
          <div className="w-full h-full bg-gradient-to-b from-transparent to-[#f5f6fa] opacity-95" />
        </div>
      </section>

      <section className="w-full bg-[#f5f6fa]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 text-center">
          <div className="flex justify-center mb-6 sm:mb-8">
            <Image
              src="/images/emerge-unp.png"
              alt="About icon"
              width={120}
              height={120}
              className="w-20 sm:w-24 md:w-28 h-20 sm:h-24 md:h-28 object-contain"
            />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1C1C1C]">
            About
          </h2>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-md text-[#1C1C1C] max-w-2xl mx-auto leading-relaxed">
            We believe technology should do more than exist — it should care.
            EMERGE is our way of helping communities stay safe by preparing
            before disasters strike, ensuring resources and responders are ready
            when every second matters.
          </p>
        </div>
      </section>

      <section className="w-full bg-[#f5f6fa]">
        <div className="max-w-4xl mt-[-50] mb-20 mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="w-full mb-8">
            <div className="w-full rounded-2xl overflow-hidden">
              <Image
                src="/images/response.png"
                alt="About feature"
                width={1000}
                height={500}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-start">
            <div className="flex items-start">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl font-extrabold text-[#b92727] leading-tight">
                We built this for you — so that safety isn't just a hope, but a
                plan.
              </h3>
            </div>

            <div className="text-sm sm:text-base text-[#374151]">
              <p className="mb-4">
                As undergraduate students, we aspired to create something truly
                transformative — a system designed to help communities stay safe
                and prepared in the face of disaster.
              </p>
              <p className="mb-4">
                Living in the Philippines, a nation constantly tested by
                typhoons, earthquakes, and floods, we have all felt how
                vulnerable life can be. Those experiences sparked a deep desire
                within us to take action and be part of the solution.
              </p>
              <p className="mb-4">
                As Computer Science students, we wanted our work to go beyond
                research papers and classroom discussions — we wanted to build
                something that truly matters.
              </p>
              <p className="mb-2">— The EMERGE team</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#f5f6fa] mt-[-40] max-w-[70vw]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-8">
            <h2 className="text-4xl sm:text-4xl md:text-4xl font-extrabold text-[#1C1C1C]">
              The faces behind <span className="text-[#e53935]">EMERGE</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#1C1C1C] max-w-2xl mx-auto">
              Our team is a blend of different talents and passions, and we
              believe that none of this would be possible without each one’s
              contribution.
            </p>
          </div>

          <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start gap-8">
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/1.png"
                  alt="Member 1"
                  width={176}
                  height={176}
                  className="w-44 h-66 object-cover rounded-2xl"
                />
                <div className="mt-4 font-bold text-sm tracking-wider text-[#1C1C1C]">
                  DHOMINICK JOHN S. BILLENA
                </div>
                <div className="text-sm tracking-wider text-[#e53935]">
                  System Architect / Backend Developer
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/4.png"
                  alt="Member 2"
                  width={176}
                  height={176}
                  className="w-44 h-66 object-cover rounded-2xl"
                />
                <div className="mt-4 font-bold text-sm tracking-wider text-[#1C1C1C]">
                  MAURICIO MANUEL F. BERGANCIA
                </div>
                <div className="text-sm tracking-wider text-[#e53935]">
                  Lead Frontend Developer
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/2.png"
                  alt="Member 3"
                  width={176}
                  height={176}
                  className="w-44 h-66 object-cover rounded-2xl"
                />
                <div className="mt-4 font-bold text-sm tracking-wider text-[#1C1C1C]">
                  GILLIE S. CALANUGA
                </div>
                <div className="text-sm tracking-wider text-[#e53935]">
                  System Documentator
                </div>
              </div>
            </div>

            <div className=" flex flex-col justify-center md:flex-row md:gap-60 gap-y-12">
              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/3.png"
                  alt="Member 4"
                  width={176}
                  height={176}
                  className="w-44 h-66 object-cover rounded-2xl"
                />
                <div className="mt-4 font-bold text-sm tracking-wider text-[#1C1C1C]">
                  MHERLIE JOY U. CHAVEZ
                </div>
                <div className="text-sm tracking-wider text-[#e53935]">
                  Project Manager
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <Image
                  src="/images/5.png"
                  alt="Member 5"
                  width={176}
                  height={176}
                  className="w-44 h-66 object-cover rounded-2xl"
                />
                <div className="mt-4 font-bold text-sm tracking-wider text-[#1C1C1C]">
                  MICHAEL REY T. TUANDO
                </div>
                <div className="text-sm tracking-wider text-[#e53935]">
                  UI/UX Architect
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="w-full bg-[#f5f6fa] py-5 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white shadow-lg rounded-xl p-8 md:p-10 border border-gray-100 text-center hover:shadow-xl transition-all duration-300">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1C1C1C] mb-4">
              Want to Understand More about the System?
            </h2>
            <p className="text-base sm:text-lg text-[#374151] mb-8 max-w-2xl mx-auto">
              Visit our comprehensive documentation to learn more about EMERGE's
              features, architecture, and how to make the most of the system.
            </p>
            <Link
              className="inline-block bg-[#b92727] text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold rounded-lg transition-all duration-300 hover:bg-[#8a1d1d] hover:shadow-md"
              href={"https://docs.projectemerge.org"}
            >
              View Documentation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
