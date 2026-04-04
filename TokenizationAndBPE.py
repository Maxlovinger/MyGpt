# json — used to save and load the tokenizer's merge rules to disk so I don't have to retrain every time
import json


# Counts every adjacent pair of token IDs in a list — the core stat BPE needs to decide what to merge next
def get_stats(ids) -> dict:
    count = 1
    out = {}
    while count < len(ids):
        p = ids[count-1], ids[count]
        if p in out:
            out[p] += 1
        else:
            out[p] = 1
        count += 1
    return out


# Replaces every occurrence of a specific pair of token IDs with a single new ID — applies one BPE merge rule
def merge(ids, pair, new_id):
    first, second = pair
    new_ids = []
    i = 0
    while i < len(ids):
        if i < len(ids)-1 and ids[i] == first and ids[i+1] == second:
            new_ids.append(new_id)
            i += 2
        else:
            new_ids.append(ids[i])
            i += 1
    return new_ids


# BPE tokenizer - converts raw text to/from token IDs using a vocabulary built by merging frequent byte pairs
class BPETokenizer:
    def __init__(self, vocab_size: int):
        self.vocab_size = vocab_size
        self.merges = {}
        self.vocab = {i: bytes([i]) for i in range(256)}

    # Learns the merge rules by repeatedly merging the most frequent pair in the training text
    def train(self, text: str):
        ids = list(text.encode("utf-8"))
        new_id = 256

        n = self.vocab_size - 256
        for i in range(n):
            s = get_stats(ids)
            if not s:
                break
            pair = max(s, key=s.get)
            self.merges[pair] = new_id
            self.vocab[new_id] = self.vocab[pair[0]] + self.vocab[pair[1]]
            ids = merge(ids, pair, new_id)
            new_id += 1

    # Converts a string into a list of token IDs by applying learned merge rules in order
    def encode(self, text: str) -> list[int]:
        ids = list(text.encode("utf-8"))

        while True:
            stats = get_stats(ids)
            if not stats:
                break
            pair = min(stats, key=lambda p: self.merges.get(p, float('inf')))
            if pair not in self.merges:
                break
            new_id = self.merges[pair]
            ids = merge(ids, pair, new_id)

        return ids

    # Converts a list of token IDs back into a human-readable string
    def decode(self, ids: list[int]) -> str:
        tokens = b"".join(self.vocab[i] for i in ids)
        return tokens.decode("utf-8", errors="replace")

    # Saves the vocabulary size and merge rules to a JSON file so the tokenizer can be reloaded later
    def save(self, path: str) -> None:
        model = {
            "vocab_size": self.vocab_size,
            "merges": {f"{a},{b}": new_id for (a, b), new_id in self.merges.items()},
        }
        with open(path, "w") as f:
            json.dump(model, f)

    # Loads merge rules from a saved JSON file and rebuilds the vocabulary from scratch
    def load(self, path: str) -> None:
        with open(path) as f:
            model = json.load(f)
        self.vocab_size = model["vocab_size"]
        self.merges = {}
        for key, new_id in model["merges"].items():
            a, b = key.split(",")
            self.merges[int(a), int(b)] = new_id
        self.vocab = {i: bytes([i]) for i in range(256)}
        for (a, b), new_id in self.merges.items():
            self.vocab[new_id] = self.vocab[a] + self.vocab[b]
