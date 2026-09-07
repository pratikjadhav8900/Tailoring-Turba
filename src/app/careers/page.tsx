"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Award, 
  Users, 
  Leaf, 
  Zap, 
  ChevronRight, 
  Briefcase, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Send, 
  Loader2,
  FileText,
  X,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salaryRange?: string;
}

const CULTURAL_VALUES = [
  {
    icon: <Award className="w-6 h-6 text-[#c49d32]" />,
    title: "Bespoke Craftsmanship",
    description: "We honor tailoring tradition. Every seam, cut, and stitch is executed with meticulous care, prioritizing structural fit and lifetime quality."
  },
  {
    icon: <Users className="w-6 h-6 text-[#6b7d60]" />,
    title: "Social Empowerment",
    description: "We employ and empower local tailoring communities, creating ethical livelihoods, supporting women artisans, and growing together."
  },
  {
    icon: <Leaf className="w-6 h-6 text-[#c49d32]" />,
    title: "Ecological Responsibility",
    description: "From certified organic cotton to zero-waste cutting and solar-powered sample rooms, we strive to make clean fashion a default standard."
  },
  {
    icon: <Zap className="w-6 h-6 text-[#6b7d60]" />,
    title: "Technological Edge",
    description: "We merge artisan hands with 3D design software, digital customizers, and high-efficiency automation to lead the global B2B sector."
  }
];

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [drawerJob, setDrawerJob] = useState<Job | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    message: ""
  });

  const [resumeFile, setResumeFile] = useState<{ name: string; type: string; base64: string } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // Fetch jobs dynamically on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs");
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        } else {
          console.error("Failed to load jobs");
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // Disable body scroll when drawer is open
  useEffect(() => {
    if (drawerJob) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [drawerJob]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setResumeFile({
        name: file.name,
        type: file.type,
        base64: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setDrawerJob(null); // Close drawer if open
    setFormData(prev => ({
      ...prev,
      position: job.title
    }));
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isHuman) {
      toast.error("Please check the box to confirm you are human.");
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.position || !resumeFile) {
      toast.error("Please fill in all required fields and upload your resume.");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          resumeFile
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      toast.success("Application submitted successfully!");
      setSubmitted(true);
      setIsHuman(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        position: "",
        message: ""
      });
      setResumeFile(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fafaf8] min-h-screen text-[#1a1a18] font-sans pb-24 overflow-x-hidden">
      
      {/* 1. IMMERSIVE HERO SECTION */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-[#1a1a18]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero_sewing.png"
            alt="Tailoring Turba Artisans at work"
            fill
            className="object-cover opacity-25 object-center"
            priority
          />
          {/* Editorial Gradient Overlay - Charcoal to Warm Offwhite */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a18]/95 via-[#1a1a18]/60 to-[#fafaf8]" />
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c49d32]/30 bg-black/40 backdrop-blur-md mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c49d32] animate-pulse" />
            <span className="text-[#c49d32] text-xs font-semibold tracking-[0.25em] uppercase">
              Join the Legacy • Become a Craftsman
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-white tracking-tight mb-8 leading-tight max-w-5xl mx-auto"
          >
            Crafting the Future <br />
            <span className="italic text-[#c49d32] font-normal">of Bespoke Apparel.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-gray-300 max-w-2xl mx-auto text-base sm:text-lg font-light leading-relaxed mb-12 text-center"
          >
            We merge centuries-old tailoring craftsmanship with digital design tools, zero-waste 
            sustainability, and structural precision. Grow your career with the B2B leader.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="#positions"
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full border-2 border-[#6b7d60] bg-[#6b7d60] px-8 py-4 font-bold text-white shadow-xl transition-all duration-300 hover:bg-transparent hover:text-[#6b7d60] hover:shadow-[#6b7d60]/10"
            >
              <span>Explore Active Openings</span>
              <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            
            <a 
              href="#culture"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              Our Culture & Values
            </a>
          </motion.div>
        </div>

        {/* Decorative subtle fading bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#fafaf8] to-transparent z-0" />
      </section>

      {/* 2. CORE VALUES SECTION */}
      <section id="culture" className="py-28 container px-4 relative">
        <div className="absolute top-20 left-10 w-80 h-80 rounded-full bg-[#6b7d60]/4 filter blur-[90px] -z-10" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#c49d32]/4 filter blur-[90px] -z-10" />

        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-[#6b7d60] font-bold text-xs uppercase tracking-[0.2em] mb-3 block">Why Tailoring Turba?</span>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#1a1a18] mb-6">
            A Pattern of Excellence & Equity
          </h2>
          <div className="w-16 h-[2px] bg-[#c49d32] mx-auto mb-6" />
          <p className="text-[#6b6b65] text-lg leading-relaxed font-light">
            Our workshop and design studios are environments of precision, collaboration, and purpose. 
            We build clothing that supports corporate brands while fostering personal, artistic growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {CULTURAL_VALUES.map((val, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="group bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md hover:border-[#6b7d60]/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-[#c49d32] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-12 h-12 rounded-xl bg-[#6b7d60]/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {val.icon}
              </div>
              <h3 className="text-xl font-bold text-[#1a1a18] mb-3">{val.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed font-light">{val.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. CURRENT OPENINGS SECTION */}
      <section id="positions" className="py-24 bg-white border-y border-gray-200/60 relative">
        {/* Subtle grid pattern background matching apparel patterns */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(107,125,96,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(107,125,96,0.015)_1px,transparent_1px)] bg-[size:30px_30px] opacity-60 pointer-events-none" />

        <div className="container px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[#6b7d60] font-semibold text-xs uppercase tracking-[0.2em] mb-3 block">Join Our Studio</span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#1a1a18] mb-6">
              Active Professional Roles
            </h2>
            <div className="w-16 h-[2px] bg-[#c49d32] mx-auto mb-6" />
            <p className="text-[#6b6b65] text-lg font-light">
              We look for talent that respects the tape measure as much as they embrace structural innovation. 
              Click on any role to view detailed profiles and requirements.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {loadingJobs ? (
              <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#6b7d60]" />
                <p className="text-sm text-gray-500 font-light">Loading open roles...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-[#fafaf8]/50">
                <p className="text-sm text-gray-500 font-light">No active job openings at the moment. Please check back later or submit a general application below.</p>
              </div>
            ) : (
              jobs.map((job, idx) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  onClick={() => setDrawerJob(job)}
                  className="group bg-white hover:bg-[#fafaf8] border border-gray-200/80 hover:border-[#6b7d60]/30 rounded-2xl p-6 md:p-8 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#6b7d60]/10 text-[#6b7d60]">
                        {job.department}
                      </span>
                      <span className="text-xs text-[#c49d32] font-semibold">{job.type}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a18] group-hover:text-[#6b7d60] transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-4 text-gray-500 text-sm font-light">
                      <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#6b7d60]" /> {job.location}</span>
                      <span>•</span>
                      <span className="text-gray-700 font-normal">{job.salaryRange}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span className="text-sm font-semibold text-[#6b6b65] group-hover:text-[#6b7d60] transition-colors">View Details</span>
                    <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center group-hover:bg-[#6b7d60] group-hover:border-[#6b7d60] group-hover:scale-110 transition-all duration-300">
                      <ArrowRight size={14} className="text-gray-500 group-hover:text-white" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. PREMIUM SIDE-DRAWER DETAIL VIEW */}
      <AnimatePresence>
        {drawerJob && (
          <>
            {/* Drawer Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerJob(null)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />

            {/* Drawer Container */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[600px] bg-white text-[#1a1a18] shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-8 md:p-12 relative flex flex-col min-h-full">
                {/* Close Button */}
                <button
                  onClick={() => setDrawerJob(null)}
                  className="absolute top-8 right-8 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1a1a18] transition-colors"
                >
                  <X size={20} />
                </button>

                {/* Header Information */}
                <div className="mb-10 pr-12">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#6b7d60]/10 text-[#6b7d60] mb-4">
                    {drawerJob.department}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a18] mb-4">
                    {drawerJob.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-6 text-gray-500 text-sm mt-3 border-y border-gray-100 py-4">
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-[#6b7d60]" /> {drawerJob.location}</span>
                    <span className="flex items-center gap-1.5"><Clock size={16} className="text-[#c49d32]" /> {drawerJob.type}</span>
                    <span className="text-gray-800 font-medium">{drawerJob.salaryRange}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="space-y-8 flex-grow">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Role Overview</h4>
                    <p className="text-gray-600 text-base leading-relaxed font-light">{drawerJob.description}</p>
                  </div>

                  <div>
                    <h4 className="text-[#1a1a18] font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-[#c49d32] rounded-full inline-block" />
                      Responsibilities
                    </h4>
                    <ul className="space-y-4">
                      {drawerJob.responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-600 leading-relaxed font-light">
                          <span className="text-[#c49d32] font-semibold mt-1">✓</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[#1a1a18] font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-[#6b7d60] rounded-full inline-block" />
                      Requirements
                    </h4>
                    <ul className="space-y-4">
                      {drawerJob.requirements.map((req, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-600 leading-relaxed font-light">
                          <span className="text-[#6b7d60] font-semibold mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA inside Drawer */}
                <div className="pt-10 mt-12 border-t border-gray-100 flex items-center justify-between gap-4">
                  <button
                    onClick={() => handleApplyClick(drawerJob)}
                    className="flex-grow inline-flex items-center justify-center gap-2 bg-[#1a1a18] hover:bg-[#6b7d60] text-white font-semibold tracking-wide py-4 rounded transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Apply Now for this Role
                  </button>
                  <button
                    onClick={() => setDrawerJob(null)}
                    className="px-6 py-4 rounded border border-gray-200 text-gray-500 hover:text-[#1a1a18] hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. GLASSMORPHIC APPLICATION FORM SECTION */}
      <section ref={formRef} className="py-28 container px-4 scroll-mt-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#6b7d60]/4 filter blur-[120px] -z-10" />

        <div className="max-w-3xl mx-auto">
          <div className="backdrop-blur-md bg-white/80 border border-gray-200/60 rounded-3xl p-8 md:p-14 shadow-xl relative">
            <div className="text-center mb-12">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#6b7d60]/10 text-[#6b7d60] mb-5">
                <Briefcase size={26} />
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a18]">
                {selectedJob ? `Apply for ${selectedJob.title}` : "General Application"}
              </h2>
              <p className="text-[#6b6b65] text-sm mt-3 font-light">
                Submit your professional details below. Our studio HR team reviews applications on a rolling basis.
              </p>
            </div>

            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 px-6"
              >
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-[#1a1a18] mb-4">Application Registered</h3>
                <p className="text-[#6b6b65] max-w-md mx-auto leading-relaxed font-light">
                  We have logged your application details and resume file. A confirmation has been registered, and our design/production heads will reach out if a matching opening aligns.
                </p>
                <button 
                  onClick={() => {
                    setSubmitted(false);
                    setSelectedJob(null);
                    setIsHuman(false);
                  }}
                  className="mt-8 bg-transparent text-[#6b7d60] hover:text-[#4a5c3f] font-bold text-sm tracking-wider uppercase transition-colors"
                >
                  ← Submit Another Application
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-[#6b6b65] mb-2.5">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Neeraj Shingvi"
                      className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#6b6b65] mb-2.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@company.com"
                      className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-[#6b6b65] mb-2.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="position" className="block text-xs font-bold uppercase tracking-wider text-[#6b6b65] mb-2.5">
                      Job Openings <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="position"
                      id="position"
                      required
                      value={formData.position}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm transition-all shadow-sm"
                    >
                      <option value="">-- Choose Position --</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.title}>{job.title}</option>
                      ))}
                      <option value="General Application">General Application (Other)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b65] mb-2.5">
                    Upload Resume (PDF, DOCX) <span className="text-red-500">*</span>
                  </label>
                  
                  {!resumeFile ? (
                    <div className="relative border-2 border-dashed border-gray-300 hover:border-[#6b7d60]/60 rounded-xl p-8 bg-white/40 hover:bg-[#fafaf8]/50 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group">
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        required
                      />
                      <FileText className="w-10 h-10 text-gray-400 group-hover:text-[#6b7d60] transition-colors mb-3" />
                      <p className="text-sm font-semibold text-[#6b6b65] group-hover:text-[#6b7d60] transition-colors">
                        Drag and drop your file here, or click to browse
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Supports PDF, DOCX up to 5MB
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-[#6b7d60]/30 bg-[#6b7d60]/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#6b7d60]/10 flex items-center justify-center text-[#6b7d60]">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1a1a18] truncate max-w-[280px]">
                            {resumeFile.name}
                          </p>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">
                            {resumeFile.type.split("/")[1] || "document"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="w-8 h-8 rounded-full hover:bg-gray-200/60 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-[#6b6b65] mb-2.5">
                    Cover Letter or Brief Background Note
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your background, key custom tailoring achievements, and why you want to join the Tailoring Turba team."
                    className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6b7d60]/50 focus:border-[#6b7d60] text-sm transition-all shadow-sm"
                  />
                </div>

                {/* Human Verification */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white/40 shadow-sm max-w-sm mx-auto justify-center">
                  <input
                    type="checkbox"
                    id="isHuman"
                    checked={isHuman}
                    onChange={(e) => setIsHuman(e.target.checked)}
                    className="w-4 h-4 text-[#6b7d60] border-gray-300 rounded focus:ring-[#6b7d60] focus:ring-offset-0 cursor-pointer accent-[#6b7d60]"
                  />
                  <label htmlFor="isHuman" className="text-xs font-bold uppercase tracking-wider text-[#6b6b65] select-none cursor-pointer">
                    Confirm you are human
                  </label>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isHuman}
                    className="inline-flex items-center justify-center gap-2.5 bg-[#1a1a18] hover:bg-[#6b7d60] disabled:bg-gray-400 text-white font-bold tracking-wider uppercase text-xs py-4 px-10 rounded transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Application
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
