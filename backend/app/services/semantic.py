"""Dependency-free semantic search engine.

A compact TF-IDF vector-space model with cosine similarity — no external ML
libraries, no model downloads, deterministic and fast for in-tenant corpora.
It powers semantic ("more like this") discovery and the free-text ranking stage
of natural-language search.

In production this is the seam where a learned embedding model (e.g. a
sentence-transformer served from the model registry) would plug in behind the
same interface.
"""

import math
import re
from collections import Counter

from app.models.property import Property

_TOKEN_RE = re.compile(r"[a-z0-9]+")
_STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "at", "by",
    "from", "is", "are", "this", "that", "it", "as", "be", "home", "property", "features",
    "your", "you", "near", "close", "great", "very", "more", "less", "than",
}


def tokenize(text: str) -> list[str]:
    return [t for t in _TOKEN_RE.findall(text.lower()) if len(t) > 1 and t not in _STOPWORDS]


def property_document(prop: Property) -> str:
    """Flatten a property into one searchable text document."""
    address = prop.address or {}
    parts = [
        prop.title or "",
        prop.description or "",
        " ".join(prop.amenities or []),
        str(address.get("city", "")),
        str(address.get("state", "")),
        str(address.get("country", "")),
        getattr(prop.property_type, "value", str(prop.property_type)),
        getattr(prop.listing_type, "value", str(prop.listing_type)),
    ]
    return " ".join(parts)


class SemanticIndex:
    """Builds a TF-IDF index over a set of documents and ranks by cosine similarity."""

    def __init__(self, documents: dict[str, str]):
        self._tokens = {doc_id: tokenize(text) for doc_id, text in documents.items()}
        n_docs = max(1, len(self._tokens))
        doc_freq: Counter[str] = Counter()
        for tokens in self._tokens.values():
            for term in set(tokens):
                doc_freq[term] += 1
        # Smoothed IDF.
        self._idf = {term: math.log((n_docs + 1) / (freq + 1)) + 1.0 for term, freq in doc_freq.items()}
        self._vectors = {doc_id: self._vectorize(tokens) for doc_id, tokens in self._tokens.items()}

    def _vectorize(self, tokens: list[str]) -> dict[str, float]:
        if not tokens:
            return {}
        counts = Counter(tokens)
        length = len(tokens)
        return {term: (count / length) * self._idf.get(term, 0.0) for term, count in counts.items()}

    @staticmethod
    def cosine(a: dict[str, float], b: dict[str, float]) -> float:
        if not a or not b:
            return 0.0
        shared = set(a) & set(b)
        dot = sum(a[t] * b[t] for t in shared)
        norm_a = math.sqrt(sum(v * v for v in a.values()))
        norm_b = math.sqrt(sum(v * v for v in b.values()))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def rank(self, query_text: str) -> list[tuple[str, float]]:
        query_vec = self._vectorize(tokenize(query_text))
        scored = [(doc_id, self.cosine(query_vec, vec)) for doc_id, vec in self._vectors.items()]
        scored.sort(key=lambda item: item[1], reverse=True)
        return scored

    def similar_to(self, doc_id: str) -> list[tuple[str, float]]:
        base = self._vectors.get(doc_id)
        if not base:
            return []
        scored = [
            (other_id, self.cosine(base, vec))
            for other_id, vec in self._vectors.items()
            if other_id != doc_id
        ]
        scored.sort(key=lambda item: item[1], reverse=True)
        return scored


def build_property_index(properties: list[Property]) -> SemanticIndex:
    return SemanticIndex({p.id: property_document(p) for p in properties})
