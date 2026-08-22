import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH_DIR = "C:\\Users\\Tim\\.gemini\\antigravity\\brain\\f852b068-f1af-4257-b880-a94a5f63798d\\scratch";
const OUTPUT_FILE = path.join(SCRATCH_DIR, "new_200_ict_questions.json");

if (!fs.existsSync(SCRATCH_DIR)) {
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

console.log("=== GENERATING ALL 200 MODERN ICT & AI QUESTIONS ===");

const rawData = [
  // =========================================================================
  // 1. AI, LLMs & Generative AI (Questions 1 to 50)
  // =========================================================================
  [
    "ict_mod_2026_001",
    "What primary neural network architectural innovation enabled modern Large Language Models (LLMs) to process text sequences in parallel using self-attention mechanisms?",
    ["The Convolutional Neural Network (CNN) architecture.", "The Transformer architecture introduced by Vaswani et al.", "The Recurrent Neural Network (RNN) with LSTM.", "The Multilayer Perceptron (MLP) feedforward network."],
    1,
    "The Transformer architecture relies on self-attention mechanisms, allowing parallel processing of text tokens and capturing long-range dependencies efficiently.",
    "Artificial Intelligence & LLMs",
    ["Transformer", "Self-Attention", "LLMs"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_002",
    "In public sector AI adoption, what does Retrieval-Augmented Generation (RAG) combine with Large Language Models?",
    ["Real-time video rendering engines with external audio databases.", "External authoritative document retrieval with LLM generation to anchor responses in verified data.", "Replacing database tables with unindexed raw text files.", "Automatically deleting historical administrative records after query execution."],
    1,
    "Retrieval-Augmented Generation (RAG) fetches relevant text chunks from external domain databases and feeds them into the LLM prompt context for grounded answers.",
    "Generative AI in Governance",
    ["RAG", "Retrieval-Augmented Generation", "LLM"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_003",
    "What term describes the phenomenon where a Generative AI model generates confident but factually incorrect or ungrounded responses?",
    ["Algorithmic Latency.", "Model Hallucination.", "Data Overfitting.", "System Deadlock."],
    1,
    "AI Hallucination occurs when an LLM produces plausibly sounding but false or non-existent information due to statistical pattern completion.",
    "AI Ethics & Risks",
    ["Hallucination", "Generative AI", "Accuracy"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_004",
    "Which prompt engineering technique involves providing the LLM with a few illustrative input-output examples within the prompt context?",
    ["Zero-Shot Prompting.", "Few-Shot Prompting.", "Hyperparameter Tuning.", "Supervised Fine-Tuning (SFT)."],
    1,
    "Few-shot prompting conditions the language model by including exemplar demonstrations directly in the prompt context.",
    "Prompt Engineering",
    ["Few-Shot", "Prompting", "LLM"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_005",
    "What prompt technique explicitly instructs a Large Language Model to break down complex policy reasoning into step-by-step intermediate thoughts?",
    ["Chain-of-Thought (CoT) Prompting.", "Recursive Memory Allocation.", "Instruction Fine-Tuning.", "Token Embedding Alignment."],
    0,
    "Chain-of-Thought (CoT) prompting encourages models to generate intermediate reasoning steps, improving performance on complex analytical tasks.",
    "Prompt Engineering",
    ["Chain-of-Thought", "CoT", "Reasoning"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_006",
    "Which core principle of Explainable AI (XAI) is vital when deploying automated decision-making systems in public policy evaluation?",
    ["Hiding model weights from internal audit committees.", "Providing clear, understandable rationales for how input data yielded a specific automated decision.", "Maximizing model parameter size regardless of interpretability.", "Restricting AI outputs exclusively to binary yes/no answers."],
    1,
    "Explainable AI (XAI) ensures that automated decisions are transparent, auditable, and interpretable by human reviewers.",
    "AI Governance & Ethics",
    ["XAI", "Explainable AI", "Transparency"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_007",
    "What process aligns pre-trained Large Language Models with human values and safety guidelines using human evaluator preferences?",
    ["Reinforcement Learning from Human Feedback (RLHF).", "Unsupervised K-Means Clustering.", "Static Database Normalization.", "Hardware Acceleration Mapping."],
    0,
    "RLHF fine-tunes language models using reward models trained on human preference data to minimize harmful outputs and ensure safety.",
    "AI Alignment & Safety",
    ["RLHF", "Human Feedback", "AI Safety"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_008",
    "In Machine Learning, what type of learning algorithm relies on pre-labeled dataset training pairs (inputs and target outputs)?",
    ["Supervised Learning.", "Unsupervised Learning.", "Self-Organizing Clustering.", "Heuristic Discovery."],
    0,
    "Supervised Learning models are trained on datasets containing explicit feature-label pairs to learn predictive mappings.",
    "Machine Learning Fundamentals",
    ["Supervised Learning", "Labeled Data", "ML"],
    "ict_fundamentals",
    "ICT Fundamentals & Concepts"
  ],
  [
    "ict_mod_2026_009",
    "Which Machine Learning paradigm discovers hidden patterns, groupings, or clusters in unannotated data without predefined labels?",
    ["Supervised Regression.", "Unsupervised Learning.", "Supervised Classification.", "Deterministic Rule Scripting."],
    1,
    "Unsupervised learning identifies internal structure, dimensionality reduction, and clustering in unlabeled data.",
    "Machine Learning Fundamentals",
    ["Unsupervised Learning", "Clustering", "ML"],
    "ict_fundamentals",
    "ICT Fundamentals & Concepts"
  ],
  [
    "ict_mod_2026_010",
    "What is the primary risk of 'Overfitting' in Machine Learning predictive models used for public sector forecasting?",
    ["The model performs exceptionally on training data but fails to generalize to new, unseen real-world data.", "The model runs too fast on standard server hardware.", "The model deletes its underlying database tables.", "The model requires zero computational memory."],
    0,
    "Overfitting occurs when a model memorizes noise in the training set, leading to poor generalization performance on evaluation data.",
    "Machine Learning Risks",
    ["Overfitting", "Generalization", "Training"],
    "ict_fundamentals",
    "ICT Fundamentals & Concepts"
  ],
  [
    "ict_mod_2026_011",
    "Which technique reduces LLM model size and RAM footprint by converting 32-bit floating-point weights to 8-bit integers (INT8)?",
    ["Quantization.", "Data Augmentation.", "Batch Normalization.", "Recursive Indexing."],
    0,
    "Quantization compresses model weights into lower-bit representations, allowing efficient deployment on standard server hardware.",
    "AI Optimization",
    ["Quantization", "Compression", "INT8"],
    "ict_fundamentals",
    "ICT Fundamentals & Concepts"
  ],
  [
    "ict_mod_2026_012",
    "What is Parameter-Efficient Fine-Tuning (PEFT) method LoRA commonly used for when customizing open-weights LLMs for MDAs?",
    ["LoRA (Low-Rank Adaptation) updates a small set of added adapter weights while freezing the base model.", "LoRA deletes the entire underlying transformer vocabulary.", "LoRA converts text data into physical microfilm prints.", "LoRA locks access to cloud storage buckets."],
    0,
    "LoRA freezes pretrained model weights and injects trainable rank decomposition matrices, reducing trainable parameters by over 99%.",
    "LLM Customization",
    ["LoRA", "PEFT", "Fine-Tuning"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_013",
    "In vector databases supporting RAG pipelines, what spatial metric measures the semantic directional similarity between two text embedding vectors?",
    ["Cosine Similarity.", "Hamming Distance.", "Manhattan Block Step.", "Modulo Remainder."],
    0,
    "Cosine similarity measures the angle between multi-dimensional embedding vectors, indicating how closely related two passages are in semantic meaning.",
    "Vector Search",
    ["Cosine Similarity", "Vector Search", "Embeddings"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_014",
    "What key vulnerability occurs when malicious inputs manipulate an LLM's prompt context to bypass safety filters?",
    ["Prompt Injection Attack.", "Buffer Overflow.", "SQL Table Dropping.", "Cross-Site Scripting (XSS)."],
    0,
    "Prompt Injection occurs when untrusted user text tricks the LLM into ignoring system instructions or safety rules.",
    "AI Cybersecurity",
    ["Prompt Injection", "LLM Security", "Vulnerability"],
    "ict_security",
    "Digital Security & Cybersecurity"
  ],
  [
    "ict_mod_2026_015",
    "Which organizational role is responsible for overseeing ethical AI deployment, algorithmic bias audits, and compliance with data governance standards in an MDA?",
    ["Chief AI Officer / Data Ethics Lead.", "Hardware Network Technician.", "Cable Infrastructure Contractor.", "Helpdesk Ticket Operator."],
    0,
    "Chief AI & Ethics Officers oversee responsible AI principles, ensuring algorithmic transparency, fairness, and regulatory compliance.",
    "AI Governance",
    ["Ethics Lead", "AI Governance", "Compliance"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ],
  [
    "ict_mod_2026_016",
    "What is the primary objective of the Nigeria National Artificial Intelligence Strategy (NNAIS) led by FMCIDE?",
    ["Fostering responsible AI adoption, national capacity building, and economic growth through digital innovation.", "Banning all commercial software development across West Africa.", "Mandating that all public records be processed on analog typewriters.", "Restricting internet access exclusively to research institutions."],
    0,
    "The NNAIS aims to position Nigeria as a regional AI hub by accelerating talent development, ethical frameworks, and AI deployment across sectors.",
    "National AI Strategy",
    ["NNAIS", "FMCIDE", "AI Policy"],
    "ict_e_governance",
    "E-Governance & Digital Services"
  ],
  [
    "ict_mod_2026_017",
    "What term defines synthetic media generated using deep learning models to realistically mimic a person's voice, face, or actions?",
    ["Deepfake.", "Vector Mask.", "Raster Scan.", "Digital Certificate."],
    0,
    "Deepfakes use generative adversarial networks (GANs) or diffusion models to create convincing fake audio/video content.",
    "Emerging Cyber Threats",
    ["Deepfake", "Synthetic Media", "GAN"],
    "ict_security",
    "Digital Security & Cybersecurity"
  ],
  [
    "ict_mod_2026_018",
    "Which evaluation benchmark metric measures a machine translation system's accuracy against human reference translations?",
    ["BLEU (Bilingual Evaluation Understudy) score.", "CPU Clock Speed (GHz).", "Bandwidth Throughput (Mbps).", "Ping Latency (ms)."],
    0,
    "BLEU score evaluates the quality of machine-translated text by comparing n-gram matches against human translations.",
    "AI Evaluation",
    ["BLEU Score", "NLP", "Translation Benchmark"],
    "ict_fundamentals",
    "ICT Fundamentals & Concepts"
  ],
  [
    "ict_mod_2026_019",
    "What is the role of a Vector Database (e.g., Pinecone, Qdrant, Milvus) in modern Generative AI enterprise applications?",
    ["Storing and indexing high-dimensional vector embeddings for fast semantic similarity search.", "Executing legacy relational SQL table joins.", "Managing physical printer spool queues.", "Generating animated graphical slides."],
    0,
    "Vector databases index high-dimensional embeddings to perform fast nearest-neighbor searches essential for RAG.",
    "Vector Search",
    ["Vector DB", "Embeddings", "RAG"],
    "ict_fundamentals",
    "ICT Fundamentals & Concepts"
  ],
  [
    "ict_mod_2026_020",
    "Which concept refers to AI models trained on vast multimodal datasets (text, image, audio) that can be adapted to wide-ranging downstream tasks?",
    ["Foundation Models.", "Single-Purpose Calculators.", "Deterministic Decision Trees.", "Hardcoded Scripts."],
    0,
    "Foundation models (such as GPT-4, Gemini, Claude) are large base models pretrained on massive datasets that serve as foundation platforms.",
    "AI Architectures",
    ["Foundation Models", "Multimodal", "Pretraining"],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ]
];

// Add 30 more AI questions programmatically to hit 50
const extraAi = [
  ["ict_mod_2026_021", "What does 'Temperature' parameter adjust during LLM text generation?", ["Randomness and creativity of token selection.", "Physical server temperature in Celsius.", "Network latency in milliseconds.", "Database disk storage size."], 0, "Temperature controls the probability distribution of predicted tokens; lower values make output deterministic, higher values increase variety.", "LLM Parameters", ["Temperature", "Sampling", "LLM"]],
  ["ict_mod_2026_022", "What is Top-P (Nucleus) sampling in Large Language Generation?", ["Selecting tokens from the smallest set whose cumulative probability exceeds P.", "Sorting database rows by primary key.", "Paging network packets by protocol.", "Ranking hardware CPUs by core count."], 0, "Nucleus sampling cuts off token candidates dynamically once their cumulative probability threshold P is met.", "LLM Parameters", ["Top-P", "Nucleus Sampling", "LLM"]],
  ["ict_mod_2026_023", "What mechanism in modern generative AI tools prevents generating illegal, abusive, or harmful material?", ["Safety Alignment / Content Guardrails.", "Hardware Overclocking.", "Unencrypted FTP Transfer.", "Disk Partitioning."], 0, "Content Guardrails and Safety Alignments filter inputs and outputs against prohibited policy violations.", "AI Safety", ["Guardrails", "Content Safety", "AI Alignment"]],
  ["ict_mod_2026_024", "What is an AI Autonomous Agent capable of doing when integrated into enterprise workflows?", ["Executing multi-step reasoning, selecting tools, calling APIs, and completing goals autonomously.", "Running static backup tapes once a year.", "Printing paper memos automatically.", "Modifying screen resolution settings."], 0, "AI Agents use reasoning loops (like ReAct framework) to break down tasks, select tools, and interact with external systems to achieve goals.", "AI Agents", ["Autonomous Agent", "ReAct", "Tool Use"]],
  ["ict_mod_2026_025", "What is the primary benefit of synthetic data generation in public sector AI training?", ["Enabling model training while mitigating privacy risks associated with real personal data.", "Replacing actual civil servants with virtual avatars.", "Doubling physical server power consumption.", "Increasing manual data entry errors."], 0, "Synthetic data mimics real statistical properties without exposing sensitive personal identifiable information (PII).", "Privacy & Data", ["Synthetic Data", "Privacy", "Data Generation"]],
  ["ict_mod_2026_026", "What is Context Window length in a Large Language Model?", ["The maximum number of tokens the model can process in a single prompt and response cycle.", "The size of the physical display monitor.", "The bandwidth limit of the fiber optic cable.", "The time limit allowed for user login."], 0, "Context window specifies the token capacity (e.g. 128k or 1M tokens) that an LLM can hold in memory during processing.", "LLM Architecture", ["Context Window", "Tokens", "LLM"]],
  ["ict_mod_2026_027", "What tokenization method converts raw text into numerical sub-word units before feeding into transformer LLMs?", ["Byte-Pair Encoding (BPE).", "Hexadecimal Encoding.", "Morse Code Transposition.", "ASCII Line Printing."], 0, "Byte-Pair Encoding (BPE) breaks words down into frequent sub-word tokens, efficiently managing open vocabularies.", "NLP & Tokenization", ["BPE", "Tokenization", "NLP"]],
  ["ict_mod_2026_028", "Which open-source AI governance framework emphasizes AI accountability, data quality, and non-discrimination in public sector deployment?", ["OECD Principles on Artificial Intelligence.", "Legacy Dial-up Modem Protocol.", "Standard VGA Video Spec.", "Serial Port Interface."], 0, "OECD AI Principles set international standards for trustworthy AI, emphasizing fairness, transparency, and accountability.", "AI Standards", ["OECD Principles", "AI Ethics", "Governance"]],
  ["ict_mod_2026_029", "What risk arises from training AI models on historically skewed or unrepresentative administrative datasets?", ["Algorithmic Bias and discriminatory outputs.", "Physical hardware overheating.", "Loss of internet IP address.", "Instant database deletion."], 0, "Algorithmic bias occurs when training data reflects past human biases, leading the model to perpetuate unfair decisions.", "AI Ethics", ["Algorithmic Bias", "Fairness", "Data Quality"]],
  ["ict_mod_2026_030", "What is Computer Vision (CV) primarily utilized for in smart public infrastructure projects?", ["Analyzing and interpreting visual information from images and video feeds.", "Synthesizing natural-sounding voice calls.", "Compressing ZIP archives.", "Generating financial ledger reports."], 0, "Computer Vision models process digital images and video streams for tasks like traffic monitoring, automated inspection, and security.", "Computer Vision", ["Computer Vision", "Pattern Recognition", "CV"]],
  ["ict_mod_2026_031", "Which Natural Language Processing (NLP) task automatically categorizes citizen feedback submissions into predefined sentiment groups (Positive, Neutral, Negative)?", ["Sentiment Analysis.", "Optical Character Recognition.", "Ray Tracing.", "Data Deduplication."], 0, "Sentiment analysis classifies text tone and emotion to gauge public sentiment from survey or service feedback.", "NLP Applications", ["Sentiment Analysis", "NLP", "Text Analytics"]],
  ["ict_mod_2026_032", "What technology converts scanned paper public records into machine-readable, searchable digital text?", ["Optical Character Recognition (OCR).", "Digital Signal Processing (DSP).", "Raster Image Generator.", "Pulse Code Modulation."], 0, "OCR technology extracts textual characters from bitmap image scans, making physical document archives text-searchable.", "OCR & Archival", ["OCR", "Digitization", "Text Extraction"]],
  ["ict_mod_2026_033", "In LLM prompt design, what role is typically assigned to set the overarching rules, boundary guardrails, and persona for the conversation?", ["System Prompt / System Message.", "User Prompt.", "Assistant Response.", "Memory Buffer."], 0, "The System Prompt sets high-level instructions, operational boundaries, and behavioral expectations for the LLM.", "Prompt Design", ["System Prompt", "Guardrails", "Persona"]],
  ["ict_mod_2026_034", "What is the primary difference between Fine-Tuning an LLM and using Retrieval-Augmented Generation (RAG)?", ["Fine-tuning updates internal model weights, while RAG injects dynamic external knowledge into the prompt context.", "Fine-tuning deletes all model weights, while RAG creates new hardware chips.", "Fine-tuning is free, while RAG requires satellite dishes.", "Fine-tuning only works offline."], 0, "Fine-tuning modifies parameter weights to adapt style/task behavior, whereas RAG provides up-to-date domain knowledge without altering base weights.", "LLM Fine-Tuning vs RAG", ["Fine-Tuning", "RAG", "Model Customization"]],
  ["ict_mod_2026_035", "What is the function of a Reward Model in Reinforcement Learning from Human Feedback (RLHF)?", ["Scoring generated model responses based on alignment with human preferences.", "Calculating annual staff bonus payouts.", "Measuring server power voltage.", "Sorting files alphabetically."], 0, "The Reward Model assigns scalar scores to candidate model outputs to train the reinforcement policy towards desired human behavior.", "RLHF", ["Reward Model", "RLHF", "AI Alignment"]],
  ["ict_mod_2026_036", "Which emerging AI architecture combines multiple specialized expert networks governed by a gating model to route tokens efficiently?", ["Mixture of Experts (MoE).", "Single Dense Matrix.", "Unlayered Perceptron.", "Monolithic Binary Tree."], 0, "Mixture of Experts (MoE) routes inputs to specific specialized sub-networks ('experts'), drastically reducing compute per token while scaling capacity.", "MoE Architecture", ["MoE", "Mixture of Experts", "LLM Architecture"]],
  ["ict_mod_2026_037", "What is Multimodal AI capable of processing within a single unified framework?", ["Multiple data types simultaneously, such as text, images, audio, and video.", "Only plain ASCII text files.", "Only black-and-white printouts.", "Only numeric spreadsheets."], 0, "Multimodal models process and correlate heterogeneous data modalities like vision, text, speech, and structured data together.", "Multimodal AI", ["Multimodal", "Vision-Language", "Unified AI"]],
  ["ict_mod_2026_038", "What term describes the mathematical representation of words or documents as dense vectors in continuous vector space?", ["Embeddings.", "Sockets.", "Registers.", "Pointers."], 0, "Embeddings map semantic concepts into dense numerical vector spaces where geometric proximity reflects semantic similarity.", "Embeddings", ["Embeddings", "Vector Space", "NLP"]],
  ["ict_mod_2026_039", "In AI ethics governance, what does 'Human-in-the-Loop' (HITL) mandate for critical automated decisions?", ["Requiring human oversight and authorization before final automated decision execution.", "Eliminating human civil servants from all government departments.", "Allowing AI models to issue legal judgments without review.", "Running hardware tests on loop."], 0, "Human-in-the-Loop (HITL) requires human review and sign-off on automated recommendations, ensuring human responsibility and safety.", "AI Ethics", ["Human-in-the-Loop", "HITL", "Oversight"]],
  ["ict_mod_2026_040", "What framework provides standardized metrics to evaluate LLM performance on complex reasoning, coding, and policy knowledge?", ["Benchmarking Suites (e.g. MMLU, GSM8K, HumanEval).", "Local Network Ping Test.", "Printer Alignment Page.", "Hard Disk Benchmark."], 0, "Standardized benchmarking suites measure capabilities across multi-task knowledge (MMLU), math reasoning, and coding benchmarks.", "AI Evaluation", ["Benchmarking", "MMLU", "LLM Assessment"]],
  ["ict_mod_2026_041", "What does 'Catastrophic Forgetting' refer to in continual learning of neural networks?", ["A model unlearning previously acquired knowledge when trained on a new, distinct dataset.", "Deleting server backup drives.", "Forgetting administrative passwords.", "System power outage."], 0, "Catastrophic forgetting happens when sequential training on new data overwrites weights needed for previously learned tasks.", "ML Challenges", ["Catastrophic Forgetting", "Continual Learning", "Neural Nets"]],
  ["ict_mod_2026_042", "Which open-weights foundation model family released by Meta has driven open-source AI innovation globally?", ["Llama series.", "MS-DOS series.", "Windows 95.", "Lotus 1-2-3."], 0, "The Llama model family provides open-weights foundation models widely adopted for research and enterprise deployment.", "Open AI Models", ["Llama", "Open-Weights", "Meta"]],
  ["ict_mod_2026_043", "What is the function of a System Prompt in preventing prompt injection in enterprise AI assistants?", ["Delimiting user inputs and establishing strict non-overridable boundary instructions.", "Shutting down the server when a user logs in.", "Encrypting user passwords in plain text.", "Doubling network bandwidth."], 0, "System prompts use clear boundary markers and security rules to isolate user inputs from administrative control instructions.", "AI Security", ["System Prompt", "Prompt Injection", "Guardrails"]],
  ["ict_mod_2026_044", "What term describes AI systems designed to perform any intellectual task that a human being can perform?", ["Artificial General Intelligence (AGI).", "Narrow AI.", "Statistical Regression.", "Rule Engine."], 0, "Artificial General Intelligence (AGI) refers to hypothetical AI possessing human-level cognitive breadth across diverse domains.", "AI Concepts", ["AGI", "Artificial General Intelligence", "Vision"]],
  ["ict_mod_2026_045", "What is the role of Data Annotation in preparing datasets for supervised machine learning?", ["Tagging raw data with accurate labels or target classes.", "Deleting corrupt files from storage.", "Compressing images to ZIP format.", "Installing operating system patches."], 0, "Data annotation labels raw data (images, text, audio) to provide ground-truth training signals for supervised models.", "Data Engineering", ["Data Annotation", "Labeling", "Training Data"]],
  ["ict_mod_2026_046", "Which technique combines outputs from multiple individual machine learning models to produce superior predictive accuracy?", ["Ensemble Learning (e.g., Random Forests, Boosting).", "Single Decision Stumps.", "Linear Extrapolation.", "Manual Data Entry."], 0, "Ensemble methods aggregate predictions from multiple base models (bagging/boosting) to reduce variance and bias.", "Machine Learning", ["Ensemble Learning", "Random Forest", "Boosting"]],
  ["ict_mod_2026_047", "What is the primary function of Speech-to-Text (STT) models like OpenAI Whisper in public sector transcriptions?", ["Transcribing spoken audio recordings into accurate written text.", "Translating written text into paper printouts.", "Compressing MP3 audio files.", "Generating synthesized music."], 0, "Speech-to-Text (Automatic Speech Recognition) converts audio speech streams into written transcriptions for record-keeping.", "ASR & Speech", ["STT", "Speech Recognition", "Transcription"]],
  ["ict_mod_2026_048", "What is 'Hallucination Rate' used for in assessing Generative AI vendor solutions?", ["Measuring the percentage of generated outputs containing ungrounded or false statements.", "Counting physical server cooling fans.", "Tracking internet download speeds.", "Measuring user typing speed."], 0, "Hallucination rate measures how frequently a generative model outputs non-factual statements on standardized test benchmarks.", "AI Quality Metrics", ["Hallucination Rate", "AI Evaluation", "Factuality"]],
  ["ict_mod_2026_049", "What risk is associated with using public commercial cloud LLMs for sensitive, classified government documents without private tenant isolation?", ["Data leakage, unauthorized model retraining on sensitive data, and privacy violations.", "Instant physical server explosion.", "Duplicate file creation in local folders.", "Automatic printer paper jam."], 0, "Submitting classified data to public non-isolated API endpoints risks exposing sensitive data or having it ingested into shared model training pools.", "AI Risk & Privacy", ["Data Leakage", "Cloud Privacy", "Enterprise Security"]],
  ["ict_mod_2026_050", "Which Nigerian agency regulates digital technology standards, IT project clearances for MDAs, and cybersecurity frameworks under FMCIDE?", ["National Information Technology Development Agency (NITDA).", "Federal Road Safety Corps (FRSC).", "National Identity Management Commission (NIMC) alone.", "Nigerian Railway Corporation."], 0, "NITDA is statutorily mandated to regulate IT standards, clear government IT projects, and enforce digital policies across Nigeria.", "IT Governance", ["NITDA", "IT Regulations", "Digital Standards"]]
];

for (const item of extraAi) {
  rawData.push([
    item[0],
    item[1],
    item[2],
    item[3],
    item[4],
    item[5],
    item[6],
    "ict_literacy_innovation",
    "Digital Literacy & Innovation"
  ]);
}

// =========================================================================
// 2. Cloud Computing & Enterprise Architecture (Questions 51 to 100)
// =========================================================================
const cloudTopics = [
  ["ict_mod_2026_051", "Which Cloud Service Model provides virtualized computing infrastructure (servers, storage, networking) where the customer manages the OS and applications?", ["Infrastructure as a Service (IaaS).", "Platform as a Service (PaaS).", "Software as a Service (SaaS).", "Function as a Service (FaaS)."], 0, "IaaS delivers fundamental compute, storage, and networking resources on-demand, allowing users to configure OS and software stacks.", "Cloud Computing Models", ["IaaS", "Cloud Infrastructure", "Service Models"]],
  ["ict_mod_2026_052", "In which Cloud Service Model does the vendor manage the application, underlying infrastructure, runtime, and database, delivering software via web browser?", ["Software as a Service (SaaS).", "Infrastructure as a Service (IaaS).", "Bare Metal Dedicated Hosting.", "On-Premises Hardware."], 0, "SaaS applications (like Microsoft 365, Google Workspace) are fully managed by the provider and accessed over the web.", "Cloud Computing Models", ["SaaS", "Software as a Service", "Cloud Applications"]],
  ["ict_mod_2026_053", "What is Platform as a Service (PaaS) primarily designed for?", ["Providing developers with a managed framework to build, deploy, and scale applications without managing underlying OS/servers.", "Providing physical server racks for manual assembly.", "Managing office stationery supplies.", "Conducting physical security patrols."], 0, "PaaS supplies hardware, OS, runtime environment, and databases so developers can focus solely on application code.", "Cloud Computing Models", ["PaaS", "Application Platform", "Developer Framework"]],
  ["ict_mod_2026_054", "What cloud deployment concept mandates that government citizen data must be stored physically within national geographic boundaries?", ["Data Sovereignty / Data Residency.", "Global Load Balancing.", "Edge Caching.", "Public Cloud Mirroring."], 0, "Data Sovereignty mandates that data is subject to the privacy laws and governance of the country where it is physically located.", "Cloud Governance", ["Data Sovereignty", "Data Residency", "Cloud Security"]],
  ["ict_mod_2026_055", "What architecture breaks monolithic applications into small, independently deployable services communicating via lightweight APIs?", ["Microservices Architecture.", "Monolithic Single Binary.", "Mainframe Batch Processing.", "Physical File Sharing."], 0, "Microservices divide complex applications into decoupled services, enabling modular scaling, rapid deployment, and resilience.", "Enterprise Architecture", ["Microservices", "APIs", "Decoupled Architecture"]],
  ["ict_mod_2026_056", "What is the primary function of an API Gateway in modern enterprise e-Government architectures?", ["Routing requests, enforcing security policies, rate-limiting, and managing API endpoints centrally.", "Storing physical paper files in archives.", "Formatting display monitor brightness.", "Generating manual monthly invoices."], 0, "An API Gateway acts as a reverse proxy to route API requests, enforce authentication, rate-limiting, and traffic monitoring across microservices.", "API Architecture", ["API Gateway", "Microservices", "Routing"]],
  ["ict_mod_2026_057", "Which containerization technology packages an application and all its dependencies into an isolated container that runs consistently across any environment?", ["Docker.", "MS-DOS Batch.", "Zip Extractor.", "Virtual Memory Buffer."], 0, "Docker containers package software code with runtime libraries, ensuring uniform execution across dev, test, and production environments.", "Containerization", ["Docker", "Containers", "DevOps"]],
  ["ict_mod_2026_058", "What open-source container orchestration platform automates deployment, scaling, and management of containerized workloads?", ["Kubernetes (K8s).", "Apache HTTP Server.", "FTP Daemon.", "Local File Explorer."], 0, "Kubernetes (K8s) orchestrates container clusters, managing auto-scaling, self-healing, rolling updates, and service discovery.", "Container Orchestration", ["Kubernetes", "K8s", "Orchestration"]],
  ["ict_mod_2026_059", "What does Serverless Computing (FaaS - Function as a Service) allow developers to do?", ["Execute code in response to events without provisioning or managing infrastructure servers.", "Build physical computer hardware in cleanrooms.", "Eliminate the need for any software code.", "Run database queries using manual paper ledgers."], 0, "Serverless computing executes function code on demand in response to events, automatically scaling infrastructure and charging only for execution time.", "Serverless Computing", ["Serverless", "FaaS", "Event-Driven"]],
  ["ict_mod_2026_060", "What metric defines the maximum acceptable duration of data loss during a Disaster Recovery (DR) incident?", ["Recovery Point Objective (RPO).", "Recovery Time Objective (RTO).", "Service Level Agreement (SLA).", "Mean Time Between Failures (MTBF)."], 0, "Recovery Point Objective (RPO) measures the maximum acceptable age of files/data that must be restored from backup storage after a disaster.", "Disaster Recovery", ["RPO", "Disaster Recovery", "Data Loss"]],
  ["ict_mod_2026_061", "What metric defines the maximum acceptable duration of system downtime allowed during an emergency outage?", ["Recovery Time Objective (RTO).", "Recovery Point Objective (RPO).", "Bandwidth Cap.", "Storage Volume Index."], 0, "Recovery Time Objective (RTO) is the target timeframe within which business processes and IT infrastructure must be restored.", "Disaster Recovery", ["RTO", "Downtime", "System Recovery"]],
  ["ict_mod_2026_062", "What is a Service Level Agreement (SLA) in public sector cloud procurement?", ["A formal contract defining guaranteed service availability, performance metrics, and penalty remedies.", "A informal verbal agreement between technicians.", "A list of office equipment model numbers.", "A guide to staff annual leave schedules."], 0, "An SLA establishes legally binding operational commitments (such as 99.99% uptime) between cloud service providers and enterprise clients.", "Cloud Contracts", ["SLA", "Uptime Guarantee", "Procurement"]],
  ["ict_mod_2026_063", "What architectural pattern maintains redundant system components across multiple geographically separated Availability Zones to prevent downtime?", ["High Availability (HA) & Multi-Region Redundancy.", "Single Point of Failure (SPOF).", "Uncompressed Local Backups.", "Static File Hosting."], 0, "High Availability (HA) deploys redundant server nodes and load balancers across multiple data centers to ensure uninterrupted service.", "System Architecture", ["High Availability", "Redundancy", "Fault Tolerance"]],
  ["ict_mod_2026_064", "What type of API architecture uses HTTP verbs (GET, POST, PUT, DELETE) and standard JSON payloads for lightweight web service communication?", ["REST (Representational State Transfer).", "SOAP XML RPC.", "COBOL File Protocol.", "Local Serial Bus."], 0, "RESTful APIs leverage standard HTTP methods and lightweight formats (JSON/XML) for scalable web services.", "API Standards", ["REST API", "HTTP", "JSON"]],
  ["ict_mod_2026_065", "What query language for APIs, developed by Meta, allows client applications to request precisely the specific data fields needed?", ["GraphQL.", "SQL Server 2008.", "HTML5 Parser.", "XPath 1.0."], 0, "GraphQL enables clients to declare exact query requirements, eliminating over-fetching and under-fetching of payload data.", "API Technology", ["GraphQL", "API Query", "Data Fetching"]],
  ["ict_mod_2026_066", "What is the primary purpose of an Enterprise Content Management (ECM) system in FCSSIP25 civil service digitalization?", ["Managing, storing, preserving, and routing official electronic documents and automated workflows.", "Monitoring staff personal social media accounts.", "Replacing physical building security guards.", "Calculating international postage fees."], 0, "ECM systems automate electronic document lifecycle management, file tracking, permissions, and workflow approvals across MDAs.", "ECM & Digitalization", ["ECM", "FCSSIP25", "Document Management"]],
  ["ict_mod_2026_067", "What model describes combining private cloud infrastructure with public cloud services to balance security and elastic scaling?", ["Hybrid Cloud.", "Isolated Island Cloud.", "Legacy Mainframe System.", "Static Storage Array."], 0, "Hybrid Cloud integrates private data centers with public cloud infrastructure to retain sensitive workloads locally while utilizing cloud burst capacity.", "Cloud Deployment", ["Hybrid Cloud", "Private Cloud", "Public Cloud"]],
  ["ict_mod_2026_068", "What cloud concept allows computing resources to scale up or down automatically in response to fluctuating user demand?", ["Elasticity / Auto-Scaling.", "Fixed Provisioning.", "Manual Tape Rotation.", "Static Allocation."], 0, "Cloud elasticity dynamically adjusts provisioning (adding or removing instances) to match traffic load demands without human intervention.", "Cloud Elasticity", ["Auto-Scaling", "Elasticity", "Capacity"]],
  ["ict_mod_2026_069", "What methodology manages infrastructure setup and configuration using version-controlled code scripts rather than manual server steps?", ["Infrastructure as Code (IaC) (e.g., Terraform, Ansible).", "Manual Command Line Entry.", "Paper Circuit Diagrams.", "Physical Hardware Jumper Switches."], 0, "Infrastructure as Code (IaC) automates environment provisioning through declarative code, ensuring repeatable and auditable deployments.", "DevOps & IaC", ["IaC", "Terraform", "Ansible"]],
  ["ict_mod_2026_070", "Which e-Government framework standardizes data exchange protocols across Federal MDAs to enable system communication?", ["Nigeria e-Government Interoperability Framework (NeGIF).", "Federal Character Recruitment Guide.", "Public Service Rules 2021 Chapter 1.", "National Postal Code System."], 0, "NeGIF provides standards and technical specifications for seamless data exchange and service integration across public sector systems.", "NeGIF", ["NeGIF", "Interoperability", "Digital Standards"]],
  ["ict_mod_2026_071", "What does a Load Balancer do in a high-traffic e-Government web service application?", ["Distributes incoming network traffic evenly across multiple backend application servers.", "Increases the price of internet subscriptions.", "Deletes duplicate user passwords.", "Protects physical cables from damage."], 0, "Load balancers distribute user traffic across server pools to optimize resource utilization, maximize throughput, and prevent server overload.", "Load Balancing", ["Load Balancer", "Traffic Distribution", "Performance"]],
  ["ict_mod_2026_072", "Which network protocol automatically assigns dynamic IP addresses to devices connecting to an MDA local network?", ["DHCP (Dynamic Host Configuration Protocol).", "DNS (Domain Name System).", "SMTP (Simple Mail Transfer Protocol).", "HTTP (Hypertext Transfer Protocol)."], 0, "DHCP automatically assigns IP addresses, subnet masks, and default gateways to client devices joining a network.", "Network Protocols", ["DHCP", "IP Allocation", "Networking"]],
  ["ict_mod_2026_073", "What system acts as the 'phonebook' of the internet, translating domain names (e.g., gov.ng) into numerical IP addresses?", ["DNS (Domain Name System).", "DHCP Server.", "FTP Gateway.", "SSH Daemon."], 0, "DNS translates human-readable domain names into IP addresses required by networking hardware to locate web services.", "DNS", ["DNS", "Domain Resolution", "Networking"]],
  ["ict_mod_2026_074", "What type of storage connects directly to a local network, providing file-based data access to heterogeneous network clients?", ["NAS (Network-Attached Storage).", "SAN (Storage Area Network).", "USB Flash Drive.", "Floppy Diskette."], 0, "NAS provides dedicated file storage accessible to authorized network users over standard Ethernet connections.", "Storage Systems", ["NAS", "Network Storage", "File Shares"]],
  ["ict_mod_2026_075", "What high-speed, dedicated network connects servers to block-level consolidation storage devices in enterprise data centers?", ["SAN (Storage Area Network).", "LAN (Local Area Network).", "PAN (Personal Area Network).", "WAN (Wide Area Network)."], 0, "SAN provides high-performance, block-level storage networking to servers, separate from standard local area traffic.", "Storage Networks", ["SAN", "Block Storage", "Data Center"]],
  ["ict_mod_2026_076", "What DevOps pipeline process automates testing and merging code updates continuously into a central repository?", ["Continuous Integration (CI).", "Manual File Copying.", "Static Archive Storage.", "Batch Tape Loading."], 0, "Continuous Integration (CI) automatically builds and tests code changes whenever developers push updates to a repository.", "DevOps", ["CI/CD", "Continuous Integration", "Automation"]],
  ["ict_mod_2026_077", "What DevOps pipeline process automatically deploys validated code updates into staging or production server environments?", ["Continuous Deployment / Continuous Delivery (CD).", "Manual USB Key Installation.", "Physical Server Unplugging.", "Paper Documentation Filing."], 0, "Continuous Delivery/Deployment (CD) automates the release of software builds to production environments safely.", "DevOps", ["CD", "Continuous Deployment", "DevOps Pipeline"]],
  ["ict_mod_2026_078", "What architectural principles guide Cloud-Native application development?", ["Microservices, containerization, DevOps pipelines, and dynamic cloud auto-scaling.", "Building monolithic binaries stored on CD-ROMs.", "Using analog telephone modems for data transfer.", "Restricting applications to single physical desktops."], 0, "Cloud-Native applications are designed specifically to exploit cloud elasticity, containerization, microservices, and continuous delivery.", "Cloud Architecture", ["Cloud-Native", "Microservices", "Containers"]],
  ["ict_mod_2026_079", "What is the function of a Webhook in modern web application integrations?", ["Sending automated real-time HTTP callbacks when a specific event occurs in a system.", "Displaying pop-up banner advertisements.", "Format printing margins on PDF pages.", "Cleaning physical keyboard keys."], 0, "Webhooks deliver real-time HTTP POST notifications from a source system to target APIs immediately when events happen.", "Web Integration", ["Webhook", "HTTP Callback", "Real-Time Event"]],
  ["ict_mod_2026_080", "What open standard protocol allows secure delegated authorization for third-party applications without sharing user passwords?", ["OAuth 2.0.", "Telnet.", "FTP plain text.", "HTTP 1.0."], 0, "OAuth 2.0 provides token-based authorization, allowing users to grant third-party access to resources without revealing credentials.", "Authentication & AuthZ", ["OAuth 2.0", "Authorization", "Security Tokens"]],
  ["ict_mod_2026_081", "What identity layer built on top of OAuth 2.0 enables Single Sign-On (SSO) authentication across government web portals?", ["OpenID Connect (OIDC).", "Kerberos 4.", "RADIUS legacy.", "TACACS+."], 0, "OpenID Connect (OIDC) extends OAuth 2.0 with ID tokens, providing standardized user authentication for SSO federations.", "Identity Management", ["OIDC", "OpenID Connect", "SSO"]],
  ["ict_mod_2026_082", "What is the primary role of a Reverse Proxy (such as Nginx or HAProxy) positioned in front of MDA web servers?", ["Handling SSL termination, caching, load balancing, and hiding backend server infrastructure.", "Editing database SQL records directly.", "Executing physical tape backups.", "Drafting staff promotion circulars."], 0, "Reverse proxies intercept client requests, manage security offloading (SSL/TLS), perform caching, and shield origin application servers.", "Web Infrastructure", ["Reverse Proxy", "Nginx", "SSL Termination"]],
  ["ict_mod_2026_083", "What technology creates a secure, encrypted virtual tunnel over a public network to allow remote civil servants to access MDA internal networks safely?", ["Virtual Private Network (VPN).", "Public Wi-Fi Hotspot.", "Unencrypted Telnet.", "Dial-up Connection."], 0, "A VPN encrypts internet traffic between a remote user device and enterprise network gateways, securing remote access.", "Network Security", ["VPN", "Encryption", "Remote Access"]],
  ["ict_mod_2026_084", "What type of data storage repository stores vast amounts of raw data in its native format (structured, semi-structured, unstructured) until needed?", ["Data Lake.", "Relational Database Table.", "Flat Text File.", "Spreadsheet Worksheet."], 0, "Data Lakes hold raw enterprise data in its original format, supporting big data analytics and machine learning processing.", "Data Storage", ["Data Lake", "Big Data", "Raw Data"]],
  ["ict_mod_2026_085", "What hybrid data management architecture combines the flexibility of a Data Lake with the structure and ACID transactions of a Data Warehouse?", ["Data Lakehouse.", "Floppy Disk Array.", "Tape Vault.", "Serial Cache."], 0, "Data Lakehouses integrate Data Lake scalable storage with Data Warehouse transactional integrity and schema management.", "Data Architecture", ["Data Lakehouse", "Data Warehouse", "Analytics"]],
  ["ict_mod_2026_086", "What strategy ensures that an enterprise application can survive the total failure of a primary cloud data center?", ["Multi-Region Disaster Recovery & Geo-Replication.", "Single Server Hosting.", "Weekly Manual File Printing.", "Disabling Data Backups."], 0, "Geo-replication continuously synchronizes data across geographically distant regions, enabling instant failover during catastrophic outages.", "Disaster Recovery", ["Geo-Replication", "Failover", "Resilience"]],
  ["ict_mod_2026_087", "What is the function of a Content Delivery Network (CDN) in public portal administration?", ["Caching static content at geographically distributed edge locations to reduce latency and server load.", "Generating database backup files.", "Printing official memos.", "Formatting hardware drives."], 0, "CDNs cache static assets (images, CSS, JS) on global edge servers close to users, dramatically speeding up page load times.", "Web Performance", ["CDN", "Edge Caching", "Latency"]],
  ["ict_mod_2026_088", "What caching engine (such as Redis or Memcached) stores data in RAM for ultra-fast sub-millisecond retrieval?", ["In-Memory Data Store.", "Magnetic Tape Storage.", "Optical CD Drive.", "Hard Disk Drive."], 0, "In-memory stores keep frequently accessed data in RAM, providing ultra-low latency reads compared to disk-based databases.", "Caching", ["In-Memory", "Redis", "Caching"]],
  ["ict_mod_2026_089", "What is the main advantage of adopting Open Source Software (OSS) in public sector IT procurement?", ["Cost savings on licensing, vendor lock-in avoidance, and code transparency for security auditing.", "Zero need for technical maintenance.", "Guaranteed hardware lifetime warranty.", "Automatic tax exemption for contractors."], 0, "Open Source Software eliminates expensive proprietary license fees, prevents vendor lock-in, and permits full auditability of source code.", "IT Procurement", ["Open Source", "OSS", "Vendor Lock-in"]],
  ["ict_mod_2026_090", "What term describes the risk of becoming dependent on a single cloud vendor's proprietary tools, making migration prohibitively costly?", ["Vendor Lock-In.", "System Interoperability.", "Open Standard Adoption.", "Data Migration Ease."], 0, "Vendor Lock-In occurs when proprietary APIs and formats make transferring applications or data to another cloud provider difficult.", "Cloud Risk", ["Vendor Lock-In", "Cloud Strategy", "Procurement"]],
  ["ict_mod_2026_091", "What framework provides guidelines for aligning IT investments and technology services with business goals across public sector organizations?", ["COBIT (Control Objectives for Information and Related Technologies).", "Public Service Rules Chapter 4.", "Standard Road Traffic Guide.", "Building Code 2010."], 0, "COBIT is a globally recognized IT governance and management framework aligning IT goals with enterprise business goals.", "IT Governance", ["COBIT", "IT Governance", "Strategy"]],
  ["ict_mod_2026_092", "What IT service management framework outlines best practices for delivery, incident handling, change management, and service desk operations?", ["ITIL (Information Technology Infrastructure Library).", "ISO 9001 Quality Alone.", "Standard Accounting Manual.", "Civil Service Salary Scale."], 0, "ITIL provides a comprehensive framework for managing IT service delivery, incident response, change management, and support services.", "ITSM", ["ITIL", "ITSM", "Service Management"]],
  ["ict_mod_2026_093", "What is the purpose of a Change Advisory Board (CAB) in enterprise IT service management?", ["Reviewing, evaluating, and approving proposed infrastructure and software changes to minimize operational risk.", "Hiring new junior IT helpdesk staff.", "Purchasing office furniture.", "Setting monthly internet tariffs."], 0, "The Change Advisory Board (CAB) assesses technical changes for risks, dependencies, and business impact before production release.", "IT Governance", ["CAB", "Change Management", "ITIL"]],
  ["ict_mod_2026_094", "What process tests system recovery procedures regularly to ensure backups are valid and operational during actual emergencies?", ["Disaster Recovery Testing & Tabletop Drills.", "Formatting secondary hard drives.", "Deleting system log files.", "Replacing monitor power cords."], 0, "DR testing validates backup integrity and recovery runbooks, proving that systems can meet target RTO and RPO benchmarks.", "Disaster Recovery", ["DR Testing", "Recovery", "Resilience"]],
  ["ict_mod_2026_095", "What is the function of a Headless CMS in modern digital content management?", ["Decoupling content management backends from frontend presentation layers via APIs.", "Eliminating the need for database storage.", "Restricting content publishing to print media.", "Disabling user login portals."], 0, "Headless CMS manages content in a central repository and delivers it via APIs to any frontend display device (web, mobile, kiosk).", "Content Management", ["Headless CMS", "API Content", "Decoupled Architecture"]],
  ["ict_mod_2026_096", "What is the purpose of an Audit Log in enterprise database systems?", ["Recording a chronological record of all database access, queries, modifications, and administrative actions.", "Accelerating SQL query processing speed.", "Compressing database backups.", "Displaying user avatars."], 0, "Audit logs track user activities, system transactions, and security events to support forensic investigations and compliance audits.", "Database Security", ["Audit Log", "Database Security", "Compliance"]],
  ["ict_mod_2026_097", "What data format is widely used for structured web API payload exchanges due to its lightweight human-readable text structure?", ["JSON (JavaScript Object Notation).", "Raw Binary Stream.", "EBCDIC Code.", "PostScript Print File."], 0, "JSON is the standard format for web API data exchanges due to its lightweight syntax and native parsing support across languages.", "Data Standards", ["JSON", "API Payload", "Data Interchange"]],
  ["ict_mod_2026_098", "What data serialization format uses indentation and key-value pairs, commonly used for writing DevOps configuration files (e.g. Kubernetes, Ansible)?", ["YAML (YAML Ain't Markup Language).", "Binary Executable.", "Rich Text Format (RTF).", "Bitmap Image."], 0, "YAML is human-friendly data serialization format used extensively for cloud configuration files, pipelines, and deployment manifests.", "DevOps Standards", ["YAML", "Configuration", "DevOps"]],
  ["ict_mod_2026_099", "What is the primary role of a Chief Information Officer (CIO) in a Federal Ministry?", ["Directing strategic IT vision, technology investments, digital transformation, and cybersecurity oversight.", "Repairing physical office computer power supplies.", "Ordering office paper stationery.", "Managing staff physical transport buses."], 0, "The CIO leads organizational digital strategy, aligns technology investments with public policy, and oversees IT governance.", "IT Leadership", ["CIO", "IT Leadership", "Digital Strategy"]],
  ["ict_mod_2026_100", "What strategy mitigates the risk of single cloud data center outages by distributing workloads across multiple independent cloud providers?", ["Multi-Cloud Strategy.", "Single Tenant Hosting.", "Legacy Mainframe Isolation.", "Local Desktop Storage."], 0, "Multi-cloud strategies utilize services from two or more cloud providers to prevent vendor lock-in and enhance disaster recovery resilience.", "Cloud Strategy", ["Multi-Cloud", "Redundancy", "Cloud Strategy"]]
];

for (const item of cloudTopics) {
  rawData.push([
    item[0],
    item[1],
    item[2],
    item[3],
    item[4],
    item[5],
    item[6],
    "ict_fundamentals",
    "ICT Fundamentals & Concepts"
  ]);
}

// =========================================================================
// 3. Modern Cybersecurity & Data Protection (Questions 101 to 150)
// =========================================================================
const secTopics = [
  ["ict_mod_2026_101", "What core security paradigm operates on the principle 'Never Trust, Always Verify', requiring strict verification for every access request?", ["Zero Trust Architecture (ZTA).", "Perimeter Security Model.", "Open Network Model.", "Implicit Trust System."], 0, "Zero Trust Architecture assumes no implicit trust based on network location, requiring continuous authentication, authorization, and validation.", "Cybersecurity Frameworks", ["Zero Trust", "ZTA", "Never Trust Always Verify"]],
  ["ict_mod_2026_102", "Under the Nigeria Data Protection Act (NDPA 2023), what independent body regulates data privacy compliance and enforces data protection rights?", ["Nigeria Data Protection Commission (NDPC).", "Federal Character Commission.", "Code of Conduct Bureau.", "National Population Commission."], 0, "The NDPC was statutorily established by the NDPA 2023 as the independent regulator for data protection and privacy in Nigeria.", "Data Protection Law", ["NDPA 2023", "NDPC", "Data Privacy"]],
  ["ict_mod_2026_103", "What primary requirement does the NDPA 2023 mandate for Data Controllers processing sensitive personal data of Nigerian citizens?", ["Designating a Data Protection Officer (DPO) and registering with the NDPC.", "Publishing citizen data on public notice boards.", "Transferring all data overseas without encryption.", "Storing passwords in plain text format."], 0, "Data controllers must appoint a qualified DPO, implement technical safeguard measures, and register with the NDPC.", "Data Protection Compliance", ["NDPA", "DPO", "Compliance"]],
  ["ict_mod_2026_104", "What type of cyberattack encrypts an organization's files and demands payment in exchange for the decryption key?", ["Ransomware Attack.", "Phishing Email.", "SQL Injection.", "Man-in-the-Middle Attack."], 0, "Ransomware malware encrypts sensitive data and system access, holding it hostage for extortion ransom demands.", "Cyber Attacks", ["Ransomware", "Malware", "Cyber Risk"]],
  ["ict_mod_2026_105", "What deceptive social engineering technique uses spoofed emails or messages to trick individuals into revealing sensitive credentials?", ["Phishing.", "Port Scanning.", "Packet Sniffing.", "Buffer Overflow."], 0, "Phishing tricks users into disclosing passwords or credit card numbers by masquerading as trustworthy communications.", "Social Engineering", ["Phishing", "Social Engineering", "Cybersecurity"]],
  ["ict_mod_2026_106", "What security mechanism requires users to provide two or more distinct verification factors before granting access to enterprise systems?", ["Multi-Factor Authentication (MFA).", "Single Password Access.", "IP Address Whitelisting Alone.", "User Account Disabling."], 0, "MFA combines something you know (password), something you have (authenticator app/token), or something you are (biometrics) to secure accounts.", "Authentication", ["MFA", "Multi-Factor", "Identity Security"]],
  ["ict_mod_2026_107", "What encryption standard uses a single secret key shared between parties for both encryption and decryption?", ["Symmetric Encryption (e.g., AES-256).", "Asymmetric Encryption.", "Public Key Infrastructure.", "Digital Signature Verification."], 0, "Symmetric encryption utilizes one identical secret key for both data encoding and decoding, delivering high processing speed.", "Cryptography", ["Symmetric Encryption", "AES-256", "Cryptography"]],
  ["ict_mod_2026_108", "What encryption system uses a key pair consisting of a mathematically linked Public Key and Private Key?", ["Asymmetric Encryption (Public Key Cryptography, RSA/ECC).", "Symmetric Stream Cipher.", "Rotational Substitution.", "Plaintext Masking."], 0, "Asymmetric encryption uses a public key to encrypt data and a private key to decrypt it, underpinning digital signatures and TLS.", "Cryptography", ["Asymmetric Encryption", "Public Key", "RSA"]],
  ["ict_mod_2026_109", "What cryptographic protocol secures HTTP web traffic by encrypting communications between a user browser and a web server?", ["TLS 1.3 (Transport Layer Security / HTTPS).", "FTP.", "Telnet.", "SNMP."], 0, "TLS 1.3 encrypts HTTP web traffic (HTTPS), establishing confidentiality, integrity, and server authentication.", "Web Security", ["TLS", "HTTPS", "Encryption"]],
  ["ict_mod_2026_110", "Which NIST Incident Response Lifecycle phase focuses on stopping an ongoing cyber attack from spreading further across the network?", ["Containment.", "Preparation.", "Eradication.", "Lessons Learned."], 0, "The Containment phase isolates affected systems to limit attack damage before eradication and recovery steps occur.", "Incident Response", ["NIST IR", "Containment", "Cyber Incident"]],
  ["ict_mod_2026_111", "What type of attack floods a web application or server with massive bogus traffic to exhaust resources and cause denial of service?", ["Distributed Denial of Service (DDoS).", "Cross-Site Scripting.", "Directory Traversal.", "Session Hijacking."], 0, "DDoS attacks utilize botnets to overwhelm target bandwidth or server resources, making online services unavailable to legitimate users.", "Cyber Attacks", ["DDoS", "Denial of Service", "Network Security"]],
  ["ict_mod_2026_112", "What attack vector inserts malicious SQL statements into web entry fields to manipulate or extract underlying database tables?", ["SQL Injection (SQLi).", "Cross-Site Request Forgery.", "DNS Spoofing.", "ARP Poisoning."], 0, "SQL Injection exploits unvalidated inputs to execute arbitrary SQL commands, endangering database confidentiality and integrity.", "Web Vulnerabilities", ["SQLi", "SQL Injection", "Database Security"]],
  ["ict_mod_2026_113", "What web vulnerability allows attackers to inject malicious scripts into trusted websites, which execute in victim browsers?", ["Cross-Site Scripting (XSS).", "Command Line Injection.", "Man-in-the-Middle Attack.", "Phishing."], 0, "XSS enables attackers to execute scripts in a victim's browser context, stealing session cookies or redirecting users.", "Web Vulnerabilities", ["XSS", "Cross-Site Scripting", "Web Security"]],
  ["ict_mod_2026_114", "What security control restricts user permissions strictly to the minimum access rights necessary to perform their assigned job duties?", ["Principle of Least Privilege (PoLP).", "Administrative Overreach.", "Global Admin Rights.", "Unlimited Data Sharing."], 0, "Least Privilege ensures accounts only possess permissions necessary for legitimate administrative functions, limiting blast radius.", "Access Control", ["Least Privilege", "PoLP", "Access Control"]],
  ["ict_mod_2026_115", "What identity management framework assigns system permissions based on organizational roles (e.g., Director, Auditor, Clerk)?", ["Role-Based Access Control (RBAC).", "Attribute-Based Encryption.", "Discretionary Override.", "Static File Permissions."], 0, "RBAC assigns permissions to defined job roles rather than individual users, simplifying enterprise security administration.", "Access Control", ["RBAC", "Role-Based Access", "IAM"]],
  ["ict_mod_2026_116", "What security solution monitors and inspects incoming and outgoing network traffic based on predefined security rules?", ["Firewall.", "Router Switch.", "Network Repeater.", "VGA Splitter."], 0, "Firewalls analyze network traffic packets against rule policies, blocking unauthorized access between network zones.", "Network Security", ["Firewall", "Traffic Filter", "Network Security"]],
  ["ict_mod_2026_117", "What system actively analyzes network traffic patterns to detect and block malicious intrusion attempts in real time?", ["Intrusion Prevention System (IPS).", "Domain Name Server.", "File Archiver.", "Display Card."], 0, "An IPS monitors network traffic for signature matches or anomalies and actively drops malicious packets to prevent breach execution.", "Network Defense", ["IPS", "Intrusion Prevention", "Network Security"]],
  ["ict_mod_2026_118", "What security tool gathers, correlates, and analyzes security log events from across enterprise IT systems to detect threats?", ["SIEM (Security Information and Event Management).", "DBMS.", "ERP System.", "CAD Software."], 0, "SIEM platforms collect and correlate log data from firewalls, servers, and applications to provide real-time security alerts.", "Security Operations", ["SIEM", "Log Correlation", "SOC"]],
  ["ict_mod_2026_119", "What dedicated operational unit monitors, detects, analyzes, and responds to cybersecurity incidents in real time?", ["Security Operations Center (SOC).", "Helpdesk Desk.", "Procurement Unit.", "Registry Office."], 0, "A SOC consists of cybersecurity analysts and tools continuously monitoring organizational security posture.", "Security Operations", ["SOC", "Security Center", "Monitoring"]],
  ["ict_mod_2026_120", "What term describes a newly discovered software vulnerability for which no security patch or fix has yet been released by the vendor?", ["Zero-Day Vulnerability.", "Legacy Bug.", "Known Vulnerability.", "Depreciated Code."], 0, "Zero-Day vulnerabilities are flaws exposed before vendors can issue patches, presenting severe cyber exploitation risks.", "Cyber Threat Intelligence", ["Zero-Day", "Vulnerability", "Exploit"]],
  ["ict_mod_2026_121", "What cybersecurity practice systematically identifies, evaluates, and remediates security weaknesses in software and infrastructure?", ["Vulnerability Management.", "Data Deletion.", "Hardware Recycling.", "Budget Auditing."], 0, "Vulnerability management scans systems, rates vulnerability severity (CVSS), and applies security patches regularly.", "Security Practice", ["Vulnerability Management", "Patching", "CVSS"]],
  ["ict_mod_2026_122", "What quantitative scoring system provides a standardized rating (0.0 to 10.0) for the severity of cybersecurity vulnerabilities?", ["CVSS (Common Vulnerability Scoring System).", "ISO 9001 Index.", "GPS Coordinate Scale.", "HTTP Status Code."], 0, "CVSS rates vulnerability severity based on exploitability, impact, and attack complexity, helping prioritize patch deployment.", "Vulnerability Assessment", ["CVSS", "Severity Rating", "Vulnerability"]],
  ["ict_mod_2026_123", "What authorized simulated cyber attack evaluates the security resilience of an MDA network or application?", ["Penetration Testing (Pen Test).", "Denial of Service Attack.", "Malware Infection.", "Ransomware Extortion."], 0, "Penetration testing employs ethical hackers to discover exploitable vulnerabilities before actual threat actors exploit them.", "Ethical Hacking", ["Penetration Testing", "Pen Test", "Ethical Hacking"]],
  ["ict_mod_2026_124", "What type of attack intercepts and alters communications between two unsuspecting parties without their knowledge?", ["Man-in-the-Middle (MitM) Attack.", "Brute Force Attack.", "Buffer Overflow.", "Password Spraying."], 0, "MitM attacks intercept unencrypted or compromised communications to eavesdrop or manipulate data payload in transit.", "Network Attacks", ["MitM", "Eavesdropping", "Network Security"]],
  ["ict_mod_2026_125", "What cybersecurity strategy maintains multiple layers of security controls throughout an IT system to protect against single-point breaches?", ["Defense-in-Depth.", "Perimeter Isolation.", "Single Lock System.", "Unencrypted Backup."], 0, "Defense-in-Depth implements redundant security measures across network, endpoint, application, and data layers.", "Security Strategy", ["Defense-in-Depth", "Layered Security", "Security Architecture"]],
  ["ict_mod_2026_126", "What form of malware disguises itself as legitimate, useful software to trick users into installing it?", ["Trojan Horse.", "Worm.", "Spyware.", "Adware."], 0, "A Trojan horse hides malicious code inside an ostensibly innocent application to gain unauthorized system access.", "Malware Types", ["Trojan", "Malware", "Cyber Security"]],
  ["ict_mod_2026_127", "What self-replicating malware spreads across networks independently without requiring human interaction or host file attachment?", ["Worm.", "Trojan Horse.", "Phishing Email.", "Macro Virus."], 0, "Computer worms exploit network vulnerabilities to self-replicate and spread autonomously from machine to machine.", "Malware Types", ["Worm", "Self-Replicating", "Malware"]],
  ["ict_mod_2026_128", "What security measure transforms readable plaintext into unintelligible ciphertext to protect data confidentiality at rest and in transit?", ["Encryption.", "Compression.", "Hashing.", "Defragmentation."], 0, "Encryption uses cryptographic keys to obfuscate data, ensuring that unauthorized parties cannot read the contents.", "Cryptography", ["Encryption", "Ciphertext", "Data Protection"]],
  ["ict_mod_2026_129", "What one-way cryptographic function transforms arbitrary data into a fixed-length string that cannot be reversed?", ["Cryptographic Hash Function (e.g., SHA-256).", "Symmetric Encryption.", "Asymmetric Encryption.", "Base64 Encoding."], 0, "Hash functions produce deterministic, non-reversible digests used for password storage and data integrity verification.", "Cryptography", ["Hashing", "SHA-256", "Integrity"]],
  ["ict_mod_2026_130", "What random string added to passwords before hashing prevents rainbow table lookup attacks?", ["Salt.", "Pepper.", "Nonce.", "IV."], 0, "Salting appends unique random data to each password prior to hashing, ensuring identical passwords yield different hashes.", "Password Security", ["Salt", "Hashing", "Password Security"]],
  ["ict_mod_2026_131", "What cybersecurity attack systematically tries every possible password combination until the correct one is found?", ["Brute-Force Attack.", "Phishing.", "Social Engineering.", "Zero-Day Exploit."], 0, "Brute-force attacks use automated software to systematically test all potential character combinations to crack passwords.", "Password Attacks", ["Brute Force", "Password Cracking", "Security"]],
  ["ict_mod_2026_132", "What attack tests a small list of commonly used passwords across a large number of usernames to avoid account lockout thresholds?", ["Password Spraying.", "Brute Force.", "Rainbow Table.", "Keylogging."], 0, "Password spraying tests a single weak password against many accounts to evade lockout policies triggered by rapid failures.", "Password Attacks", ["Password Spraying", "Identity Risk", "Credential Attack"]],
  ["ict_mod_2026_133", "What hardware or software tool secretly logs every keystroke typed by a user on a computer?", ["Keylogger.", "Rootkit.", "Firewall.", "Antivirus."], 0, "Keyloggers record keyboard input to capture credentials, financial details, and confidential messages silently.", "Spyware", ["Keylogger", "Credential Theft", "Spyware"]],
  ["ict_mod_2026_134", "What type of stealthy malware gains privileged root access to an operating system while hiding its presence from antivirus scanners?", ["Rootkit.", "Adware.", "Ransomware.", "Spam."], 0, "Rootkits modify core operating system binaries to conceal unauthorized access and malware activities from security software.", "Malware Types", ["Rootkit", "Stealth Malware", "OS Security"]],
  ["ict_mod_2026_135", "What technology allows security teams to create dummy target systems ('traps') to lure, detect, and analyze hacker techniques?", ["Honeypot.", "Firewall.", "Proxy Server.", "VPN."], 0, "A honeypot is a decoy system designed to attract cyber attackers, allowing analysts to observe tactics without operational risk.", "Cyber Threat Intelligence", ["Honeypot", "Decoy", "Threat Research"]],
  ["ict_mod_2026_136", "What standard security practice isolates untrusted software execution inside a restricted environment to prevent system compromise?", ["Sandboxing.", "Defragmenting.", "Overclocking.", "Broadcasting."], 0, "Sandboxing runs suspicious files or code in an isolated container to observe behavior safely before allowing execution.", "System Security", ["Sandboxing", "Isolation", "Malware Analysis"]],
  ["ict_mod_2026_137", "What digital document binds a public key to an individual or organization identity, issued by a trusted Certificate Authority (CA)?", ["Digital Certificate (X.509).", "User Manual.", "Purchase Order.", "License Agreement."], 0, "Digital certificates verify the ownership of a public key, securing web connections (HTTPS) and digital signatures.", "PKI", ["Digital Certificate", "X.509", "Public Key Infrastructure"]],
  ["ict_mod_2026_138", "What trusted third-party entity issues, signs, revokes, and manages X.509 digital certificates in a Public Key Infrastructure (PKI)?", ["Certificate Authority (CA).", "Domain Name Server.", "Internet Service Provider.", "Software Vendor."], 0, "A Certificate Authority (CA) verifies applicant identity before issuing digitally signed public key certificates.", "PKI", ["Certificate Authority", "CA", "PKI"]],
  ["ict_mod_2026_139", "What list published by a Certificate Authority details digital certificates that have been revoked prior to expiration?", ["Certificate Revocation List (CRL).", "Access Control List.", "Blacklist of IPs.", "DNS Lookup Sheet."], 0, "A CRL lists revoked certificates (e.g. due to private key compromise), allowing systems to reject invalid connections.", "PKI", ["CRL", "Certificate Revocation", "PKI"]],
  ["ict_mod_2026_140", "What real-time protocol allows client applications to query a CA server directly regarding the revocation status of a specific digital certificate?", ["OCSP (Online Certificate Status Protocol).", "DNS.", "DHCP.", "SNMP."], 0, "OCSP provides instantaneous online verification of certificate validity without requiring full CRL downloads.", "PKI", ["OCSP", "Certificate Status", "PKI"]],
  ["ict_mod_2026_141", "What cybersecurity term describes employee behavior that unintentionally breaches security policies, such as using weak passwords?", ["Insider Threat (Unintentional/Human Error).", "External Attack.", "Hardware Failure.", "Vendor Default."], 0, "Unintentional insider threats stem from human error, negligence, or lack of security awareness among legitimate employees.", "Security Awareness", ["Insider Threat", "Human Error", "Security Culture"]],
  ["ict_mod_2026_142", "What security policy ensures that sensitive printed documents and removable storage media are locked away when workstations are unattended?", ["Clean Desk & Clear Screen Policy.", "Open Door Policy.", "Paper Conservation Policy.", "Flexible Work Policy."], 0, "Clean Desk and Clear Screen policies prevent unauthorized viewing or theft of confidential physical documents and active screens.", "Physical Security", ["Clean Desk", "Clear Screen", "Policy"]],
  ["ict_mod_2026_143", "What method validates that a transmitted message was not altered in transit and originated from the claimed sender?", ["Digital Signature.", "Data Compression.", "File Renaming.", "Screen Snapshot."], 0, "Digital signatures provide non-repudiation, message integrity, and sender authentication using asymmetric cryptography.", "Cryptography", ["Digital Signature", "Non-Repudiation", "Integrity"]],
  ["ict_mod_2026_144", "What principle ensures that an individual cannot deny having sent a message or performed an administrative transaction?", ["Non-Repudiation.", "Confidentiality.", "Availability.", "Scalability."], 0, "Non-repudiation provides indisputable proof of origin and integrity, preventing authors from denying their digital actions.", "Information Security", ["Non-Repudiation", "Integrity", "Security Governance"]],
  ["ict_mod_2026_145", "What three core pillars form the fundamental foundation of Information Security governance (the CIA Triad)?", ["Confidentiality, Integrity, and Availability.", "Cost, Innovation, and Speed.", "Computers, Internet, and Automation.", "Control, Inspection, and Auditing."], 0, "The CIA triad (Confidentiality, Integrity, Availability) represents the core security goals for protecting information assets.", "Information Security", ["CIA Triad", "Confidentiality", "Integrity", "Availability"]],
  ["ict_mod_2026_146", "What compliance standard specifies requirements for establishing, implementing, and maintaining an Information Security Management System (ISMS)?", ["ISO/IEC 27001.", "ISO 9001 Quality.", "ISO 14001 Environment.", "ISO 31000 Risk."], 0, "ISO/IEC 27001 is the international benchmark specification for information security management systems.", "Security Standards", ["ISO 27001", "ISMS", "Security Compliance"]],
  ["ict_mod_2026_147", "What endpoint security software continuously monitors computer workstations for malicious behavior, detecting and isolating advanced threats?", ["EDR (Endpoint Detection and Response).", "Basic Antivirus Scanner.", "Disk Defragmenter.", "Backup Utility."], 0, "EDR solutions provide continuous endpoint monitoring, threat hunting, behavioral analysis, and automated response capabilities.", "Endpoint Security", ["EDR", "Endpoint Security", "Threat Detection"]],
  ["ict_mod_2026_148", "What security practice involves actively searching through networks and endpoints to detect hidden malicious threats that evaded automated security tools?", ["Threat Hunting.", "Vulnerability Scanning.", "Patching.", "Data Backups."], 0, "Threat Hunting is a proactive, analyst-led search for hidden indicators of compromise (IOCs) within an enterprise network.", "Security Operations", ["Threat Hunting", "IOCs", "SOC"]],
  ["ict_mod_2026_149", "What risk management document records identified cybersecurity risks, their severity, likelihood, mitigation actions, and risk owners?", ["Risk Register.", "Asset Inventory.", "Project Charter.", "Purchase Order."], 0, "A Risk Register tracks organizational risk exposures, treatment strategies, residual risk levels, and assigned management oversight.", "Risk Management", ["Risk Register", "Cyber Risk", "Governance"]],
  ["ict_mod_2026_150", "What cybersecurity term defines the remaining risk level after security controls and safeguards have been implemented?", ["Residual Risk.", "Inherent Risk.", "Total Risk.", "Zero Risk."], 0, "Residual Risk is the risk remaining after applying control measures to reduce inherent risk." , "Risk Management", ["Residual Risk", "Inherent Risk", "Risk Governance"]]
];

for (const item of secTopics) {
  rawData.push([
    item[0],
    item[1],
    item[2],
    item[3],
    item[4],
    item[5],
    item[6],
    "ict_security",
    "Digital Security & Cybersecurity"
  ]);
}

// =========================================================================
// 4. Digital Identity, Emerging Tech & Smart Governance (Questions 151 to 200)
// =========================================================================
const dtTopics = [
  ["ict_mod_2026_151", "What statutory agency manages the National Identity Database and issues the 11-digit National Identification Number (NIN) in Nigeria?", ["National Identity Management Commission (NIMC).", "Nigeria Immigration Service.", "Federal Character Commission.", "National Population Commission."], 0, "NIMC is statutorily empowered to operate the National Identity Management System and issue NINs to all citizens and legal residents.", "Digital Identity", ["NIMC", "NIN", "Digital Identity"]],
  ["ict_mod_2026_152", "What technology enables tamper-proof, decentralized digital ledgers using cryptographic hashing and consensus mechanisms?", ["Blockchain / Distributed Ledger Technology (DLT).", "Centralized SQL Database.", "Flat CSV Spreadsheet.", "Local Memory Buffer."], 0, "Blockchain utilizes cryptographically linked blocks and distributed consensus to provide immutable, transparent record-keeping.", "Emerging Technology", ["Blockchain", "DLT", "Smart Contracts"]],
  ["ict_mod_2026_153", "What policy document was launched by the Federal Government to guide blockchain adoption across trade, banking, and public sector governance?", ["National Blockchain Policy for Nigeria.", "National Crypto Tariff Order.", "Digital Paper Policy.", "Foreign Exchange Control Act."], 0, "The National Blockchain Policy provides a framework for integrating blockchain technology into public administration, identity, and commerce.", "Digital Policy", ["Blockchain Policy", "DLT", "Nigeria Governance"]],
  ["ict_mod_2026_154", "What self-executing digital contracts on a blockchain automatically execute terms when predefined condition rules are met?", ["Smart Contracts.", "Paper Affidavits.", "Power of Attorney.", "Manual Circulars."], 0, "Smart contracts are immutable code programs on a blockchain that execute transactions automatically without intermediaries.", "Blockchain", ["Smart Contracts", "DLT", "Automation"]],
  ["ict_mod_2026_155", "What digital credential framework allows citizens to store and present cryptographically verifiable identity claims (e.g. driver licenses, degrees) on mobile devices?", ["Verifiable Credentials (VCs) / W3C Standard.", "Scanned JPG Images.", "Plain Text Email.", "Paper Certificate Copies."], 0, "Verifiable Credentials (W3C standard) enable tamper-evident digital identity attestations verified using public key cryptography.", "Digital Identity", ["Verifiable Credentials", "W3C", "Digital Identity"]],
  ["ict_mod_2026_156", "What concept describes processing data near the source of generation (e.g. IoT sensors) to reduce latency and bandwidth usage?", ["Edge Computing.", "Centralized Cloud Storage.", "Batch Mainframe Tape.", "Offline Manual Entry."], 0, "Edge computing processes data locally at the edge of the network near sensors or devices, minimizing data transfer delays.", "Edge Computing", ["Edge Computing", "IoT", "Latency"]],
  ["ict_mod_2026_157", "What interconnected network of physical devices equipped with sensors, software, and connectivity collects and exchanges environment data?", ["Internet of Things (IoT).", "Local File Sharing.", "Standalone Workstation.", "Dial-up Connection."], 0, "IoT connects physical assets (dams, traffic lights, smart meters) to digital networks for monitoring and smart automation.", "IoT & Smart Cities", ["IoT", "Internet of Things", "Smart Sensors"]],
  ["ict_mod_2026_158", "What system combines spatial geographic location data with demographic attribute data for urban planning, mapping, and security oversight?", ["Geographic Information System (GIS).", "Global Positioning System alone.", "Spreadsheet Graph.", "CAD Layout."], 0, "GIS captures, analyzes, and displays geographically referenced data to support spatial planning, land use, and emergency management.", "Geospatial Tech", ["GIS", "Spatial Mapping", "Urban Planning"]],
  ["ict_mod_2026_159", "What satellite-based radionavigation system provides precise global positioning, velocity, and time information to receiver devices?", ["GPS (Global Positioning System).", "Cellular Tower Alone.", "Fiber Optic Line.", "VHF Radio."], 0, "GPS uses a constellation of satellites to calculate exact 3D location coordinates and time signals globally.", "Geospatial Tech", ["GPS", "Positioning", "Navigation"]],
  ["ict_mod_2026_160", "What open government data principle mandates making non-sensitive public sector datasets available online in machine-readable formats for public reuse?", ["Open Data Initiative.", "Classified Secret Filing.", "Data Monopolization.", "Proprietary Data Lock."], 0, "Open Data releases public governance data openly in formats like CSV or JSON, fostering transparency, research, and economic innovation.", "Open Government", ["Open Data", "Transparency", "Machine-Readable"]],
  ["ict_mod_2026_161", "What term describes the massive volume, velocity, and variety of structured and unstructured data generated by digital activities?", ["Big Data.", "Small File.", "Local Spreadsheet.", "Static Document."], 0, "Big Data refers to datasets characterized by High Volume, High Velocity, and High Variety (the 3 Vs) requiring specialized processing.", "Big Data", ["Big Data", "3 Vs", "Analytics"]],
  ["ict_mod_2026_162", "What business intelligence process extracts actionable trends, patterns, and insights from historical data to guide strategic decisions?", ["Data Analytics / Data Mining.", "Data Deletion.", "Disk Formatting.", "Manual Copying."], 0, "Data Analytics applies statistical algorithms and visualization tools to transform raw operational data into strategic insights.", "Data Analytics", ["Data Analytics", "Data Mining", "Business Intelligence"]],
  ["ict_mod_2026_163", "What form of analytics uses historical data and machine learning algorithms to forecast future outcomes or policy trends?", ["Predictive Analytics.", "Descriptive Analytics.", "Diagnostic Analytics.", "Retrospective Reporting."], 0, "Predictive analytics models historical relationships to estimate the probability of future events or trends.", "Analytics Types", ["Predictive Analytics", "Forecasting", "ML"]],
  ["ict_mod_2026_164", "What type of analytics recommends optimal course-of-action decisions to achieve desired strategic targets under specific constraints?", ["Prescriptive Analytics.", "Descriptive Analytics.", "Basic Summarization.", "Manual Review."], 0, "Prescriptive analytics evaluates multiple decision scenarios and constraints to suggest the best actionable choice.", "Analytics Types", ["Prescriptive Analytics", "Decision Support", "Analytics"]],
  ["ict_mod_2026_165", "What emerging computing technology leverages quantum mechanics principles (superposition and entanglement) to solve complex problems exponentially faster?", ["Quantum Computing.", "Classical Transistor Logic.", "Analog Relay Board.", "Mechanical Difference Engine."], 0, "Quantum computing utilizes qubits to perform parallel calculations unattainable by classical supercomputers.", "Quantum Computing", ["Quantum Computing", "Qubits", "Emerging Tech"]],
  ["ict_mod_2026_166", "What cryptographic field develops encryption algorithms resistant to cracking by future quantum computers?", ["Post-Quantum Cryptography (PQC).", "DES 56-bit.", "Rot13 Cipher.", "MD5 Hashing."], 0, "Post-Quantum Cryptography (PQC) designs mathematical algorithms that remain secure against attacks by powerful quantum computers.", "Post-Quantum", ["PQC", "Post-Quantum Cryptography", "Quantum Security"]],
  ["ict_mod_2026_167", "What basic unit of quantum information can exist in a state of 0, 1, or a superposition of both simultaneously?", ["Qubit (Quantum Bit).", "Binary Bit.", "Byte.", "Nibble."], 0, "Unlike classical bits (0 or 1), qubits exploit quantum superposition to process complex multi-state calculations simultaneously.", "Quantum Computing", ["Qubit", "Superposition", "Quantum"]],
  ["ict_mod_2026_168", "What environmentally sustainable IT practice minimizes energy consumption, electronic waste, and carbon footprints across technology operations?", ["Green IT / Sustainable Computing.", "Hardware Overclocking.", "Continuous Data Printing.", "Unrestricted Server Powering."], 0, "Green IT practices optimize energy efficiency, extend hardware lifecycles, and enforce responsible e-waste recycling.", "Green IT", ["Green IT", "Sustainability", "E-Waste"]],
  ["ict_mod_2026_169", "What regulatory sandbox approach allows fintech and digital innovators to test novel solutions under temporary regulatory waivers?", ["Regulatory Sandbox.", "Strict Commercial Prohibition.", "Unlimited Operating License.", "Unregulated Black Market."], 0, "Regulatory Sandboxes provide controlled live testing environments with regulatory oversight to nurture innovative technology solutions.", "Digital Innovation", ["Regulatory Sandbox", "Fintech", "Innovation"]],
  ["ict_mod_2026_170", "What digital strategy connects citizen services, urban transit, energy grids, and environmental monitoring into integrated municipal platforms?", ["Smart City Framework.", "Legacy Rural Village Board.", "Unconnected Municipal Departments.", "Paper Transit Ticketing."], 0, "Smart City frameworks use IoT, AI, and GIS data to optimize municipal infrastructure, public safety, transit, and sustainability.", "Smart Cities", ["Smart City", "Urban Tech", "IoT"]],
  ["ict_mod_2026_171", "What e-Government portal initiative consolidates multiple federal MDA services into a single online window for citizen access?", ["Single Window Digital Portal (e.g. Nigeria.gov.ng).", "Decentralized Paper Offices.", "Separate Physical Counters.", "Unlinked Web Pages."], 0, "Single Window portals integrate diverse government services into one unified user-friendly portal for citizens and businesses.", "E-Governance", ["Single Window", "e-Services", "Nigeria.gov.ng"]],
  ["ict_mod_2026_172", "What digital inclusion policy ensures public websites and digital applications are accessible to persons with disabilities (PWDs)?", ["Digital Accessibility (e.g., WCAG 2.1 standards).", "Exclusive Video Display.", "Audio-Only Content.", "High Cost Subscriptions."], 0, "Web Content Accessibility Guidelines (WCAG) ensure digital services support screen readers and accessible design for all citizens.", "Digital Accessibility", ["WCAG", "Accessibility", "Inclusion"]],
  ["ict_mod_2026_173", "What technology uses high-altitude satellites in Low Earth Orbit (LEO, e.g. Starlink) to deliver high-speed broadband to remote rural areas?", ["LEO Satellite Broadband.", "Submarine Fiber Cable Alone.", "Dial-up Copper Lines.", "Microwave Towers Alone."], 0, "Low Earth Orbit (LEO) satellite constellations provide low-latency broadband internet to remote areas lacking terrestrial infrastructure.", "Connectivity", ["LEO Satellites", "Broadband", "Rural Connectivity"]],
  ["ict_mod_2026_174", "What public finance technology manages international trade declarations, customs duties, and cargo clearance documentation electronically?", ["Automated Customs System (e.g., BPP/Customs e-Portal).", "Manual Logbook Registry.", "Handwritten Shipping Manifests.", "Physical Cash Payment Desks."], 0, "Automated customs portals streamline trade documentation, risk management, duty assessment, and border clearance.", "Trade Tech", ["e-Customs", "Trade Facilitation", "Automation"]],
  ["ict_mod_2026_175", "What digital system tracks civil service personnel records, postings, career histories, and establishment details centrally across MDAs?", ["Integrated Personnel and Payroll Information System (IPPIS) / HRMIS.", "Manual Paper File Cabinets.", "Decentralized Notebooks.", "Unlinked Index Cards."], 0, "IPPIS/HRMIS centralizes personnel management, career records, and payroll processing across Federal Civil Service MDAs.", "Public Sector Tech", ["IPPIS", "HRMIS", "Civil Service Tech"]],
  ["ict_mod_2026_176", "What digital tax solution allows corporate taxpayers to register, file annual returns, pay duties, and generate Tax Clearance Certificates online?", ["TaxPro-Max (FIRS Digital Tax Portal).", "Manual Paper Filing.", "Cash Payment at Local Markets.", "Handwritten Receipts."], 0, "TaxPro-Max digitizes federal tax administration, automating tax computations, e-filing, and instant receipt generation.", "GovTech Solutions", ["TaxPro-Max", "FIRS", "Digital Tax"]],
  ["ict_mod_2026_177", "What e-Procurement module managed by the BPP digitizes federal vendor registration, tendering, bidding, and contract publishing?", ["Nigeria Public Procurement Portal (e-Procurement).", "Paper Tender Boxes.", "Verbal Contract Awards.", "Private Secret Auctions."], 0, "The e-Procurement portal enforces transparency by digitizing tendering, bid opening, evaluation, and public award publishing.", "GovTech Solutions", ["e-Procurement", "BPP", "Tendering"]],
  ["ict_mod_2026_178", "What technology uses radio waves to automatically identify and track tags attached to physical assets or inventory items?", ["RFID (Radio-Frequency Identification).", "Barcode Scanning Alone.", "Manual Serial Typing.", "Visual Inspection."], 0, "RFID tags emit radio signals to track physical equipment, files, or vehicles automatically without line-of-sight scanning.", "Asset Tracking", ["RFID", "Asset Tracking", "Sensors"]],
  ["ict_mod_2026_179", "What optical code format stores data in black-and-white square grids, easily scanned by mobile device cameras to access web portals?", ["QR Code (Quick Response Code).", "Linear Barcode.", "Magnetic Stripe.", "Perforated Card."], 0, "QR codes store two-dimensional data scanable by smartphones, facilitating instant verification and digital portal redirection.", "Mobile Tech", ["QR Code", "Mobile Verification", "Scanners"]],
  ["ict_mod_2026_180", "What framework structures IT projects into short iterative development sprints (typically 2-4 weeks) with continuous user feedback?", ["Agile Project Methodology (Scrum/Kanban).", "Waterfall Linear Plan.", "Rigid 5-Year Plan.", "Unplanned Execution."], 0, "Agile methodology delivers software in incremental iterations, enabling rapid adaptation to evolving user needs and feedback.", "Agile Development", ["Agile", "Scrum", "GovTech"]],
  ["ict_mod_2026_181", "In Agile Scrum methodology, what daily short stand-up meeting allows team members to align on progress and identify blockers?", ["Daily Standup / Daily Scrum.", "Monthly Board Meeting.", "Annual General Review.", "Weekly Audit Panel."], 0, "Daily standups are brief 15-minute sync meetings where team members answer what they completed, plan next steps, and flag impediments.", "Agile Practices", ["Daily Standup", "Scrum", "Agile"]],
  ["ict_mod_2026_182", "What role in an Agile GovTech project team represents stakeholder requirements and prioritizes the application feature backlog?", ["Product Owner (PO).", "Scrum Master.", "Database Admin.", "Hardware Technician."], 0, "The Product Owner defines product vision, manages the feature backlog, and ensures development aligns with business requirements.", "Agile Roles", ["Product Owner", "Agile", "GovTech"]],
  ["ict_mod_2026_183", "What role in an Agile Scrum team acts as a servant leader, facilitating team ceremonies and removing operational blockers?", ["Scrum Master.", "Project Sponsor.", "General Manager.", "Chief Accountant."], 0, "The Scrum Master coaches the team on Agile practices, removes external impediments, and facilitates Scrum events.", "Agile Roles", ["Scrum Master", "Agile", "Facilitator"]],
  ["ict_mod_2026_184", "What software development approach unifies software development (Dev) and IT operations (Ops) to shorten deployment lifecycles?", ["DevOps.", "Waterfall Isolation.", "Siloed Administration.", "Outsourced Maintenance."], 0, "DevOps integrates development, testing, and operations teams using automated CI/CD pipelines to deliver updates continuously.", "DevOps Culture", ["DevOps", "CI/CD", "Automation"]],
  ["ict_mod_2026_185", "What security practice integrates security automated testing directly into the DevOps CI/CD pipeline from inception?", ["DevSecOps.", "Post-Deployment Audit.", "Manual Security Patching.", "Perimeter Firewall."], 0, "DevSecOps embeds security checks, static code analysis (SAST), and dependency scanning directly into continuous delivery pipelines.", "DevSecOps", ["DevSecOps", "Security Pipeline", "DevOps"]],
  ["ict_mod_2026_186", "What software testing technique analyzes application source code for security vulnerabilities without executing the program?", ["Static Application Security Testing (SAST).", "Dynamic Application Security Testing (DAST).", "Penetration Testing.", "User Acceptance Testing."], 0, "SAST inspects uncompiled source code to discover security flaws, hardcoded credentials, and coding bugs early in development.", "Application Security", ["SAST", "Static Analysis", "Code Audit"]],
  ["ict_mod_2026_187", "What software testing technique evaluates a running application from the outside to discover runtime security vulnerabilities?", ["Dynamic Application Security Testing (DAST).", "Static Analysis.", "Unit Testing.", "Code Formatting."], 0, "DAST tests operating applications in real time, simulating external attacks to discover configuration flaws and runtime bugs.", "Application Security", ["DAST", "Dynamic Testing", "AppSec"]],
  ["ict_mod_2026_188", "What digital divide challenge refers to the disparity in internet access and digital literacy skills between urban and rural populations?", ["Digital Divide.", "Bandwidth Surplus.", "Software Saturation.", "Hardware Redundancy."], 0, "The Digital Divide encompasses inequalities in physical infrastructure access, affordability, and technical skills across demographics.", "Digital Policy", ["Digital Divide", "Inclusion", "Broadband"]],
  ["ict_mod_2026_189", "What national policy target establishes high-speed broadband internet coverage across all 36 States and the FCT?", ["National Broadband Plan (NBP).", "Postal Tariff Policy.", "Local Printing Plan.", "Analog Radio Guide."], 0, "The National Broadband Plan sets targets for broadband penetration, fiber infrastructure deployment, and affordable internet tariffs.", "Broadband Policy", ["National Broadband Plan", "NBP", "Telecom Policy"]],
  ["ict_mod_2026_190", "What technology uses un-manned aerial vehicles (drones) equipped with sensors for aerial mapping, agriculture, and security surveillance?", ["Drone / UAV Technology.", "Commercial Airliner.", "Ground Vehicle.", "Submarine Cable."], 0, "Unmanned Aerial Vehicles (UAVs) provide low-cost aerial imagery, precision agricultural surveying, and perimeter monitoring.", "Emerging Tech", ["Drones", "UAV", "Aerial Surveying"]],
  ["ict_mod_2026_191", "What concept describes immersive virtual 3D shared spaces combining virtual reality (VR) and augmented reality (AR)?", ["Metaverse.", "Mainframe Display.", "Text Terminal.", "Static Page."], 0, "The Metaverse refers to interconnected virtual 3D environments accessed through AR/VR technologies for collaboration and simulation.", "Emerging Tech", ["Metaverse", "VR", "AR"]],
  ["ict_mod_2026_192", "What technology overlays digital information, 3D graphics, or instruction text onto a user's real-world physical view?", ["Augmented Reality (AR).", "Virtual Reality (VR) alone.", "Screen Saver.", "Printed Poster."], 0, "Augmented Reality (AR) superimposes computer-generated imagery onto real-world physical environments in real time.", "AR & VR", ["Augmented Reality", "AR", "Emerging Tech"]],
  ["ict_mod_2026_193", "What technology creates a fully simulated digital environment that completely isolates the user from the physical world?", ["Virtual Reality (VR).", "Augmented Reality (AR).", "Desktop Display.", "Paper Print."], 0, "Virtual Reality (VR) immerses users inside a simulated 3D environment using specialized headsets.", "AR & VR", ["Virtual Reality", "VR", "Simulation"]],
  ["ict_mod_2026_194", "What term describes a virtual digital replica of a physical asset, process, or system used for real-time monitoring and simulation?", ["Digital Twin.", "System Image.", "Backup Copy.", "Hard Copy."], 0, "A Digital Twin is a real-time digital representation of a physical object (like a power plant or dam) updated via IoT sensor data.", "Emerging Tech", ["Digital Twin", "IoT", "Simulation"]],
  ["ict_mod_2026_195", "What open standard framework defines how web browsers communicate directly via audio, video, and data without requiring plugins?", ["WebRTC (Web Real-Time Communication).", "Flash Player.", "Silverlight.", "Java Applet."], 0, "WebRTC enables real-time peer-to-peer audio, video, and data streaming directly inside modern web browsers.", "Web Standards", ["WebRTC", "Video Streaming", "Web Standards"]],
  ["ict_mod_2026_196", "What software engineering practice uses machine learning models to assist developers by auto-completing code and suggesting fixes?", ["AI-Assisted Coding (e.g., GitHub Copilot, Gemini Code Assist).", "Manual Typing.", "Paper Proofreading.", "Static Punch Card Printing."], 0, "AI-assisted coding tools leverage LLMs trained on source code to suggest inline code completion, refactoring, and automated unit tests.", "Developer Tools", ["AI Coding", "Copilot", "Code Assistance"]],
  ["ict_mod_2026_197", "What term describes software applications created without writing traditional code, using visual drag-and-drop workflow interfaces?", ["Low-Code / No-Code Platforms.", "Assembly Language.", "Machine Code.", "Hardcoded Scripting."], 0, "Low-Code/No-Code platforms allow non-technical business analysts to construct web workflows and forms visually.", "Software Development", ["Low-Code", "No-Code", "Visual Development"]],
  ["ict_mod_2026_198", "What framework provides standardized metrics for measuring an organization's environmental impact, governance ethics, and social inclusion?", ["ESG (Environmental, Social, and Governance) Framework.", "GDP Growth Alone.", "Annual Revenue Ledger.", "Tax Return Sheet."], 0, "ESG frameworks evaluate sustainability, social responsibility, and ethical corporate governance practices.", "Governance", ["ESG", "Sustainability", "Ethics"]],
  ["ict_mod_2026_199", "What technology connects satellite networks, 5G cellular infrastructure, and fiber optics into unified national communications networks?", ["Heterogeneous Network Integration (HetNet).", "Single Copper Wire.", "Unlinked Radio Station.", "Dial-up Switchboard."], 0, "HetNet combines diverse wireless technologies (5G, Wi-Fi, satellite) to provide continuous high-speed connectivity everywhere.", "Telecom Networks", ["HetNet", "5G", "Telecom"]],
  ["ict_mod_2026_200", "What core principle guides digital transformation in the Federal Public Service under FCSSIP25?", ["Citizen-Centric, Data-Driven, Secure, and Efficient Digital Service Delivery.", "Manual Bureaucratic Delays.", "Paper-Based Record Duplication.", "Exclusive Closed Access."], 0, "Digital transformation prioritizes user-friendly, data-driven, secure, and transparent service delivery for all Nigerian citizens.", "Digital Governance", ["FCSSIP25", "Digital Transformation", "Citizen-Centric"]]
];

for (const item of dtTopics) {
  rawData.push([
    item[0],
    item[1],
    item[2],
    item[3],
    item[4],
    item[5],
    item[6],
    "ict_e_governance",
    "E-Governance & Digital Services"
  ]);
}

console.log(`Processing ${rawData.length} items...`);

const allQuestions = [];
for (const item of rawData) {
  allQuestions.push({
    id: item[0],
    question: item[1],
    options: item[2],
    correct: item[3],
    explanation: item[4],
    difficulty: "medium",
    chapter: item[5],
    keywords: item[6],
    sourceDocument: "National ICT & Digital Governance Framework 2026",
    sourceSection: item[5],
    year: 2026,
    lastReviewed: "2026-08-19",
    glBands: ["GL14_15", "GL15_16", "GL16_17"],
    marks: 1,
    questionType: "single_best_answer",
    reviewStatus: "approved",
    tags: ["ict_management", "modern_tech", "ai", "cloud", "cybersecurity"],
    sourceTopicId: "ict_management",
    sourceSubcategoryId: item[7],
    sourceSubcategoryName: item[8]
  });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2) + "\n", "utf8");
console.log(`SUCCESS! Generated ${allQuestions.length} questions and saved to ${OUTPUT_FILE}`);
