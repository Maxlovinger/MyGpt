# torch — main PyTorch library, gives me tensors and math operations
# torch.nn — contains all the neural network building blocks like Linear, Embedding, Dropout
import torch
import torch.nn as nn


# Converts token IDs into dense vectors the transformer can do math on — first step of the GPT pipeline
class Embeddings(nn.Module):
    def __init__(self, vocab_size: int, embed_dim: int, max_seq_len: int, dropout: float):
        super().__init__()
        self.token_emb = nn.Embedding(vocab_size, embed_dim)
        self.pos_emb   = nn.Embedding(max_seq_len, embed_dim)
        self.dropout   = nn.Dropout(dropout)

    # Looks up token and position embeddings and adds them together so the model knows both what each token is and where it sits
    def forward(self, token_ids: torch.Tensor) -> torch.Tensor:
        seq_len = token_ids.shape[1]
        tok       = self.token_emb(token_ids)
        positions = torch.arange(seq_len, device=token_ids.device).unsqueeze(0)
        pos       = self.pos_emb(positions)
        return self.dropout(tok + pos)
