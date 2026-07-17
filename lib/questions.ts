// Curated, resume-grounded interview questions with strong model answers.
// These are written specifically for Utkarsh Singh's background so he can
// confidently defend everything on his resume. The Groq API route can
// generate additional questions on demand in the same shape.

export type Difficulty = "beginner" | "intermediate" | "advanced" | "staff";

export type Category =
  | "intro"
  | "project"
  | "genai"
  | "backend"
  | "systemdesign"
  | "behavioral";

export type Question = {
  id: string;
  category: Category;
  difficulty: Difficulty;
  question: string;
  answer: string;
  tags: string[];
};

export const categoryMeta: Record<
  Category,
  { label: string; emoji: string; blurb: string }
> = {
  intro: { label: "About You", emoji: "👋", blurb: "Tell-me-about-yourself & story" },
  project: { label: "Projects", emoji: "🛠️", blurb: "Defend every project on the resume" },
  genai: { label: "GenAI / LLM", emoji: "🧠", blurb: "RAG, fine-tuning, serving, eval" },
  backend: { label: "Backend", emoji: "⚙️", blurb: "APIs, caching, databases, latency" },
  systemdesign: { label: "System Design", emoji: "🏗️", blurb: "Scale, trade-offs, architecture" },
  behavioral: { label: "Behavioral", emoji: "💬", blurb: "STAR stories & soft skills" },
};

export const difficultyMeta: Record<Difficulty, { label: string; order: number }> = {
  beginner: { label: "Beginner", order: 0 },
  intermediate: { label: "Intermediate", order: 1 },
  advanced: { label: "Advanced", order: 2 },
  staff: { label: "Staff", order: 3 },
};

export const questions: Question[] = [
  // ---------- INTRO / ABOUT YOU ----------
  {
    id: "intro-1",
    category: "intro",
    difficulty: "beginner",
    question: "Tell me about yourself.",
    answer:
      "I'm an AI/ML engineer focused on shipping production GenAI, not prototypes. Right now at Cellogen Therapeutics I architected a multi-portal medical-AI platform for CAR-T therapy — separate Patient, Clinician, and Researcher experiences, each with its own RAG pipeline, FAISS index, and fine-tuned weights, serving 100+ users. My core strength is the full LLM lifecycle: retrieval (hybrid FAISS + MedCPT), fine-tuning (LoRA on BioMistral-7B), evaluation (Ragas/LangSmith), and GPU serving with quantization. What makes that reliable is my backend background — 1+ year building FastAPI/Flask and Node services with Redis caching and Postgres tuning, so I deliver AI as low-latency services. I'm looking for an AI engineering role where I can own systems end-to-end like this.",
    tags: ["pitch", "summary"],
  },
  {
    id: "intro-2",
    category: "intro",
    difficulty: "intermediate",
    question: "There's a career break on your resume from May 2025 to Feb 2026. Can you explain it?",
    answer:
      "Yes — it was a planned break for health recovery. I was upfront about it because it was intentional, not a gap I'm hiding. During that time I wasn't idle: I did focused, self-directed work on LLM fine-tuning, RAG, and model evaluation — the exact areas I'm now shipping at Cellogen. So the break actually sharpened the skills that got me my current role. I'm fully recovered and have been delivering in production since.",
    tags: ["career-break", "honesty"],
  },
  {
    id: "intro-3",
    category: "intro",
    difficulty: "intermediate",
    question: "You moved from backend engineering into AI. Why, and how does the backend experience help?",
    answer:
      "I started in backend because I wanted to understand how systems actually run in production — latency, caching, data modeling. When GenAI matured, I realized most teams could build a demo but struggled to make it reliable, and that gap is exactly where my backend skills matter. Fine-tuning a model is half the job; serving it at ~2.5s p95 with quantization, Redis caching, fallbacks, and auth is the other half. My backend background is why I think about eval sets, p95, and failure modes, not just model accuracy.",
    tags: ["transition", "positioning"],
  },
  {
    id: "intro-4",
    category: "intro",
    difficulty: "advanced",
    question: "What's your biggest weakness as an engineer?",
    answer:
      "Historically I over-invested in making the first version too complete — e.g. building a 5-model fallback chain before I'd proven the single-model path. I've corrected this by being ruthless about shipping a thin vertical slice first and measuring it with an eval set before adding complexity. On the Cellogen pipeline I now start with one retriever + one model, get a faithfulness baseline in Ragas, and only then add reranking or fallbacks if the numbers justify it.",
    tags: ["weakness", "self-awareness"],
  },

  // ---------- PROJECTS ----------
  {
    id: "proj-1",
    category: "project",
    difficulty: "intermediate",
    question: "Walk me through the architecture of the Cellogen multi-portal medical-AI platform.",
    answer:
      "It's a role-based platform with three portals — Patient, Clinician, Researcher — that share infrastructure but differ in retrieval scope, model behavior, and tone. Frontend is Next.js 14 + TypeScript with JWT auth. Each request hits a FastAPI/Flask backend that first does intent routing with Llama-3.1-8B to decide the query type, then runs a 3-stage evidence pipeline: (1) retrieval — FAISS + MedCPT embeddings over a per-role corpus, (2) reasoning — a LoRA-fine-tuned BioMistral-7B, (3) synthesis — an LLM composes a grounded, cited answer. A 5-model fallback chain handles timeouts/failures, and Redis caches embeddings and frequent answers to hold ~2.5s p95. The 7B runs on an RTX PRO 6000 with VRAM-aware quantization.",
    tags: ["cellogen", "architecture", "rag"],
  },
  {
    id: "proj-2",
    category: "project",
    difficulty: "advanced",
    question: "Why did each portal (Patient/Clinician/Researcher) get its own RAG pipeline and index instead of one shared index with filters?",
    answer:
      "Three reasons. First, safety and tone: a patient answer must be cautious and plain-language, a researcher answer can be dense and citation-heavy — that's a different synthesis prompt and sometimes different weights, not just a filter. Second, retrieval quality: a shared index dilutes relevance because clinician-grade documents would rank for patient queries; per-role corpora keep the embedding neighborhood clean. Third, blast radius: I can re-index or re-tune one portal without risking the others. The trade-off is more storage and index maintenance, which is acceptable at our scale and worth it for correctness in a medical setting.",
    tags: ["cellogen", "rag", "trade-offs"],
  },
  {
    id: "proj-3",
    category: "project",
    difficulty: "advanced",
    question: "You claim ungrounded answers dropped ~35%. How did you measure that?",
    answer:
      "I built a clinical eval set of representative queries with reference answers and acceptable source documents. I measured groundedness/faithfulness — whether every claim in the answer is supported by retrieved context — using a Ragas-style faithfulness metric plus manual spot-checks with a clinician. I ran the baseline (base model, single retriever) against the full pipeline (MedCPT retrieval + LoRA BioMistral + synthesis + routing). The ~35% is the relative reduction in answers flagged as unsupported. I tracked it as a regression metric so pipeline changes couldn't silently make it worse.",
    tags: ["cellogen", "evaluation", "ragas"],
  },
  {
    id: "proj-4",
    category: "project",
    difficulty: "advanced",
    question: "Explain the RAG Evaluation & Observability Service project and why you built it.",
    answer:
      "It's a standalone RAG service over a public biomedical corpus that I built to make RAG quality measurable, not vibes-based. It does hybrid retrieval — BM25 for lexical + dense embeddings for semantic + a reranker to fix ordering — and streams answers from a FastAPI endpoint with source-citation attribution. The key part is observability: a Ragas harness runs in CI on every commit tracking faithfulness, context precision, and answer relevance, so a bad prompt or retrieval change fails the build. I added LangSmith tracing to inspect individual runs and a Redis semantic cache to cut repeat latency and cost, all containerized with Docker.",
    tags: ["rag-eval", "observability", "ci"],
  },
  {
    id: "proj-5",
    category: "project",
    difficulty: "intermediate",
    question: "In SmoochBox you cut p95 latency by 35%. What exactly did you do?",
    answer:
      "Three concrete moves. First, Redis read-through caching on hot read paths like restaurant discovery, so repeated queries skip Postgres. Second, N+1 elimination — the discovery and cart endpoints were firing a query per item; I batched them with joins/IN queries. Third, composite Postgres indexes matching the actual query predicates (e.g. location + availability) so the planner stopped doing sequential scans. Separately, geolocation search used PostGIS + Redis GEO, which took discovery queries from ~420ms to ~180ms. I measured p95 before/after rather than averages because tail latency is what users feel.",
    tags: ["smoochbox", "latency", "redis", "postgres"],
  },
  {
    id: "proj-6",
    category: "project",
    difficulty: "staff",
    question: "If you rebuilt the Cellogen pipeline today, what would you change and why?",
    answer:
      "A few things. I'd formalize the eval set into a versioned, growing golden dataset with per-portal slices, so every model or prompt change is scored automatically before rollout. I'd add retrieval evaluation separately from generation — measuring recall@k on the retriever alone, since most RAG failures are retrieval failures. I'd consider serving the 7B via vLLM instead of plain Flask for continuous batching and much higher throughput. And I'd add a lightweight guardrail/uncertainty step so the system can say 'I don't have evidence for this' instead of forcing an answer — critical in a medical domain.",
    tags: ["cellogen", "improvements", "staff"],
  },

  // ---------- GENAI / LLM ----------
  {
    id: "genai-1",
    category: "genai",
    difficulty: "beginner",
    question: "Explain RAG in simple terms and why it beats just prompting an LLM.",
    answer:
      "RAG = Retrieval-Augmented Generation. Instead of relying only on what the model memorized during training, you first retrieve relevant documents from your own knowledge base (via vector search and/or keyword search), then feed those documents into the prompt so the model answers from them. It beats plain prompting for three reasons: the model can use fresh/private data it was never trained on, answers can be grounded and cited to reduce hallucination, and you update knowledge by re-indexing documents instead of re-training the model.",
    tags: ["rag", "fundamentals"],
  },
  {
    id: "genai-2",
    category: "genai",
    difficulty: "intermediate",
    question: "What is hybrid retrieval and why did you combine BM25 with dense embeddings?",
    answer:
      "Dense embeddings capture semantic meaning — 'heart attack' matches 'myocardial infarction' — but they can miss exact terms, codes, or rare entities. BM25 is lexical: it nails exact keyword/term matches but has no notion of meaning. Combining them covers both failure modes. In practice I retrieve candidates from both, fuse the ranked lists (e.g. reciprocal rank fusion), then run a cross-encoder reranker over the top candidates to get final ordering. The reranker is expensive per pair, so I only apply it to the shortlist, not the whole corpus.",
    tags: ["retrieval", "bm25", "reranking"],
  },
  {
    id: "genai-3",
    category: "genai",
    difficulty: "advanced",
    question: "Explain LoRA / PEFT. Why fine-tune BioMistral-7B with LoRA instead of full fine-tuning?",
    answer:
      "Full fine-tuning updates all 7B parameters — huge memory, expensive, and risks catastrophic forgetting. LoRA (Low-Rank Adaptation), a form of PEFT, freezes the base weights and injects small trainable low-rank matrices (A·B) into attention/linear layers. You only train those adapters — a tiny fraction of parameters — so it fits on modest GPUs, trains fast, and you can swap adapters per task. For BioMistral I only needed to adapt it to our clinical QA style and domain distribution on ~2,000 curated examples, which LoRA handles well without touching general language ability. It improved domain answer accuracy ~25% over the base model, and the adapter is small enough to version and hot-swap.",
    tags: ["lora", "peft", "fine-tuning"],
  },
  {
    id: "genai-4",
    category: "genai",
    difficulty: "advanced",
    question: "How did you decide 2,000 examples was enough, and how did you avoid overfitting?",
    answer:
      "For LoRA on a domain-adaptation task you don't need massive data — quality and coverage matter more than volume. I curated ~2,000 examples to cover the real query distribution and edge cases rather than scraping bulk data. To avoid overfitting: held-out clinical QA validation set, early stopping on validation loss, conservative LoRA rank and learning rate, and I watched for the model parroting training phrasings. The real check was the held-out accuracy gain (~25%) generalizing, plus the faithfulness metric on the full pipeline not degrading — if it had memorized, groundedness on unseen queries would have dropped.",
    tags: ["lora", "data", "overfitting"],
  },
  {
    id: "genai-5",
    category: "genai",
    difficulty: "intermediate",
    question: "What are embeddings, and why MedCPT specifically for the medical corpus?",
    answer:
      "Embeddings map text to vectors so semantically similar text lands close together, enabling similarity search. Generic embeddings (e.g. OpenAI/general sentence models) are trained on broad web text and under-perform on dense biomedical terminology. MedCPT is trained on biomedical query–article pairs from PubMed, so it understands clinical/biomedical semantics and retrieves far more relevant documents for medical queries. Using a domain-matched embedding model is often the single highest-leverage RAG improvement — better retrieval beats a bigger generator.",
    tags: ["embeddings", "medcpt", "retrieval"],
  },
  {
    id: "genai-6",
    category: "genai",
    difficulty: "advanced",
    question: "Why intent routing with Llama-3.1-8B and a 5-model fallback chain? Isn't that over-engineering?",
    answer:
      "Routing exists because query types differ — a factual lookup, a summarization, and an out-of-scope question shouldn't all go down the same expensive path. An 8B classifier is cheap and lets me send each query to the right pipeline, saving latency and cost. The fallback chain is about reliability, not showing off: GPU inference can time out, a model can be down, or an answer can fail a groundedness check — so I degrade gracefully to the next option instead of failing the user. That said, I'd be honest in an interview: I'd measure how often each fallback actually fires; if the 4th/5th rarely trigger, I'd simplify. Reliability features should be justified by data.",
    tags: ["routing", "fallback", "reliability"],
  },
  {
    id: "genai-7",
    category: "genai",
    difficulty: "advanced",
    question: "How do you serve a 7B model efficiently? Explain VRAM-aware quantization.",
    answer:
      "A 7B model in fp16 needs ~14GB just for weights, plus KV cache that grows with sequence length and batch size. Quantization stores weights in lower precision (int8/int4, e.g. via bitsandbytes or GPTQ/AWQ) to cut VRAM roughly 2–4x with small accuracy loss, which lets me fit the model plus healthy KV-cache headroom on the GPU and avoid OOM under concurrency. 'VRAM-aware' means I pick the quantization level and max batch/context based on the actual card's memory budget. For higher throughput I'd move from plain Flask to vLLM for paged attention and continuous batching.",
    tags: ["serving", "quantization", "vram"],
  },
  {
    id: "genai-8",
    category: "genai",
    difficulty: "intermediate",
    question: "How do you evaluate a RAG system? What do faithfulness, context precision, and answer relevance mean?",
    answer:
      "You evaluate retrieval and generation separately. Retrieval: context precision/recall — did we fetch the right documents and are the top ones actually relevant. Generation: faithfulness — is every claim in the answer supported by the retrieved context (this catches hallucination); answer relevance — does the answer actually address the question. I run these with Ragas on a golden eval set, wired into CI so regressions fail the build, and use LangSmith traces to debug individual failures. The mental model: if faithfulness is low, fix the generator/prompt; if context precision is low, fix retrieval.",
    tags: ["evaluation", "ragas", "metrics"],
  },
  {
    id: "genai-9",
    category: "genai",
    difficulty: "staff",
    question: "A RAG answer is wrong. Walk me through how you debug it.",
    answer:
      "I isolate the stage. First look at the trace: what got retrieved? If the right document isn't in the retrieved set, it's a retrieval problem — check embedding model, chunking, k, and whether hybrid/reranking is on. If the right context WAS retrieved but the answer still ignored or contradicted it, it's a generation problem — check the prompt, context ordering (lost-in-the-middle), and whether the context got truncated. If retrieval and generation both look fine but the answer is still off, the source document itself may be wrong or the question is out of scope, which should trigger an 'insufficient evidence' response. I always reproduce on the eval set so the fix is verified, not anecdotal.",
    tags: ["debugging", "rag", "staff"],
  },
  {
    id: "genai-10",
    category: "genai",
    difficulty: "intermediate",
    question: "What's the difference between fine-tuning and RAG? When would you use each?",
    answer:
      "RAG changes what the model knows at inference time by injecting retrieved context — best for knowledge that's large, changing, or private, and when you need citations. Fine-tuning changes how the model behaves — its style, format, or domain reasoning — by updating weights; best for consistent output structure, tone, or domain adaptation that a prompt can't reliably enforce. They're complementary: at Cellogen I use RAG for up-to-date biomedical evidence and LoRA fine-tuning so BioMistral reasons in the right clinical style. Rule of thumb: reach for RAG first (cheaper, updatable); fine-tune when behavior, not knowledge, is the gap.",
    tags: ["fine-tuning", "rag", "trade-offs"],
  },

  // ---------- BACKEND ----------
  {
    id: "backend-1",
    category: "backend",
    difficulty: "beginner",
    question: "What is an N+1 query problem and how did you fix it?",
    answer:
      "N+1 happens when you run one query to fetch a list, then one additional query per item to fetch related data — so N items cost N+1 queries and latency explodes. In SmoochBox the discovery/cart endpoints did exactly this. I fixed it by fetching related data in a single query using joins or an IN clause (batch loading), so it's 1–2 queries regardless of list size. That, plus caching and indexes, is what cut p95 by 35%.",
    tags: ["n+1", "postgres", "performance"],
  },
  {
    id: "backend-2",
    category: "backend",
    difficulty: "intermediate",
    question: "Explain read-through caching with Redis. What are the pitfalls?",
    answer:
      "Read-through: on a read, check Redis first; on a miss, read from Postgres, write it into Redis with a TTL, then return it. Repeated reads then skip the database. Pitfalls I watch for: stale data — so I set sensible TTLs and invalidate keys on writes; cache stampede — when a hot key expires, many requests hit the DB at once, mitigated with a short lock or jittered TTLs; and cache penetration — repeated misses for non-existent keys, handled by caching a negative marker. The rule is cache only what's read-heavy and tolerant of slight staleness.",
    tags: ["redis", "caching", "consistency"],
  },
  {
    id: "backend-3",
    category: "backend",
    difficulty: "intermediate",
    question: "How does JWT authentication work, and what are its trade-offs vs sessions?",
    answer:
      "With JWT the server issues a signed token containing claims (user id, role, expiry) after login; the client sends it on each request and the server verifies the signature — no server-side session store needed, which scales horizontally well. Trade-offs: you can't easily revoke a JWT before it expires, so I keep access tokens short-lived and pair them with refresh tokens; you must protect against token theft (store carefully, use HTTPS); and never put secrets in the payload since it's only base64-encoded, not encrypted. Sessions are easier to revoke but need a shared store like Redis.",
    tags: ["jwt", "auth", "security"],
  },
  {
    id: "backend-4",
    category: "backend",
    difficulty: "intermediate",
    question: "FastAPI vs Flask — why did you use each?",
    answer:
      "Flask is synchronous and minimal — I used it at Cellogen for the GPU inference server because model inference is CPU/GPU-bound and largely blocking, so async buys little there and Flask keeps the serving layer simple. FastAPI is async-first with built-in Pydantic validation and auto OpenAPI docs — great for I/O-bound API layers doing lots of concurrent network/DB calls, and for streaming endpoints like the RAG service. So: FastAPI for the concurrent API surface, Flask for the tight model-serving box.",
    tags: ["fastapi", "flask", "async"],
  },
  {
    id: "backend-5",
    category: "backend",
    difficulty: "advanced",
    question: "How would you add rate limiting to your inference API and why is it critical for LLM serving?",
    answer:
      "LLM inference is expensive and GPU capacity is finite, so without limits one user or a bug can starve everyone and blow up cost. I'd implement a token-bucket or sliding-window limiter in Redis keyed per user/API key — atomic increment with expiry — enforced at the API gateway before the request ever reaches the GPU. I'd return 429 with a Retry-After header, tier limits by plan, and separately bound concurrency to the GPU (a queue with max in-flight requests) so I protect the actual bottleneck, not just request count.",
    tags: ["rate-limiting", "redis", "serving"],
  },
  {
    id: "backend-6",
    category: "backend",
    difficulty: "advanced",
    question: "How do you keep a cache consistent with the database when data changes?",
    answer:
      "There's no perfect answer, only trade-offs. My default is cache-aside with write invalidation: on write, update Postgres then delete the affected cache keys so the next read repopulates fresh — simpler and safer than write-through which can leave partial state. For data that must be fresh I use short TTLs so staleness is bounded even if an invalidation is missed. For derived/aggregate data I invalidate by key patterns or version the keys. I explicitly accept eventual consistency for read-heavy, staleness-tolerant data, and I never cache things like balances or auth state that must be strictly correct.",
    tags: ["caching", "consistency", "redis"],
  },

  // ---------- SYSTEM DESIGN ----------
  {
    id: "sd-1",
    category: "systemdesign",
    difficulty: "advanced",
    question: "Design a scalable RAG chatbot serving 10,000 users. Walk me through it.",
    answer:
      "Start with the flow: client → API gateway (auth + rate limiting) → orchestration service → retrieval → LLM → response, streamed back. Scale each layer independently. Retrieval: a managed/replicated vector DB (pgvector/Pinecone/FAISS shards) with an embedding cache in Redis so repeated queries skip re-embedding. Generation: serve open models on GPUs behind vLLM with continuous batching and a request queue, or fall back to an API provider for spikes; autoscale on queue depth. Add a semantic cache so common Q&As return instantly. Cross-cutting: rate limiting per user, observability (traces, token/cost metrics, faithfulness sampling), and graceful degradation (fallback model, cached answer, or 'try again') under load. Bottleneck is almost always GPU throughput, so I design the queue and batching around that.",
    tags: ["system-design", "rag", "scale"],
  },
  {
    id: "sd-2",
    category: "systemdesign",
    difficulty: "staff",
    question: "How would you design evaluation and monitoring so a model update never silently degrades quality in production?",
    answer:
      "Two layers: offline gates and online monitoring. Offline: a versioned golden eval set with per-segment slices; every model/prompt change runs Ragas (faithfulness, context precision, answer relevance) in CI and must beat a threshold to merge — a canary that fails the build. Online: sample real traffic, log traces (LangSmith), track latency/p95, cost/tokens, and a lightweight automated faithfulness check on a sample, plus thumbs-up/down from users. Roll out behind a flag with a canary percentage and automatic rollback if online metrics regress. The principle: quality is a regression-tested metric, not a hope.",
    tags: ["system-design", "evaluation", "mlops", "staff"],
  },

  {
    id: "sd-3",
    category: "systemdesign",
    difficulty: "advanced",
    question: "Design a multi-tenant LLM API platform with cost control and rate limiting.",
    answer:
      "Clients hit an API gateway that authenticates (API key → tenant), then a limiter enforces per-tenant quotas in Redis — I'd limit tokens, not just requests, since cost scales with tokens. Requests enter a queue in front of a GPU pool served by vLLM with continuous batching; concurrency is bounded to the GPU, not the request count, because the GPU is the real bottleneck. Routing sends cheap/simple queries to a small model and hard ones to a large one, which is the biggest cost lever. A semantic cache returns near-duplicate answers instantly. I meter tokens per tenant into a usage store for billing and alerts, and enforce hard caps to prevent runaway spend. Cross-cutting: tracing per request, cost dashboards, and graceful 429s with Retry-After.",
    tags: ["system-design", "multi-tenant", "cost", "rate-limiting"],
  },
  {
    id: "sd-4",
    category: "systemdesign",
    difficulty: "advanced",
    question: "Design a document-processing pipeline that extracts structured data from PDFs using LLMs.",
    answer:
      "Ingest to object storage (S3) and emit an event per document. A parsing stage (Unstructured/LlamaParse) converts PDF to text plus layout — this stage dominates quality, so I'd handle scanned docs via OCR and keep tables intact. Then chunk with structure awareness and run extraction: an LLM with a strict JSON schema (function calling / structured output) per field, with confidence. Validate against the schema; anything failing validation or below a confidence threshold routes to a human-review queue rather than silently writing bad data. Persist to Postgres, keep the raw text for re-processing, and make the whole thing idempotent and resumable per document since batches are large. I'd measure field-level accuracy on a labeled set, not just 'it ran'.",
    tags: ["system-design", "pipeline", "extraction", "structured-output"],
  },
  {
    id: "sd-5",
    category: "systemdesign",
    difficulty: "staff",
    question: "Design an AI agent platform that safely executes tools on behalf of users.",
    answer:
      "Core loop: LLM plans → selects a tool → executes → observes → repeats, orchestrated by something durable like LangGraph so state survives crashes and steps are resumable. Tools are declared with typed schemas (MCP-style) and every call goes through a permission layer keyed to the user — read tools auto-approve, mutating/irreversible ones require confirmation. Untrusted code runs in an isolated sandbox (E2B/containers) with no network or credentials by default. I'd bound the loop: max steps, timeouts, and a cost ceiling, since runaway agents are the classic failure. Treat prompt injection as the top threat — tool outputs are untrusted input, so never let retrieved content escalate permissions. Full tracing of every step for debugging and audit.",
    tags: ["system-design", "agents", "safety", "staff"],
  },
  {
    id: "sd-6",
    category: "systemdesign",
    difficulty: "advanced",
    question: "Design a semantic search system over 100M documents. What breaks first?",
    answer:
      "At 100M vectors, an exact flat index is impossible — you need ANN (HNSW or IVF-PQ) and sharding. I'd shard by tenant or topic, replicate for read throughput, and use product quantization to keep memory sane, accepting a small recall hit. Embedding 100M docs is a big batch job — run it distributed (Ray/Spark), version the embedding model, and plan for re-embedding since a model change means a full re-index. Serve hybrid: BM25 + vector, fused and reranked on the top ~100 only, because the reranker is the expensive part. What breaks first is usually memory and index build time, then recall degradation from aggressive quantization. I'd track recall@k against a labeled set so 'faster' never silently means 'worse'.",
    tags: ["system-design", "vector-search", "scale", "ann"],
  },
  {
    id: "sd-7",
    category: "systemdesign",
    difficulty: "staff",
    question: "Design an end-to-end fine-tuning pipeline: data → train → eval → deploy.",
    answer:
      "Data: collect and curate examples with provenance, dedupe, filter for quality, and version the dataset (DVC or a table) — dataset version is as important as model version. Train: LoRA/PEFT jobs on a GPU pool, config-driven (Axolotl-style), with every run logged to MLflow/W&B including hyperparameters and dataset hash for reproducibility. Eval: automatic gates on a held-out golden set — domain accuracy plus regression checks on general ability so you catch catastrophic forgetting; the run fails if it doesn't beat the incumbent. Deploy: register the adapter, roll out behind a flag to a canary slice, monitor online quality and latency, auto-rollback on regression. Adapters are small so I can hot-swap and keep the base model shared across tasks.",
    tags: ["system-design", "fine-tuning", "mlops", "staff"],
  },
  {
    id: "sd-8",
    category: "systemdesign",
    difficulty: "advanced",
    question: "How would you design caching for an LLM application? What are the layers?",
    answer:
      "Three layers. Exact cache: hash the normalized prompt + model + params → response in Redis. Cheap, safe, big win on repeated queries. Semantic cache: embed the query and return a cached answer if similarity exceeds a threshold — much higher hit rate, but risky, so I keep the threshold conservative and never semantically cache anything personalized or time-sensitive. Provider-side prompt caching: reuse a long static system prompt/context across calls to cut cost and TTFT. Also cache embeddings, since re-embedding identical text is pure waste. Cross-cutting: TTLs bounded by how fast the underlying knowledge changes, invalidate on re-index, and track hit rate plus a sample of cached answers for quality — a stale wrong answer served instantly is worse than a slow right one.",
    tags: ["system-design", "caching", "cost", "latency"],
  },
  {
    id: "sd-9",
    category: "systemdesign",
    difficulty: "advanced",
    question: "Design a real-time recommendation system using embeddings.",
    answer:
      "Two stages: candidate generation then ranking. Candidates come from ANN search over item embeddings using the user's embedding (from recent interactions), pulling ~500 from 10M — this must be fast, so it's a vector index, not a model. Ranking then scores those with a heavier model using richer features (context, freshness, business rules). Embeddings are computed offline in batch and refreshed on a schedule; the user vector updates in near-real-time from a stream (Kafka) so recent behavior matters. A feature store keeps training and serving features consistent — training/serving skew is the classic bug here. Serve behind a cache with a p99 budget, and measure online CTR via A/B, since offline metrics routinely disagree with production.",
    tags: ["system-design", "recsys", "embeddings", "real-time"],
  },
  {
    id: "sd-10",
    category: "systemdesign",
    difficulty: "staff",
    question: "How do you design guardrails for a production LLM in a regulated domain?",
    answer:
      "Defense in depth at three points. Input: PII detection/redaction (Presidio), prompt-injection screening, and scope checks that reject out-of-domain questions instead of guessing. Generation: constrain with retrieval so answers are grounded, use structured output where possible, and keep a strict system prompt — but never rely on the prompt alone as a control. Output: a safety classifier (Llama Guard-style), a groundedness check that every claim is supported by retrieved context, and a refusal path — in a medical setting 'I don't have evidence for this' must be an acceptable, well-designed answer. Around all of it: full audit logging, human review for high-risk categories, and versioned evals so a prompt change can't silently weaken safety. The principle is that guardrails are a system, not a prompt.",
    tags: ["system-design", "guardrails", "safety", "compliance", "staff"],
  },

  // ---------- BEHAVIORAL ----------
  {
    id: "beh-1",
    category: "behavioral",
    difficulty: "intermediate",
    question: "Tell me about a time you improved the performance of a system. (STAR)",
    answer:
      "Situation: At MindNerves, SmoochBox's discovery and checkout APIs had p95 latency high enough to hurt UX. Task: I owned bringing tail latency down without a rewrite. Action: I profiled the hot endpoints, found N+1 query patterns and missing indexes, added Redis read-through caching on discovery, batched the N+1 queries, added composite Postgres indexes matching the query predicates, and moved geo search to PostGIS + Redis GEO. Result: p95 dropped 35% and discovery query time went from ~420ms to ~180ms. The lesson I emphasize: I measured p95, not averages, because tail latency is what users actually feel.",
    tags: ["star", "performance", "impact"],
  },
  {
    id: "beh-2",
    category: "behavioral",
    difficulty: "advanced",
    question: "Tell me about a technical decision you made and its trade-offs. (STAR)",
    answer:
      "Situation: At Cellogen, patient and clinician answers needed very different safety, tone, and retrieval scope. Task: decide between one shared index with filters or separate pipelines per role. Action: I chose separate RAG pipelines and indexes per portal, accepting more storage and maintenance in exchange for cleaner retrieval, role-specific synthesis, and smaller blast radius when re-indexing or re-tuning one role. I validated the choice against a clinical eval set. Result: ungrounded answers dropped ~35%, and I could iterate on one portal without risking the others. Trade-off I'd own: it costs more operationally, so at much larger scale I'd revisit a shared index with strong metadata filtering.",
    tags: ["star", "trade-offs", "decision"],
  },
  {
    id: "beh-3",
    category: "behavioral",
    difficulty: "intermediate",
    question: "Tell me about a time you had to learn something quickly.",
    answer:
      "During my career break I decided to move deeper into LLM fine-tuning and evaluation. Task: get production-capable, not just tutorial-level. Action: I learned by building — I stood up the RAG Evaluation & Observability service end-to-end: hybrid retrieval, a Ragas harness in CI, LangSmith tracing, a Redis semantic cache, all in Docker. That forced me to understand faithfulness, context precision, reranking, and serving for real. Result: I walked into Cellogen able to design and measure a full RAG + fine-tuning pipeline from day one. My approach to learning fast is always to ship a real project, not just read.",
    tags: ["star", "learning", "growth"],
  },
];

export const questionCount = questions.length;
