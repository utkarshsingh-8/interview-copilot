// A curated map of the current AI tooling landscape — what exists, what it's
// for, and what to reach for next. `known: true` marks things already on the
// resume, so the rest reads as a "what to learn next" list.

export type Tool = {
  name: string;
  what: string;
  url: string;
  known?: boolean;
};

export type ToolGroup = { group: string; emoji: string; tools: Tool[] };

export const toolGroups: ToolGroup[] = [
  {
    group: "LLM providers & APIs",
    emoji: "🔌",
    tools: [
      { name: "OpenAI", what: "GPT models, embeddings, realtime & agents SDK.", url: "https://platform.openai.com/docs", known: true },
      { name: "Anthropic Claude", what: "Claude models — long context, strong reasoning, tool use, MCP.", url: "https://docs.anthropic.com", known: true },
      { name: "Google Gemini", what: "Multimodal models with very long context, Vertex integration.", url: "https://ai.google.dev" },
      { name: "Groq", what: "Ultra-low-latency inference on open models (LPU).", url: "https://console.groq.com/docs", known: true },
      { name: "Mistral AI", what: "Open + commercial European models, strong price/perf.", url: "https://docs.mistral.ai" },
      { name: "Cohere", what: "Enterprise RAG, best-in-class Embed & Rerank models.", url: "https://docs.cohere.com" },
      { name: "Together AI", what: "Hosted open models + fine-tuning at low cost.", url: "https://docs.together.ai" },
      { name: "Fireworks AI", what: "Fast hosted open-model inference + tuning.", url: "https://docs.fireworks.ai" },
      { name: "DeepSeek", what: "Strong open reasoning/coding models, very cheap.", url: "https://api-docs.deepseek.com" },
    ],
  },
  {
    group: "Open models worth knowing",
    emoji: "🦙",
    tools: [
      { name: "Llama 3.x", what: "Meta's open workhorse family — 8B to 405B.", url: "https://llama.meta.com", known: true },
      { name: "Qwen", what: "Alibaba's open models — strong multilingual & coding.", url: "https://qwenlm.github.io" },
      { name: "DeepSeek-R1", what: "Open reasoning model with visible chain-of-thought.", url: "https://github.com/deepseek-ai" },
      { name: "Mistral / Mixtral", what: "Efficient dense + MoE open models.", url: "https://mistral.ai/technology" },
      { name: "Gemma", what: "Google's small open models — good for on-device.", url: "https://ai.google.dev/gemma" },
      { name: "BioMistral", what: "Biomedical-domain Mistral variant.", url: "https://huggingface.co/BioMistral", known: true },
    ],
  },
  {
    group: "Serving & inference",
    emoji: "🚀",
    tools: [
      { name: "vLLM", what: "The standard for high-throughput serving — paged attention, continuous batching.", url: "https://docs.vllm.ai" },
      { name: "SGLang", what: "Fast serving runtime with strong structured-output support.", url: "https://docs.sglang.ai" },
      { name: "TGI", what: "HuggingFace Text Generation Inference server.", url: "https://huggingface.co/docs/text-generation-inference" },
      { name: "Triton Inference Server", what: "NVIDIA's multi-framework production serving.", url: "https://developer.nvidia.com/triton-inference-server" },
      { name: "TensorRT-LLM", what: "NVIDIA compiler for peak GPU inference speed.", url: "https://github.com/NVIDIA/TensorRT-LLM" },
      { name: "Ollama", what: "Run open models locally with one command.", url: "https://ollama.com" },
      { name: "llama.cpp", what: "CPU/edge inference with GGUF quantization.", url: "https://github.com/ggerganov/llama.cpp" },
      { name: "Modal", what: "Serverless GPUs — deploy Python inference fast.", url: "https://modal.com/docs" },
      { name: "Replicate", what: "Run/host models via simple API.", url: "https://replicate.com/docs" },
      { name: "RunPod", what: "Cheap on-demand GPU pods.", url: "https://docs.runpod.io" },
      { name: "Baseten", what: "Production model deployment with autoscaling.", url: "https://docs.baseten.co" },
    ],
  },
  {
    group: "Vector DBs & search",
    emoji: "🗂️",
    tools: [
      { name: "FAISS", what: "Meta's in-process ANN library — fast, no server.", url: "https://faiss.ai", known: true },
      { name: "pgvector", what: "Vector search inside Postgres — one less system.", url: "https://github.com/pgvector/pgvector", known: true },
      { name: "Pinecone", what: "Managed, serverless vector DB.", url: "https://docs.pinecone.io", known: true },
      { name: "Qdrant", what: "Open-source vector DB with strong filtering.", url: "https://qdrant.tech/documentation" },
      { name: "Weaviate", what: "Vector DB with built-in hybrid search modules.", url: "https://weaviate.io/developers/weaviate" },
      { name: "Milvus", what: "Scalable open vector DB for billion-scale.", url: "https://milvus.io/docs" },
      { name: "Chroma", what: "Simple embedded vector store for prototyping.", url: "https://docs.trychroma.com" },
      { name: "LanceDB", what: "Embedded, multimodal, disk-based vector DB.", url: "https://lancedb.github.io/lancedb" },
      { name: "Vespa", what: "Big-tech-grade hybrid search + ranking engine.", url: "https://docs.vespa.ai" },
      { name: "Elasticsearch / OpenSearch", what: "BM25 + kNN hybrid at enterprise scale.", url: "https://www.elastic.co/docs" },
    ],
  },
  {
    group: "Embeddings & rerankers",
    emoji: "🧬",
    tools: [
      { name: "Cohere Embed / Rerank", what: "Top-tier retrieval + cross-encoder reranking.", url: "https://docs.cohere.com/docs/rerank-overview" },
      { name: "Voyage AI", what: "High-quality domain embeddings (code, finance, law).", url: "https://docs.voyageai.com" },
      { name: "BGE (BAAI)", what: "Strong open embedding + reranker family.", url: "https://huggingface.co/BAAI" },
      { name: "Jina Embeddings", what: "Open long-context multilingual embeddings.", url: "https://jina.ai/embeddings" },
      { name: "sentence-transformers", what: "The standard library for embeddings in Python.", url: "https://sbert.net" },
      { name: "MedCPT", what: "Biomedical retrieval embeddings trained on PubMed.", url: "https://huggingface.co/ncbi/MedCPT-Query-Encoder", known: true },
    ],
  },
  {
    group: "RAG & orchestration",
    emoji: "🔗",
    tools: [
      { name: "LangChain", what: "Chains, integrations, the common glue layer.", url: "https://python.langchain.com/docs" },
      { name: "LangGraph", what: "Stateful graph orchestration for agents — durable, controllable.", url: "https://langchain-ai.github.io/langgraph" },
      { name: "LlamaIndex", what: "Data framework for indexing & RAG pipelines.", url: "https://docs.llamaindex.ai" },
      { name: "DSPy", what: "Programmatic prompt optimization instead of hand-tuning.", url: "https://dspy.ai" },
      { name: "Haystack", what: "Production-focused RAG/search pipelines.", url: "https://docs.haystack.deepset.ai" },
      { name: "Pydantic AI", what: "Type-safe agent framework built on Pydantic.", url: "https://ai.pydantic.dev" },
      { name: "Semantic Kernel", what: "Microsoft's orchestration SDK (.NET/Python).", url: "https://learn.microsoft.com/semantic-kernel" },
    ],
  },
  {
    group: "Agents & protocols",
    emoji: "🤖",
    tools: [
      { name: "MCP (Model Context Protocol)", what: "Open standard for connecting LLMs to tools/data. Increasingly asked about.", url: "https://modelcontextprotocol.io" },
      { name: "OpenAI Agents SDK", what: "Build multi-agent workflows with handoffs & guardrails.", url: "https://openai.github.io/openai-agents-python" },
      { name: "Claude Agent SDK", what: "Anthropic's toolkit for building agents.", url: "https://docs.anthropic.com" },
      { name: "CrewAI", what: "Role-based multi-agent collaboration.", url: "https://docs.crewai.com" },
      { name: "AutoGen", what: "Microsoft's multi-agent conversation framework.", url: "https://microsoft.github.io/autogen" },
      { name: "E2B", what: "Secure cloud sandboxes for AI-generated code.", url: "https://e2b.dev/docs" },
      { name: "Composio", what: "Pre-built tool/API integrations for agents.", url: "https://docs.composio.dev" },
      { name: "browser-use", what: "Let agents drive a real browser.", url: "https://github.com/browser-use/browser-use" },
    ],
  },
  {
    group: "Evaluation & observability",
    emoji: "📊",
    tools: [
      { name: "Ragas", what: "RAG metrics — faithfulness, context precision, relevance.", url: "https://docs.ragas.io", known: true },
      { name: "LangSmith", what: "Tracing, datasets, and evals for LLM apps.", url: "https://docs.smith.langchain.com", known: true },
      { name: "LangFuse", what: "Open-source LLM observability + evals (self-hostable).", url: "https://langfuse.com/docs" },
      { name: "Arize Phoenix", what: "Open-source tracing & eval notebooks.", url: "https://docs.arize.com/phoenix" },
      { name: "W&B Weave", what: "Trace, evaluate and compare LLM apps.", url: "https://weave-docs.wandb.ai" },
      { name: "DeepEval", what: "Pytest-style unit testing for LLM outputs.", url: "https://docs.confident-ai.com" },
      { name: "promptfoo", what: "Prompt/model A-B testing in CI.", url: "https://promptfoo.dev/docs" },
      { name: "Braintrust", what: "Eval platform with scoring + playground.", url: "https://www.braintrust.dev/docs" },
      { name: "Helicone", what: "LLM gateway — logging, caching, cost tracking.", url: "https://docs.helicone.ai" },
    ],
  },
  {
    group: "Fine-tuning",
    emoji: "🎛️",
    tools: [
      { name: "HuggingFace PEFT", what: "LoRA/QLoRA and friends — the standard.", url: "https://huggingface.co/docs/peft", known: true },
      { name: "TRL", what: "SFT, DPO, PPO training loops from HuggingFace.", url: "https://huggingface.co/docs/trl" },
      { name: "Unsloth", what: "2-5x faster LoRA fine-tuning, far less VRAM.", url: "https://docs.unsloth.ai" },
      { name: "Axolotl", what: "Config-driven fine-tuning for open models.", url: "https://axolotl-ai-cloud.github.io/axolotl" },
      { name: "LLaMA-Factory", what: "GUI/CLI for tuning 100+ models.", url: "https://github.com/hiyouga/LLaMA-Factory" },
      { name: "bitsandbytes", what: "4/8-bit quantization for training & inference.", url: "https://huggingface.co/docs/bitsandbytes", known: true },
    ],
  },
  {
    group: "Guardrails & safety",
    emoji: "🛡️",
    tools: [
      { name: "Guardrails AI", what: "Validate/structure LLM output, catch violations.", url: "https://www.guardrailsai.com/docs" },
      { name: "NeMo Guardrails", what: "NVIDIA's programmable conversation rails.", url: "https://docs.nvidia.com/nemo/guardrails" },
      { name: "Llama Guard", what: "Open safety classifier for input/output.", url: "https://huggingface.co/meta-llama" },
      { name: "Lakera Guard", what: "Prompt-injection & jailbreak detection.", url: "https://platform.lakera.ai/docs" },
      { name: "Presidio", what: "PII detection and redaction.", url: "https://microsoft.github.io/presidio" },
    ],
  },
  {
    group: "MLOps & cloud platforms",
    emoji: "☁️",
    tools: [
      { name: "AWS SageMaker", what: "End-to-end training, tuning, hosting on AWS.", url: "https://docs.aws.amazon.com/sagemaker" },
      { name: "Google Vertex AI", what: "GCP's unified ML/GenAI platform.", url: "https://cloud.google.com/vertex-ai/docs" },
      { name: "Azure AI Foundry", what: "Microsoft's GenAI app + model platform.", url: "https://learn.microsoft.com/azure/ai-foundry" },
      { name: "MLflow", what: "Experiment tracking + model registry.", url: "https://mlflow.org/docs/latest" },
      { name: "Weights & Biases", what: "The default for experiment tracking.", url: "https://docs.wandb.ai" },
      { name: "Kubeflow", what: "ML pipelines on Kubernetes.", url: "https://www.kubeflow.org/docs" },
      { name: "BentoML", what: "Package & serve models as production services.", url: "https://docs.bentoml.com" },
      { name: "Ray", what: "Distributed training/serving/data at scale.", url: "https://docs.ray.io" },
    ],
  },
  {
    group: "Data & ingestion",
    emoji: "🗄️",
    tools: [
      { name: "Unstructured", what: "Parse PDFs/docs into clean chunks for RAG.", url: "https://docs.unstructured.io" },
      { name: "LlamaParse", what: "LLM-powered parsing of complex PDFs/tables.", url: "https://docs.cloud.llamaindex.ai" },
      { name: "Firecrawl", what: "Crawl & convert websites to LLM-ready markdown.", url: "https://docs.firecrawl.dev" },
      { name: "Docling", what: "IBM's open document parsing toolkit.", url: "https://docling-project.github.io/docling" },
      { name: "Airflow", what: "The classic pipeline scheduler.", url: "https://airflow.apache.org/docs" },
      { name: "Dagster", what: "Asset-oriented, typed data orchestration.", url: "https://docs.dagster.io" },
      { name: "dbt", what: "SQL transformations with tests & lineage.", url: "https://docs.getdbt.com" },
      { name: "Kafka", what: "Event streaming backbone.", url: "https://kafka.apache.org/documentation" },
    ],
  },
  {
    group: "App layer & UI",
    emoji: "🖥️",
    tools: [
      { name: "Vercel AI SDK", what: "Streaming AI UIs in TypeScript/React.", url: "https://ai-sdk.dev/docs" },
      { name: "Streamlit", what: "Fastest way to demo an ML app in Python.", url: "https://docs.streamlit.io" },
      { name: "Gradio", what: "Quick model demos, powers HF Spaces.", url: "https://www.gradio.app/docs" },
      { name: "Chainlit", what: "Chat UI for LLM apps with tracing built in.", url: "https://docs.chainlit.io" },
      { name: "FastAPI", what: "Async Python API layer — the AI backend default.", url: "https://fastapi.tiangolo.com", known: true },
    ],
  },
];

export const allTools = toolGroups.flatMap((g) => g.tools);
