import os
import torch
from flask import Flask, request, jsonify, send_from_directory
from GPT import GPT
from TokenizationAndBPE import BPETokenizer
from generate import generate

# Serve the built React app from frontend/dist
DIST = os.path.join(os.path.dirname(__file__), "frontend", "dist")

app = Flask(__name__, static_folder=DIST, static_url_path="")

# Load model and tokenizer once at startup
device = "cpu"

print("Loading tokenizer...")
tok = BPETokenizer(vocab_size=8000)
tok.load("tokenizer.json")

print("Loading model...")
checkpoint = torch.load("checkpoint.pt", map_location=device)
cfg   = checkpoint["config"]
model = GPT(**cfg).to(device)
model.load_state_dict(checkpoint["model"])
model.eval()
print("Ready.")


@app.route("/generate", methods=["POST"])
def generate_text():
    data        = request.json
    prompt      = data.get("prompt", "")
    temperature = float(data.get("temperature", 0.8))
    max_tokens  = int(data.get("max_tokens", 150))

    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    output = generate(
        model=model,
        tokenizer=tok,
        prompt=prompt,
        max_new_tokens=max_tokens,
        temperature=temperature,
        device=device,
    )

    new_text = output[len(prompt):]
    return jsonify({"response": new_text})


# Catch-all: serve index.html for all non-API routes (React Router)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    full = os.path.join(DIST, path)
    if path and os.path.exists(full):
        return send_from_directory(DIST, path)
    return send_from_directory(DIST, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
