# torch — main PyTorch library for tensors and math
# torch.nn — neural network modules (Linear layers, etc.)
# torch.nn.functional — stateless ops like softmax and dropout, called directly without a module
# Optional — lets me type-hint arguments that can be None
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional


# The core of the transformer — computes how much each token should attend to every other token and returns a weighted mix of values
def scaled_dot_product(q: torch.Tensor, k: torch.Tensor, v: torch.Tensor, mask: Optional[torch.Tensor], dropout: float = 0.0) -> torch.Tensor:
    head_dim = q.shape[-1]
    scores = torch.matmul(q, k.transpose(-2, -1)) / head_dim ** 0.5

    if mask is not None:
        scores = scores.masked_fill(mask == False, -1e9)

    weights = F.softmax(scores, dim=-1)
    weights = F.dropout(weights, p=dropout)

    return weights @ v


# Builds a lower-triangular boolean mask so each token can only attend to itself and earlier tokens, not future ones
def make_causal_mask(seq_len: int, device: torch.device) -> torch.Tensor:
    mask = torch.ones(seq_len, seq_len, device=device)
    mask = torch.tril(mask).bool()
    return mask.unsqueeze(0).unsqueeze(0)  # [1, 1, seq, seq]


# Runs attention in parallel across multiple heads so the model can learn different relationship types simultaneously — core transformer component
class MultiHeadAttention(nn.Module):
    def __init__(self, embed_dim: int, n_heads: int, dropout: float):
        super().__init__()
        assert embed_dim % n_heads == 0, "embed_dim must be divisible by n_heads"
        self.n_heads  = n_heads
        self.head_dim = embed_dim // n_heads
        self.dropout  = dropout

        self.W_q = nn.Linear(embed_dim, embed_dim, bias=False)
        self.W_k = nn.Linear(embed_dim, embed_dim, bias=False)
        self.W_v = nn.Linear(embed_dim, embed_dim, bias=False)
        self.W_o = nn.Linear(embed_dim, embed_dim)

    # Projects input to Q/K/V, splits into heads, runs attention, merges heads back, and projects to output
    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        batch, seq_len, embed_dim = x.shape

        q = self.W_q(x)
        k = self.W_k(x)
        v = self.W_v(x)

        def split_heads(t):
            return t.view(batch, seq_len, self.n_heads, self.head_dim).transpose(1, 2)

        q, k, v = split_heads(q), split_heads(k), split_heads(v)

        attn_out = scaled_dot_product(q, k, v, mask, self.dropout)
        attn_out = attn_out.transpose(1, 2).contiguous().view(batch, seq_len, embed_dim)
        return self.W_o(attn_out)
