export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const INITIAL_JOBS = [
  {
    title: "Lead Apparel Designer",
    department: "Design & Development",
    location: "Pune / Hybrid",
    type: "Full-time",
    salaryRange: "₹6,00,000 - ₹9,00,000 / year",
    description: "Shape our seasonal collections and custom B2B client uniforms with contemporary style, structural precision, and functional aesthetics.",
    requirements: [
      "Degree in Fashion Design, Apparel Design, or a related field.",
      "3+ years of experience in apparel design, preferably in corporate wear or premium sportswear.",
      "Proficiency in Adobe Creative Suite (Illustrator, Photoshop) and CAD software.",
      "Strong understanding of fabric properties, garment construction, and tech pack creation."
    ],
    responsibilities: [
      "Conceptualize and create tech packs for custom client orders and standard product lines.",
      "Collaborate with the pattern-making and production teams to guide design intent to production.",
      "Research fashion trends, material innovations, and functional tech-apparel features.",
      "Interact directly with premium B2B clients to translate their brand identity into custom garments."
    ]
  },
  {
    title: "Master Tailor & Pattern Maker",
    department: "Pattern Making & Sample Studio",
    location: "Pune Studio",
    type: "Full-time",
    salaryRange: "₹4,50,000 - ₹7,00,000 / year",
    description: "Bring high-end design concepts to life. You will craft the base patterns and fit samples that define our premium apparel standards.",
    requirements: [
      "5+ years of experience as a pattern maker or master tailor in a high-end fashion house or commercial apparel environment.",
      "Exceptional skill in manual drafting and draping, with experience in digital pattern-making software a plus.",
      "Deep understanding of fit adjustments, sizing grading, and tailoring complex garments (jackets, suits, custom outerwear).",
      "Detail-oriented with a passion for quality and craftsmanship."
    ],
    responsibilities: [
      "Translate designer sketches and tech packs into precise physical/digital patterns.",
      "Cut and stitch initial sample garments, ensuring top-tier finishing.",
      "Perform fit testing and execute refinements to pattern sheets based on feedback.",
      "Train and mentor junior tailors on precision sewing and assembly techniques."
    ]
  },
  {
    title: "Apparel Production Manager",
    department: "Operations & Manufacturing",
    location: "Pune Factory",
    type: "Full-time",
    salaryRange: "₹7,00,000 - ₹10,50,000 / year",
    description: "Oversee our state-of-the-art manufacturing floor. You will optimize production schedules, enforce QA guidelines, and drive eco-friendly workflows.",
    requirements: [
      "Bachelor's degree in Production Engineering, Apparel Manufacturing, or equivalent experience.",
      "4+ years in production management in an apparel factory setting (minimum 50+ tailoring machines).",
      "Strong knowledge of Lean Manufacturing principles, batch flow, and quality assurance workflows.",
      "Excellent leadership, conflict-resolution, and scheduling capabilities."
    ],
    responsibilities: [
      "Schedule daily production lines to meet delivery deadlines with zero quality compromise.",
      "Implement quality assurance protocols throughout cutting, tailoring, printing, and packaging.",
      "Identify operational bottlenecks and introduce optimization techniques (Lean/5S).",
      "Ensure clean, ethical, and safe working conditions matching global social-compliance standards."
    ]
  },
  {
    title: "Digital Marketing & Client Relations Specialist",
    department: "Marketing & Growth",
    location: "Pune / Hybrid",
    type: "Full-time",
    salaryRange: "₹5,0,000 - ₹8,00,000 / year",
    description: "Expand our corporate and B2B reach. You will run marketing campaigns, curate case studies, and cultivate relationships with enterprise clients.",
    requirements: [
      "Degree in Marketing, Communications, or Business Administration.",
      "2+ years of experience in B2B marketing, lead generation, or corporate sales.",
      "Familiarity with LinkedIn Campaign Manager, Google Ads, SEO, and email outreach tooling.",
      "Superb writing and verbal communication skills with a professional demeanor."
    ],
    responsibilities: [
      "Plan and execute content marketing campaigns highlighting our bespoke corporate orders.",
      "Qualify inbound B2B inquiries and schedule consults/showroom visits.",
      "Draft customized product catalogs and brand pitches for high-profile clients.",
      "Manage social media channels, highlighting our ethical production standards and case stories."
    ]
  },
  {
    title: "Apparel Design Intern",
    department: "Design & Development",
    location: "Pune Studio",
    type: "Internship (3-6 Months)",
    salaryRange: "Stipend: ₹15,000 - ₹20,000 / month",
    description: "Learn the ropes of premium apparel manufacturing. You will assist our design studio with material sourcing, client mockups, and trend research.",
    requirements: [
      "Current student or recent graduate in Fashion Design, Textiles, or related discipline.",
      "Basic understanding of Adobe Illustrator, Photoshop, and garment construction.",
      "Eager to learn, self-motivated, and highly collaborative.",
      "Strong interest in sustainable manufacturing and bespoke tailoring."
    ],
    responsibilities: [
      "Assist designers in creating client digital mockups and colorway variations.",
      "Organize fabric sample swatches, trim catalogs, and material libraries.",
      "Support pattern-makers and designers during fitting sessions and detail documentation.",
      "Contribute to mood boards and concept assets for new collections."
    ]
  }
];

export async function GET(req: NextRequest) {
  try {
    let jobs = await withRetry(async () => {
      return await prisma.job.findMany({
        orderBy: { createdAt: "desc" }
      });
    });

    // Auto-seed if database is empty
    if (jobs.length === 0) {
      await withRetry(async () => {
        await prisma.job.createMany({
          data: INITIAL_JOBS
        });
      });
      // Fetch again
      jobs = await withRetry(async () => {
        return await prisma.job.findMany({
          orderBy: { createdAt: "desc" }
        });
      });
    }

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error("GET Jobs Error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth guard - only admins can post
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, department, location, type, salaryRange, description, requirements, responsibilities } = await req.json();

    if (!title || !department || !location || !type || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newJob = await withRetry(async () => {
      return await prisma.job.create({
        data: {
          title,
          department,
          location,
          type,
          salaryRange: salaryRange || "",
          description,
          requirements: Array.isArray(requirements) ? requirements : [],
          responsibilities: Array.isArray(responsibilities) ? responsibilities : []
        }
      });
    });

    return NextResponse.json(newJob);
  } catch (error: any) {
    console.error("POST Job Error:", error);
    return NextResponse.json({ error: "Failed to create job." }, { status: 500 });
  }
}
