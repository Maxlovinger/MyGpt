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


def load_hf_dataset_texts(dataset_name: str, split: str = "train", text_column: str = "text", max_examples: int = None) -> list[str]:
    # Returns a list of individual texts rather than one big string — so we can encode each separately
    from datasets import load_dataset
    if max_examples is not None:
        ds = load_dataset(dataset_name, split=split, streaming=True)
        texts = []
        for i, example in enumerate(ds):
            if i >= max_examples:
                break
            texts.append(example[text_column][:200_000])
    else:
        ds = load_dataset(dataset_name, split=split)
        texts = list(ds[text_column])
    return texts


def build_dataset(
    tokenizer: BPETokenizer,
    context_length: int,
    personal_dir: str = None,
    hf_dataset_name: str = None,
    hf_split: str = "train",
    hf_text_column: str = "text",
    hf_max_examples: int = None,
) -> TextDataset:

    all_texts = []

    if hf_dataset_name:
        all_texts += load_hf_dataset_texts(hf_dataset_name, split=hf_split, text_column=hf_text_column, max_examples=hf_max_examples)

    if personal_dir:
        personal_text = load_personal_data(personal_dir)
        all_texts.append(personal_text)

    # Encode each text separately — much faster than one giant string
    print(f"Encoding {len(all_texts)} texts...", flush=True)
    token_ids = []
    for i, text in enumerate(all_texts):
        print(f"  [{i+1}/{len(all_texts)}] {len(text):,} chars", flush=True)
        token_ids += tokenizer.encode(text)

    return TextDataset(token_ids, context_length)


def get_dataloader(dataset: TextDataset, batch_size: int, shuffle: bool = True) -> DataLoader:
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)
