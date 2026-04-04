# torch — main PyTorch library for tensors
# torch.nn — gives me ModuleList, LayerNorm, Linear, and the base Module class
# Embeddings — converts token IDs into vectors the model can work with
# TransformerBlock — one full attention + feedforward layer, stacked N times
# make_causal_mask — builds the mask so tokens can't see the future during training
import torch
import torch.nn as nn
from Embeddings import Embeddings
from TransformerBlock import TransformerBlock
from Attention import make_causal_mask


# The full GPT model — stacks N transformer blocks on top of an embedding layer and projects to vocabulary logits
class GPT(nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int, n_heads: int,
                 n_layers: int, max_seq_len: int, dropout: float):
        super().__init__()
        self.embed  = Embeddings(vocab_size, embed_dim, max_seq_len, dropout)
        self.blocks = nn.ModuleList(
            [TransformerBlock(embed_dim, n_heads, dropout) for _ in range(n_layers)]
        )
        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, vocab_size, bias=False)

    # Runs the full forward pass: embed → N transformer blocks → layer norm → logits
    def forward(self, token_ids: torch.Tensor) -> torch.Tensor:
        x    = self.embed(token_ids)
        mask = make_causal_mask(token_ids.shape[1], token_ids.device)

        for block in self.blocks:
            x = block(x, mask)

        x = self.norm(x)
        return self.head(x)

    # Returns total number of trainable parameters so I can check model size before training
    def get_num_params(self) -> int:
        return sum(p.numel() for p in self.parameters())
