"""
Model registry — defines which HuggingFace models are available
and their metadata surfaced to the frontend.
"""

MODEL_REGISTRY = [
    {
        "id": "bert-base-uncased",
        "label": "BERT Base (Uncased)",
        "description": "12 layers · 12 heads · bidirectional",
        "n_layers": 12,
        "n_heads": 12,
        "type": "encoder",
        "size_mb": 440,
    },
    {
        "id": "distilbert-base-uncased",
        "label": "DistilBERT Base (Uncased)",
        "description": "6 layers · 12 heads · lightweight BERT distillation",
        "n_layers": 6,
        "n_heads": 12,
        "type": "encoder",
        "size_mb": 265,
    },
    {
        "id": "gpt2",
        "label": "GPT-2 (Small)",
        "description": "12 layers · 12 heads · causal / autoregressive",
        "n_layers": 12,
        "n_heads": 12,
        "type": "decoder",
        "size_mb": 548,
    },
]

MODEL_IDS = {m["id"] for m in MODEL_REGISTRY}
