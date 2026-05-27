"use client";
import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, Recycle, Users, Heart, ArrowRight, ShieldCheck, Zap, Award } from "lucide-react";

export default function AboutPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div ref={containerRef} className="bg-[#fafaf8] overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-[#0f172a]">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/about/hero.png"
            alt="Tailoring Turba Studio"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/80 via-transparent to-[#0f172a]" />
        </motion.div>

        <div className="container relative z-10 text-center px-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[#c49d32] font-semibold tracking-[0.2em] uppercase text-sm mb-6"
          >
            Since 2022 • Pune, India
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white text-5xl md:text-8xl font-serif mb-8 leading-tight"
          >
            The Relentless Pursuit <br />
            <span className="italic text-[#c49d32]">of Perfection.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-white/70 max-w-2xl mx-auto text-lg md:text-xl font-light leading-relaxed"
          >
            Tailoring Turba is more than a manufacturer. We are a purpose-driven hub blending 
            modern innovation with social impact, crafting apparel that empowers businesses 
            and uplifts lives.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12"
          >
            <div className="w-[1px] h-24 bg-gradient-to-b from-[#c49d32] to-transparent mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* 2. OUR STORY SECTION */}
      <section className="py-24 md:py-40 container px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-[#0f172a] text-4xl md:text-6xl font-serif mb-8">
              From Idea <br />
              <span className="text-[#c49d32]">to Impact.</span>
            </h2>
            <div className="space-y-6 text-[#6b6b65] text-lg leading-relaxed">
              <p>
                Founded by <span className="text-[#0f172a] font-semibold">Neeraj Shingvi</span>, 
                Tailoring Turba LLP began with a simple yet powerful question: 
                <em> Can apparel manufacturing be a force for good?</em>
              </p>
              <p>
                In a world of fast fashion, we chose a different path. We decided to focus on 
                corporate excellence while addressing two of the world's biggest challenges: 
                environmental waste and social inequality.
              </p>
              <p>
                What started as a small team of passionate dreamers in Pune has grown into a 
                sophisticated manufacturing unit. Today, we don't just stitch fabric; we weave 
                opportunities for underprivileged communities and pioneer the use of 
                sustainable materials.
              </p>
            </div>
          </motion.div>
          
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="aspect-[4/5] relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <Image
                src="/about/sewing.png"
                alt="Craftsmanship at Tailoring Turba"
                fill
                className="object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="absolute -bottom-10 -left-10 bg-white p-8 shadow-xl rounded-lg hidden md:block max-w-xs"
            >
              <p className="text-[#c49d32] font-serif text-3xl mb-2">5M+</p>
              <p className="text-[#6b6b65] text-sm uppercase tracking-wider">Garments delivered with a purpose.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. WHAT WE DO (Services) */}
      <section className="py-24 bg-[#0f172a] text-white">
        <div className="container px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Our Expertise</h2>
            <p className="text-white/60 max-w-xl mx-auto">Premium manufacturing solutions tailored for the modern enterprise.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                title: "Custom Apparel", 
                desc: "Bespeak manufacturing from sketch to finish.",
                icon: <Zap className="text-[#c49d32]" />
              },
              { 
                title: "Corporate Uniforms", 
                desc: "Elevating brand identity through teamwear.",
                icon: <ShieldCheck className="text-[#c49d32]" />
              },
              { 
                title: "Premium Branding", 
                desc: "High-precision printing and embroidery.",
                icon: <Award className="text-[#c49d32]" />
              },
              { 
                title: "Corporate Gifting", 
                desc: "Curated apparel sets for your valued partners.",
                icon: <Heart className="text-[#c49d32]" />
              },
            ].map((service, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white/5 border border-white/10 p-10 rounded-2xl backdrop-blur-sm"
              >
                <div className="mb-6">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-4">{service.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. OUR IMPACT SECTION */}
      <section className="py-24 md:py-40 bg-white relative">
        <div className="container px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, scale: 1.1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5 }}
                className="aspect-square relative rounded-full overflow-hidden border-[16px] border-[#fafaf8]"
              >
                <Image
                  src="/about/sustainable.png"
                  alt="Sustainable Materials"
                  fill
                  className="object-cover"
                />
              </motion.div>
            </div>
            
            <motion.div 
              className="order-1 lg:order-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-[#0f172a] text-4xl md:text-6xl font-serif mb-12">
                Manufacturing <br />
                <span className="text-[#c49d32]">with a Soul.</span>
              </h2>
              
              <div className="space-y-12">
                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-full bg-[#fafaf8] flex items-center justify-center flex-shrink-0">
                    <Recycle className="text-[#c49d32]" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Sustainable Innovation</h4>
                    <p className="text-[#6b6b65]">We transform recycled plastic waste into high-performance fabrics, proving that style doesn't have to cost the Earth.</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-full bg-[#fafaf8] flex items-center justify-center flex-shrink-0">
                    <Users className="text-[#c49d32]" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Employment Generation</h4>
                    <p className="text-[#6b6b65]">By employing talent from below-poverty-line communities, we provide dignified livelihoods and skill development.</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 rounded-full bg-[#fafaf8] flex items-center justify-center flex-shrink-0">
                    <Heart className="text-[#c49d32]" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Social Contribution</h4>
                    <p className="text-[#6b6b65]">A portion of every order goes towards community support, including food drives and education for the underprivileged.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-24 bg-[#fafaf8]">
        <div className="container px-4">
          <div className="bg-[#0f172a] rounded-[32px] p-12 md:p-24 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c49d32] rounded-full blur-[120px] opacity-20 -mr-32 -mt-32" />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif mb-8">Why Businesses <br />Trust Tailoring Turba.</h2>
                <p className="text-white/60 mb-10 leading-relaxed">
                  We combine the agility of a startup with the precision of a world-class factory. 
                  Our commitment to quality is matched only by our commitment to our purpose.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="px-6 py-3 rounded-full border border-white/20 text-sm font-medium">Affordable Luxury</div>
                  <div className="px-6 py-3 rounded-full border border-white/20 text-sm font-medium">Fast Turnaround</div>
                  <div className="px-6 py-3 rounded-full border border-white/20 text-sm font-medium">Eco-Certified</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {[
                  "Premium B2B Manufacturing hub in Pune",
                  "Direct-from-factory wholesale pricing",
                  "Sample dispatch within 48 hours",
                  "End-to-end branding & customization",
                  "100% Quality Assurance Guarantee"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#c49d32]/20 flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-[#c49d32]" />
                    </div>
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOUNDER SECTION */}
      <section className="pt-20 md:pt-32 pb-20 md:pb-32 bg-white border-t border-[#fafaf8]">
        <div className="container px-4 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl font-serif text-[#fafaf8] z-0 select-none">
              &ldquo;
            </div>
            
            <h2 className="text-2xl md:text-4xl font-serif text-[#0f172a] leading-snug mb-12 relative z-10 italic">
              "We don't just build a company; we build a community. Our work in textiles is a 
              bridge between industrial excellence and social responsibility. Honesty and hard 
              work are the only threads we use."
            </h2>
            
            <div className="w-20 h-[2px] bg-[#c49d32] mx-auto mb-8" />
            
            <h3 className="text-xl font-bold text-[#0f172a] uppercase tracking-[0.2em]">Neeraj Shingvi</h3>
            <p className="text-[#c49d32] text-sm mt-2 uppercase tracking-widest font-medium">Founder & Visionary</p>
            
            <p className="mt-10 text-[#6b6b65] text-lg max-w-2xl mx-auto italic">
              A leader committed to the triple bottom line: People, Planet, and Prosperity. 
              Neeraj believes in the power of branding to transform lives and the power of 
              honesty to build lasting legacies.
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
