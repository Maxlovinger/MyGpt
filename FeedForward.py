# torch — main PyTorch library for tensors
# torch.nn — neural network modules including Linear and Dropout
# torch.nn.functional — stateless activation functions like gelu, called directly
import torch
import torch.nn as nn
import torch.nn.functional as F


# Processes each token position independently with a small MLP — gives the model nonlinear computation after attention has mixed information across tokens
class FeedForward(nn.Module):
    def __init__(self, embed_dim: int, dropout: float):
        super().__init__()
        self.linear1 = nn.Linear(embed_dim, embed_dim * 4)  # expand to 4x
        self.linear2 = nn.Linear(embed_dim * 4, embed_dim)  # compress back
        self.dropout = nn.Dropout(dropout)

    # Expands the representation into a wider space, applies GELU nonlinearity, then compresses back to embed_dim
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.linear1(x)
        x = F.gelu(x)
        x = self.dropout(x)
        x = self.linear2(x)
        return x
