// Structured representation of Utkarsh Singh's resume.
// This is the single source of truth the whole app is "grounded" in.
// It can later be overwritten by an AI parse of an uploaded PDF and
// edited manually from the Profile tab, then persisted to Supabase.

export type ResumeExperience = {
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
};

export type ResumeProject = {
  name: string;
  stack: string[];
  bullets: string[];
};

export type Resume = {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  links: { label: string; url: string }[];
  summary: string;
  skills: {
    genai: string[];
    mldl: string[];
    llms: string[];
    vectorSearch: string[];
    backend: string[];
    mlops: string[];
    languages: string[];
  };
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: {
    school: string;
    degree: string;
    location: string;
    start: string;
    end: string;
  }[];
};

export const resume: Resume = {
  name: "Utkarsh Singh",
  title: "AI/ML Engineer",
  location: "Lucknow, India",
  phone: "+91-6394791808",
  email: "utkarshsingh4345@gmail.com",
  links: [
    { label: "LinkedIn", url: "https://linkedin.com/in/utkarsh-singh80" },
    { label: "GitHub", url: "https://github.com/utkarshsingh-8" },
  ],
  summary:
    "AI/ML Engineer specializing in production GenAI — multi-portal RAG, LoRA fine-tuning of biomedical LLMs (BioMistral-7B), multi-LLM routing, and GPU-served inference — across the full LLM lifecycle: retrieval, fine-tuning, evaluation, and serving. Backed by 1+ year of production backend engineering (FastAPI/Flask, Node.js, Redis, PostgreSQL, AWS), delivering AI as reliable, low-latency services rather than prototypes.",
  skills: {
    genai: [
      "RAG",
      "Hybrid retrieval",
      "Reranking",
      "LoRA / PEFT fine-tuning",
      "Multi-LLM orchestration",
      "Prompt engineering",
      "LLM evaluation (Ragas, LangSmith)",
    ],
    mldl: [
      "PyTorch",
      "Transformers",
      "HuggingFace",
      "PEFT",
      "Embeddings",
      "Model evaluation & benchmarking",
    ],
    llms: [
      "BioMistral-7B",
      "Llama 3.1 / 3.3",
      "GPT-4",
      "Claude",
      "OpenAI",
      "Anthropic",
      "Groq",
    ],
    vectorSearch: ["FAISS", "pgvector", "Pinecone", "BM25", "MedCPT embeddings"],
    backend: [
      "FastAPI",
      "Flask",
      "Node.js",
      "REST",
      "JWT",
      "PostgreSQL",
      "Redis",
      "MongoDB",
    ],
    mlops: [
      "AWS (EC2, S3, Lambda)",
      "Docker",
      "GitHub Actions (CI/CD)",
      "CUDA",
    ],
    languages: ["Python", "JavaScript / TypeScript", "SQL"],
  },
  experience: [
    {
      company: "Cellogen Therapeutics",
      role: "AI Engineer",
      location: "Noida, India",
      start: "Mar 2026",
      end: "Present",
      bullets: [
        "Architected a production multi-portal medical-AI platform for CAR-T cell therapy with role-specific Patient, Clinician, and Researcher experiences each backed by its own RAG pipeline, FAISS index, and fine-tuned model weights; used by 100+ active users.",
        "Designed a 3-stage biomedical evidence pipeline (FAISS + MedCPT retrieval → LoRA-fine-tuned BioMistral-7B → LLM synthesis) with Llama-3.1-8B intent routing and a 5-model fallback chain, reducing ungrounded answers by ~35% on a clinical eval set.",
        "Fine-tuned BioMistral-7B with LoRA / PEFT on ~2,000 curated biomedical examples, improving domain answer accuracy by ~25% over the base model on a held-out clinical QA set.",
        "Deployed 7B inference on an RTX PRO 6000 GPU via Flask with VRAM-aware quantization; shipped end-to-end with a Next.js 14 + TypeScript frontend, JWT auth, and Redis caching at ~2.5s p95.",
      ],
    },
    {
      company: "Career Break — Health Recovery & Self-Directed AI/ML Upskilling",
      role: "Self-Directed",
      location: "Remote",
      start: "May 2025",
      end: "Feb 2026",
      bullets: [
        "Took a planned break for health recovery while deepening hands-on skills in LLM fine-tuning, retrieval-augmented generation, and model evaluation through self-directed study.",
      ],
    },
    {
      company: "MindNerves Technology Services Pvt. Ltd.",
      role: "Software Engineer",
      location: "Pune, India",
      start: "Jan 2025",
      end: "May 2025",
      bullets: [
        "Shipped backend for SmoochBox (US food-delivery): owned location-based restaurant discovery, cart, checkout, and real-time order tracking; cut p95 API latency 35% via Redis read-through caching, N+1 elimination, and composite Postgres indexes.",
        "Built geolocation search using PostGIS + Redis GEO, dropping discovery query time from ~420ms to ~180ms across regions.",
      ],
    },
    {
      company: "North Shore Technologies",
      role: "Consultant / Software Engineer",
      location: "Noida, India",
      start: "May 2024",
      end: "Jan 2025",
      bullets: [
        "Built REST services on Node.js + Express + MongoDB for a US event-discovery platform (listings, ticketing, venue management); reduced API response time 40% via query refactoring, compound indexes, and pagination on hot endpoints.",
      ],
    },
  ],
  projects: [
    {
      name: "RAG Evaluation & Observability Service",
      stack: ["Python", "FastAPI", "FAISS", "Ragas", "LangSmith", "Docker"],
      bullets: [
        "Built an end-to-end RAG service over a public biomedical corpus with hybrid retrieval (BM25 + dense + reranker) and a streaming FastAPI endpoint with source-citation attribution.",
        "Wired a Ragas evaluation harness into CI to track faithfulness, context precision, and answer relevance on every commit; added LangSmith tracing and a Redis semantic cache, containerized with Docker.",
      ],
    },
  ],
  education: [
    {
      school: "Babu Banarasi Das Northern India Institute of Technology",
      degree: "B.Tech, Information Technology",
      location: "Lucknow, India",
      start: "Jul 2020",
      end: "Jun 2024",
    },
  ],
};

// Flat skill list used across the app (dashboard, filters, assessments).
export const allSkills: string[] = [
  ...resume.skills.genai,
  ...resume.skills.mldl,
  ...resume.skills.llms,
  ...resume.skills.vectorSearch,
  ...resume.skills.backend,
  ...resume.skills.mlops,
  ...resume.skills.languages,
];
