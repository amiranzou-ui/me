/**
 * One-off migration: legacy/js/matrix.js's DATA/NODES literals → Supabase.
 * Idempotent (upsert on natural key) — safe to re-run.
 *
 * Run with: node --env-file=.env.local -r tsx/cjs scripts/migrate-matrix.ts
 * (or: npx tsx --env-file=.env.local scripts/migrate-matrix.ts)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment");
}
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// ── Source data, copied verbatim from legacy/js/matrix.js (icons replaced
// with named keys per ARCHITECTURE.md — no raw <svg> strings in the DB) ──
const DATA = {
  name: "Abdulameer Albutaihi",
  tag: "Graphic Designer · Social Media Manager",
  bio: "I build the visual language brands speak. From healthcare to global retail — designing with clarity, consistency, and the belief that good design should feel inevitable.",
  contact: {
    email: "amiranzou@outlook.com",
    phone: "+964 774 151 3345",
    location: "Baghdad, Iraq",
  },
  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/abdulameeralbutaihi", icon: "linkedin" },
    { label: "Behance", url: "https://www.behance.net/amiranzou", icon: "behance" },
    { label: "Instagram", url: "https://www.instagram.com/ameer.is.off", icon: "instagram" },
    { label: "GitHub", url: "https://github.com/amiranzou-ui", icon: "github" },
  ],
  summary:
    "Graphic Designer with hands-on experience in branding, social media management, and visual communication across retail and healthcare environments. Skilled in creating digital and print assets that align with brand identity and audience needs. Experienced in managing end-to-end visual content for active social media platforms and developing promotional materials including campaigns, ads, and physical branding. Strong focus on clarity, consistency, and detail-driven design execution.",
  coreSkills: ["Graphic Design", "Social Media Management", "Brand Identity", "Visual Communication"],
  education: [{ degree: "Bachelor's Degree", school: "University of Technology — Baghdad, Iraq", date: "Sep 2020 — Jun 2024" }],
  languages: [
    { lang: "Arabic", level: "Native" },
    { lang: "English", level: "Fluent" },
    { lang: "German", level: "A2" },
  ],
  signals: [
    "Design is a conversation between the maker and the audience. I try to make sure they both leave understood.",
    "A consistent brand doesn't happen by accident — it's a system, and systems have logic.",
    "The best design work disappears into the thing it was made for.",
    "Typography is the first thing people read before they read a single word.",
  ],
};

const projects = [
  {
    slug: "igfic-medical-center",
    title: "I.G.F.I.C Medical Center",
    role: "Social Media Manager & Graphic Designer",
    description: "Full visual identity and social media management for a medical imaging center.",
    impact: "Manages all digital content, campaigns, and print materials — from billboards to daily posts — with a unified brand direction.",
    stack: ["Photoshop", "Illustrator", "InDesign", "Social Media"],
    behance_url: "https://www.behance.net/amiranzou",
    external_url: null,
  },
  {
    slug: "bershka",
    title: "Bershka",
    role: "Graphic Designer",
    description: "Visual content for one of the world's largest fast-fashion retail brands.",
    impact: "Produced marketing and promotional materials aligned with global brand aesthetic across seasonal campaigns.",
    stack: ["Photoshop", "Illustrator", "InDesign"],
    behance_url: "https://www.behance.net/amiranzou",
    external_url: null,
  },
  {
    slug: "personal-portfolio",
    title: "Personal Portfolio",
    role: "Designer & Developer",
    description: "This site — a two-sided identity system with ambient sound and an interactive CV.",
    impact: "Built entirely from scratch: spatial layout, node graph, living sound state, and cinematic transitions.",
    stack: ["HTML", "CSS", "JavaScript", "Web Audio API"],
    behance_url: null,
    external_url: "/",
  },
  {
    slug: "data-ship",
    title: "Data Ship",
    role: "Graphic Design Intern",
    description: "Early career work across digital and print — building the foundations of visual identity systems.",
    impact: "Contributed to branded materials and social assets while developing a consistent, cross-project visual language.",
    stack: ["Photoshop", "Illustrator", "Figma"],
    behance_url: "https://www.behance.net/amiranzou",
    external_url: null,
  },
];

const skillsGroups = [
  { group_name: "Design Tools", tags: ["Adobe Photoshop", "Adobe Illustrator", "Adobe InDesign", "Figma"] },
  { group_name: "Graphic Design", tags: ["Visual Identity", "Branding Systems", "Layout Composition", "Typography", "Print Design"] },
  { group_name: "Social Media", tags: ["Content Creation", "Campaign Visuals", "Promotional Design", "Digital Advertising"] },
  { group_name: "Brand Management", tags: ["Visual Consistency", "Brand Guidelines", "Audience-Focused Execution", "Art Direction"] },
];

const experience = [
  {
    role: "Social Media Manager & Graphic Designer",
    company: "I.G.F.I.C – Medical Imaging Center",
    date_label: "2025 — Present",
    points: [
      "Manage the clinic's social media platforms and overall visual communication.",
      "Design digital content including posts, campaigns, and advertisements aligned with brand identity.",
      "Create print materials such as billboards, posters, and promotional assets.",
      "Develop consistent visual direction to strengthen audience engagement and brand recognition.",
      "Handle day-to-day content needs including design requests and visual updates.",
    ],
  },
  {
    role: "Graphic Designer",
    company: "Bershka",
    date_label: "Sep 2024 — Jan 2025",
    points: [
      "Produced visual content aligned with brand aesthetic for marketing and promotional use.",
      "Collaborated with marketing and merchandising teams to support seasonal campaigns.",
      "Designed digital and print materials to enhance product presentation and visibility.",
      "Ensured consistency with brand guidelines across multiple deliverables.",
    ],
  },
  {
    role: "Graphic Design Intern",
    company: "Data Ship",
    date_label: "Sep 2021 — Mar 2022",
    points: [
      "Assisted in creating visual content for digital and print media.",
      "Supported marketing team in developing branded materials and social media assets.",
      "Contributed to maintaining consistent visual identity across projects.",
      "Worked collaboratively within design and development teams.",
    ],
  },
];

const NODES = [
  {
    id: "design", type: "timeline", x: 28, y: 30,
    title: "Graphic Design",
    summary: "Where everything starts. Form as a precise language.",
    connections: ["branding", "typography", "print", "portfolio"],
    thinking: [
      { phase: "origin", text: "I was drawn to design because it forces you to make decisions — every element is a choice, not an accident." },
      { phase: "tension", text: "The hardest part is knowing when to stop. Good design is what you take away, not what you add." },
      { phase: "belief", text: "A design that needs explaining has already failed. Clarity is the whole job." },
    ],
  },
  {
    id: "branding", type: "skill", x: 55, y: 20,
    title: "Brand Identity",
    summary: "Building the visual systems brands live inside.",
    connections: ["design", "igfic", "bershka", "social"],
    thinking: [
      { phase: "idea", text: "A brand is not a logo. It's a set of decisions that repeat consistently across everything." },
      { phase: "process", text: "I start with restrictions — what must this brand never look like? Then build inward from there." },
      { phase: "result", text: "When identity systems work, the brand feels like it always existed. That's the goal." },
    ],
  },
  {
    id: "social", type: "skill", x: 78, y: 35,
    title: "Social Media Management",
    summary: "Visual content that earns attention without asking for it.",
    connections: ["branding", "igfic"],
    thinking: [
      { phase: "challenge", text: "Social media content is consumed in half a second. The work has to work at that speed." },
      { phase: "approach", text: "Consistent visual language first — then messaging. People recognize the look before they read the copy." },
      { phase: "result", text: "Engagement follows identity. When the brand looks like itself, people trust it." },
    ],
  },
  {
    id: "igfic", type: "project", x: 78, y: 60,
    title: "I.G.F.I.C Medical Center",
    summary: "Full visual ownership — digital and physical.",
    connections: ["branding", "social", "print"],
    thinking: [
      { phase: "scope", text: "Healthcare design has to communicate trust before it communicates anything else." },
      { phase: "work", text: "Billboards, social posts, campaigns, and day-to-day content — all under one visual system." },
      { phase: "learning", text: "Managing content end-to-end teaches you how identity degrades when you stop paying attention. I don't let it." },
    ],
  },
  {
    id: "bershka", type: "project", x: 52, y: 68,
    title: "Bershka",
    summary: "Global retail. Brand aesthetic at scale.",
    connections: ["branding", "design"],
    thinking: [
      { phase: "context", text: "Working within an established global brand means your job is translation, not invention." },
      { phase: "process", text: "Seasonal campaigns: the aesthetic shifts but the DNA stays fixed. Learning to stretch without breaking." },
      { phase: "takeaway", text: "Discipline under constraints. Fast delivery without losing the brand standard." },
    ],
  },
  {
    id: "print", type: "skill", x: 22, y: 62,
    title: "Print Design",
    summary: "Physical objects carry weight digital can't replicate.",
    connections: ["design", "igfic", "branding"],
    thinking: [
      { phase: "difference", text: "Print is permanent. You can't push an update after a billboard goes up. That pressure makes you precise." },
      { phase: "craft", text: "Ink on paper has texture and intention. I design for that — not just for screen previews." },
    ],
  },
  {
    id: "typography", type: "thought", x: 10, y: 42,
    title: "type is thought made visible",
    summary: "Letterforms carry meaning before you read a single word.",
    connections: ["design", "portfolio"],
    thinking: [
      { phase: "notice", text: "You feel a typeface before you read it. That's not decoration — that's the first message." },
      { phase: "apply", text: "Every project: the type choice IS the argument, not a container for it." },
    ],
  },
  {
    id: "portfolio", type: "project", x: 30, y: 78,
    title: "This Website",
    summary: "Two-sided identity. Each side its own world.",
    connections: ["design", "typography"],
    thinking: [
      { phase: "concept", text: "Two modes of being — professional and personal. They needed two completely different visual languages." },
      { phase: "tension", text: "Most portfolios feel like resumés. I wanted this to feel like a place you discover." },
      { phase: "decision", text: "Matrix side: structured, precise. Human side: warm, expressive. Same person, different lenses." },
    ],
  },
];

async function main() {
  console.log("Upserting cv_meta...");
  const { error: cvErr } = await supabase.from("cv_meta").upsert({
    id: 1,
    name: DATA.name,
    tag: DATA.tag,
    bio: DATA.bio,
    contact: DATA.contact,
    links: DATA.links,
    summary: DATA.summary,
    core_skills: DATA.coreSkills,
    signals: DATA.signals,
    education: DATA.education,
    languages: DATA.languages,
  });
  if (cvErr) throw cvErr;

  console.log("Upserting projects...");
  for (const [i, p] of projects.entries()) {
    const { error } = await supabase.from("projects").upsert(
      {
        slug: p.slug,
        title: p.title,
        role: p.role,
        description: p.description,
        impact: p.impact,
        stack: p.stack,
        behance_url: p.behance_url,
        external_url: p.external_url,
        status: "published",
        sort_order: i,
        published_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
    if (error) throw error;
  }

  console.log("Upserting experience...");
  await supabase.from("experience").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  for (const [i, e] of experience.entries()) {
    const { error } = await supabase.from("experience").insert({ ...e, sort_order: i });
    if (error) throw error;
  }

  console.log("Upserting skills_groups...");
  await supabase.from("skills_groups").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  for (const [i, g] of skillsGroups.entries()) {
    const { error } = await supabase.from("skills_groups").insert({ ...g, sort_order: i });
    if (error) throw error;
  }

  console.log("Upserting matrix_nodes...");
  for (const [i, n] of NODES.entries()) {
    const { error } = await supabase.from("matrix_nodes").upsert(
      {
        node_key: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
        title: n.title,
        summary: n.summary,
        connections: n.connections,
        thinking: n.thinking,
        sort_order: i,
      },
      { onConflict: "node_key" },
    );
    if (error) throw error;
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
