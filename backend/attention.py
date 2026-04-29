"""
attention.py — HuggingFace inference engine.

Loads BERT / DistilBERT / GPT-2 with output_attentions=True and returns
the tokenized text plus all attention tensors in JSON-serialisable form.

Model instances are cached in a module-level LRU dict so that repeated
requests for the same model do not pay the load penalty each time.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

import numpy as np
import torch
from transformers import (
    AutoTokenizer,
    AutoModel,
    AutoModelForCausalLM,
    BertTokenizer,
    GPT2Tokenizer,
)

from models import MODEL_IDS

logger = logging.getLogger(__name__)

# ── Module-level model cache ──────────────────────────────────────────────────
_MODEL_CACHE: dict[str, tuple[Any, Any]] = {}

DECODER_MODELS = {"gpt2"}


def _get_model_and_tokenizer(model_id: str):
    """Return (tokenizer, model), loading and caching on first call."""
    if model_id in _MODEL_CACHE:
        return _MODEL_CACHE[model_id]

    if model_id not in MODEL_IDS:
        raise ValueError(f"Unknown model: {model_id!r}")

    logger.info("Loading model %s …", model_id)

    tokenizer = AutoTokenizer.from_pretrained(model_id)

    if model_id in DECODER_MODELS:
        model = AutoModelForCausalLM.from_pretrained(
            model_id, output_attentions=True
        )
    else:
        model = AutoModel.from_pretrained(model_id, output_attentions=True)

    model.eval()
    _MODEL_CACHE[model_id] = (tokenizer, model)
    logger.info("Model %s loaded and cached.", model_id)
    return tokenizer, model


def get_attention(
    text: str,
    model_id: str,
    max_length: int = 128,
) -> dict:
    """
    Run a forward pass and return attention data.

    Returns
    -------
    {
        "tokens":      list[str],          # human-readable sub-word tokens
        "attentions":  list[list[list[list[float]]]],
                       # shape: [n_layers][n_heads][seq_len][seq_len]
        "n_layers":    int,
        "n_heads":     int,
        "model_type":  "encoder" | "decoder",
    }
    """
    tokenizer, model = _get_model_and_tokenizer(model_id)

    # Tokenise ─────────────────────────────────────────────────────────────
    encoding = tokenizer(
        text,
        return_tensors="pt",
        max_length=max_length,
        truncation=True,
    )

    token_ids = encoding["input_ids"][0].tolist()
    tokens = tokenizer.convert_ids_to_tokens(token_ids)

    # Clean up GPT-2's Ġ prefix for readability
    tokens = [t.replace("Ġ", " ").replace("Ċ", "\n") for t in tokens]

    # Forward pass ─────────────────────────────────────────────────────────
    with torch.no_grad():
        outputs = model(**encoding, output_attentions=True)

    # outputs.attentions: tuple of (batch, heads, seq, seq) tensors per layer
    attentions_raw = outputs.attentions  # tuple[Tensor]

    n_layers = len(attentions_raw)
    n_heads = attentions_raw[0].shape[1]

    # Convert to nested Python lists (JSON-serialisable)
    attentions_list: list[list[list[list[float]]]] = []
    for layer_tensor in attentions_raw:
        # layer_tensor: (1, n_heads, seq, seq)  →  (n_heads, seq, seq)
        layer_np = layer_tensor.squeeze(0).cpu().numpy()  # (H, S, S)
        layer_list = layer_np.tolist()
        attentions_list.append(layer_list)

    model_type = "decoder" if model_id in DECODER_MODELS else "encoder"

    return {
        "tokens": tokens,
        "attentions": attentions_list,
        "n_layers": n_layers,
        "n_heads": n_heads,
        "model_type": model_type,
    }
