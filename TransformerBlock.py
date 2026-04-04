# torch — main PyTorch library for tensors
# torch.nn — gives me LayerNorm and the base Module class
# Optional — lets me type-hint the mask as optional
# MultiHeadAttention — the attention mechanism I built, lets tokens look at each other
# make_causal_mask — builds the mask that stops tokens from seeing the future
# FeedForward — the per-token MLP that runs after attention
import torch
import torch.nn as nn
from typing import Optional
from Attention import MultiHeadAttention, make_causal_mask
from FeedForward import FeedForward


# One full layer of the transformer — combines attention and feedforward with residual connections and layer norm
class TransformerBlock(nn.Module):
    def __init__(self, embed_dim: int, n_heads: int, dropout: float):
        super().__init__()
        self.attn  = MultiHeadAttention(embed_dim, n_heads, dropout)
        self.ff    = FeedForward(embed_dim, dropout)
        self.norm1 = nn.LayerNorm(embed_dim)  # applied before attention
        self.norm2 = nn.LayerNorm(embed_dim)  # applied before feedforward

    # Runs pre-norm attention then pre-norm feedforward, both with residual connections so gradients flow cleanly
    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        x = x + self.attn(self.norm1(x), mask)
        x = x + self.ff(self.norm2(x))
        return x
