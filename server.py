import os
import torch
from flask import Flask, request, jsonify, send_from_directory
from GPT import GPT
from TokenizationAndBPE import BPETokenizer
from generate import generate

FRONTEND = os.path.join(os.path.dirname(__file__), "FrontEnd")

app = Flask(__name__, static_folder=FRONTEND, static_url_path="")

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


@app.route("/")
def index():
    return send_from_directory(FRONTEND, "index.html")

@app.route("/chat")
def chat():
    return send_from_directory(FRONTEND, "chat.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(FRONTEND, path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)
