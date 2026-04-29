---
title: Attention Visualizer
emoji: 🧠
colorFrom: purple
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# Transformer Attention Visualizer

An interactive visualization tool for exploring how transformer-based language models (like BERT) understand sentences internally using **self-attention heatmaps**.

![Tech Stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20HuggingFace%20%7C%20React%20%7C%20Plotly-6366f1?style=flat-square)


## Features

- **Multi-model support** — BERT Base, DistilBERT, GPT-2
- **Per-layer, per-head** attention heatmaps
- **Average all heads** mode
- **Click-to-pin tokens** — see what each token attends to
- **Dark glassmorphism UI** with smooth animations
- LRU model cache — loads once, reuses across requests

## Quick Start

```bash
# One-shot launcher (installs deps + starts both servers)
chmod +x start.sh && ./start.sh
```

Then open **http://localhost:5173**

API docs available at **http://localhost:8000/docs**

## Manual Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Architecture

```
frontend (React + Plotly)  →  /api/attend (FastAPI)  →  HuggingFace + PyTorch
     port 5173                   port 8000
```

## Models

| Model | Layers | Heads | Type | Size |
|-------|--------|-------|------|------|
| bert-base-uncased | 12 | 12 | Encoder | 440MB |
| distilbert-base-uncased | 6 | 12 | Encoder | 265MB |
| gpt2 | 12 | 12 | Decoder | 548MB |

Models are downloaded automatically from HuggingFace on first use and cached locally.

## API

```
GET  /api/models   → list of available models
POST /api/attend   → { text, model_id } → { tokens, attentions, n_layers, n_heads }
GET  /api/health   → { status: "ok" }
```


This project provides a full-stack implementation using:

- FastAPI backend
- Hugging Face Transformers
- PyTorch inference
- React frontend
- Plotly attention visualization

It allows users to inspect attention behavior across **tokens, heads, and layers** to understand how contextual meaning is built inside transformer architectures.

---

# Project Goal

This tool helps users answer one key question:

> How does a transformer model understand language internally?

By visualizing attention matrices, we can observe:

- token relationships
- grammatical structure learning
- semantic reasoning
- sentence-level representation formation

in real time.

---

# Example Visualization

Example sentence:

```
The cat sat on the mat and watched the dog.
```

Tokenized form:

```
[CLS] the cat sat on the mat and watched the dog . [SEP]
```

Each heatmap cell represents:

```
How much one token attends to another token
```

Rows:

```
Query token (who is looking)
```

Columns:

```
Key token (who is being looked at)
```

Color intensity represents attention strength.

---

# Transformer Attention Mechanism

Self-attention is computed as:

```
Attention(Q,K,V) = softmax(QK^T / sqrt(d_k)) V
```

Meaning:

1. Each token generates a query vector
2. Each token generates a key vector
3. Queries compare against keys
4. Similarity scores become attention weights
5. Output representation is updated

The heatmap visualizes these normalized attention weights.

---

# Understanding the Heatmap

## Color Interpretation

| Color | Meaning |
|------|---------|
Dark | Low attention |
Purple | Medium attention |
Yellow | Strong attention |

Example:

```
watched -> dog
```

Represents a strong verb-object relationship.

Example:

```
the -> cat
```

Represents article-noun binding.

---

# Role of Special Tokens

## [CLS]

Represents entire sentence summary.

Used for:

- classification
- semantic similarity
- retrieval embeddings
- sentiment detection

If many tokens attend to `[CLS]`, the model is building a global sentence representation.

## [SEP]

Represents sentence boundary.

Often used for:

- segmentation
- sentence compression
- sequence framing

Late transformer layers frequently route information into `[SEP]`.

---

# Layer-wise Attention Behavior

Transformer layers progressively refine meaning.

| Layer Range | Model Behavior |
|------------|----------------|
Layer 1-2 | Token identity stabilization |
Layer 3-6 | Grammar learning |
Layer 7-10 | Phrase relationships |
Layer 11-12 | Sentence-level semantics |

---

# Early Layer Example (Layer 1)

Observed pattern:

```
cat -> cat
sat -> sat
mat -> mat
```

Meaning:

Tokens attend mostly to themselves.

Interpretation:

Early layers confirm token identity before contextual reasoning begins.

Example screenshot:

```
Insert Layer 1 Heatmap Screenshot Here
```

---

# Boundary Detection Heads

Observed pattern:

```
tokens -> [CLS]
tokens -> [SEP]
```

Interpretation:

Model identifies sentence start and end anchors.

These heads help construct positional awareness.

Example screenshot:

```
Insert Layer 1 Head 2 Screenshot Here
```

---

# Middle Layer Example (Layer 5)

Observed pattern:

```
on -> sat
the -> mat
watched -> dog
```

Interpretation:

Model captures grammatical relationships:

- preposition to verb
- article to noun
- verb to object

These are syntactic reasoning heads.

Example screenshot:

```
Insert Layer 5 Screenshot Here
```

---

# Late Layer Example (Layer 11)

Observed pattern:

```
all tokens -> [SEP]
```

Interpretation:

Model compresses sentence meaning into a global representation token.

This stage prepares embeddings for:

- classification
- semantic similarity
- retrieval pipelines

Example screenshot:

```
Insert Layer 11 Screenshot Here
```

---

# Multi-Head Attention Behavior

Each transformer layer contains multiple heads.

Each head learns a different linguistic feature.

Typical head specializations:

| Head Type | Role |
|----------|------|
Positional | token order |
Syntactic | grammar links |
Semantic | meaning similarity |
Boundary | CLS / SEP anchors |
Long-range | clause connections |

Switching heads reveals different reasoning strategies.

---

# Example Attention Insights From This Tool

Sentence:

```
The cat sat on the mat and watched the dog
```

Model internally builds:

Layer 1:

```
token identity
```
![Layer 1 Head 1 Attention](docs/images/layer01_Head_01.png)

Layer 2:

```
article -> noun
```
![Layer 2 Head 2 Attention](docs/images/layer02_Head_02.png)

Layer 5:

```
subject -> verb
```
![Layer 5 Head 5 Attention](docs/images/layer05_Head_06.png)

Layer 8:

```
clause linking via "and"
```
![Layer 8 Head 8 Attention](docs/images/layer05_Head11.png)

Layer 11:

```
sentence representation compression
```

![Layer 11 Head 11 Attention](docs/images/layer11_Head_01.png)

This reflects how transformer reasoning evolves step-by-step.

---

# Why This Tool Is Useful

This visualizer helps researchers and engineers:

- inspect model reasoning
- debug hallucinations
- analyze token influence
- study linguistic structure learning
- understand embedding formation

Similar tools are used in transformer interpretability research.

---

# Tech Stack

Backend:

- FastAPI
- PyTorch
- HuggingFace Transformers

Frontend:

- React
- Plotly

Visualization:

- attention matrices
- token relationships
- head-level reasoning

---

# Future Improvements

Possible extensions:

- automatic head role labeling
- syntax vs semantic head detection
- cross-layer attention animation
- GPU acceleration support
- sentence embedding export

---

# Summary

This project demonstrates how transformers progressively construct meaning from text.

From token identity to grammar to semantic understanding, attention heatmaps provide a transparent window into model reasoning.

This makes the system valuable for:

- AI engineers
- NLP researchers
- students learning transformers
- interpretability research

