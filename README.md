# MyGPT

A GPT-style transformer I built from scratch in PyTorch. No libraries doing the heavy lifting, just raw Python and PyTorch. I wrote every component myself while learning how it all works.

The goal was to actually understand what's happening inside a language model, not just call a pretrained API. I trained it on a mix of my own personal text and a small public dataset, and the whole thing runs on a Raspberry Pi 5.

## What I built

Every file is a component of the transformer, written from scratch:

- `TokenizationAndBPE.py` - byte pair encoding tokenizer, trained on my own data
- `Embeddings.py` - token embeddings + positional embeddings
- `Attention.py` - scaled dot product attention, causal masking, multi-head attention
- `FeedForward.py` - the MLP block that runs after attention in each layer
- `TransformerBlock.py` - one full transformer layer (attention + feedforward + residual connections + layer norm)
- `GPT.py` - the full model, stacks N transformer blocks and outputs logits
- `Dataset.py` - loads personal text files and HuggingFace datasets, builds sliding window token batches
- `train.py` - training loop with AdamW, gradient clipping, cosine LR schedule
- `generate.py` - autoregressive text generation with temperature and top-k sampling

## Model size

Tuned to train and run on a Raspberry Pi 5 (4GB RAM):

| Hyperparameter | Value |
|---|---|
| Parameters | ~1.8M |
| Embedding dim | 128 |
| Layers | 4 |
| Attention heads | 4 |
| Context length | 128 tokens |
| Vocabulary size | 4000 |

## Training data

Used HuggingFace Data. The tokenizer is trained on the dataset.

## How to run it

Install dependencies:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

Train:
```bash
python train.py
```

Generate text from a trained checkpoint:
```bash
python generate.py
```

## Why I did this

I wanted to understand transformers from the ground up, not just use them. Writing every component yourself is the only way to really know what attention is doing, why residual connections matter, what the loss is actually measuring, and how a token gets from raw text all the way to a predicted probability distribution. Turns out its not that mysterious once you build it yourself.
