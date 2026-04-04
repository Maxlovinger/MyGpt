import torch
from torch.utils.data import Dataset, DataLoader
from TokenizationAndBPE import BPETokenizer

# Holds the full token stream and serves sliding windows as (input, target) pairs
class TextDataset(Dataset):
    def __init__(self, token_ids: list[int], context_length: int):
        self.ids = token_ids
        self.ctx_len = context_length

    def __len__(self) -> int:
        return len(self.ids) - self.ctx_len

    def __getitem__(self, idx: int):
        chunk = self.ids[idx : idx + self.ctx_len + 1]
        x = torch.tensor(chunk[:-1], dtype=torch.long)  # input:  tokens 0..L-1
        y = torch.tensor(chunk[1:],  dtype=torch.long)  # target: tokens 1..L
        return x, y


def load_personal_data(directory: str) -> str:
    # Walk directory, find all .txt and .md files, join with end-of-text separator
    import os
    texts = []
    for root, _, files in os.walk(directory):
        for fname in files:
            if fname.endswith(('.txt', '.md')):
                path = os.path.join(root, fname)
                with open(path, encoding='utf-8', errors='ignore') as f:
                    texts.append(f.read())
    return "\n<|endoftext|>\n".join(texts)


def load_hf_dataset(dataset_name: str, split: str = "train", text_column: str = "text") -> str:
    from datasets import load_dataset
    ds = load_dataset(dataset_name, split=split)
    return "\n<|endoftext|>\n".join(ds[text_column])


def build_dataset(
    tokenizer: BPETokenizer,
    context_length: int,
    personal_dir: str = None,
    hf_dataset_name: str = None,
    personal_weight: float = 0.25,
) -> TextDataset:

    texts = []

    if hf_dataset_name:
        hf_text = load_hf_dataset(hf_dataset_name)
        texts.append(hf_text)

    if personal_dir:
        personal_text = load_personal_data(personal_dir)
        # Repeat personal data to hit the target weight ratio
        hf_len      = len(texts[0]) if texts else 1
        personal_len = len(personal_text)
        repeats     = max(1, int((personal_weight / (1 - personal_weight)) * (hf_len / personal_len)))
        texts.append(personal_text * repeats)

    full_text = "\n<|endoftext|>\n".join(texts)
    token_ids = tokenizer.encode(full_text)
    return TextDataset(token_ids, context_length)


def get_dataloader(dataset: TextDataset, batch_size: int, shuffle: bool = True) -> DataLoader:
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)
