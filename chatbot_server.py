# This script will collect chat data and train a simple text generation model
# You will need: pip install flask torch transformers

from flask import Flask, request, jsonify
import os

app = Flask(__name__)

DATA_FILE = 'chat_data.txt'
MODEL_FILE = 'chatbot_model.pt'

# Placeholder for model (use transformers or torch for real model)
class SimpleChatModel:
    def __init__(self):
        self.pairs = []  # List of (input, reply) pairs
        self.custom_pairs = []  # User-taught pairs
        self.custom_file = 'custom_pairs.txt'
    def train(self, data):
        self.pairs = []
        self.custom_pairs = []
        # Load custom pairs from file
        if os.path.exists(self.custom_file):
            with open(self.custom_file, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        q, a = line.strip().split('||', 1)
                        self.custom_pairs.append((q, a))
                    except Exception:
                        continue
        # Check for new teach commands in chat data
        for line in data:
            if line.lower().startswith('teach:when '):
                try:
                    teach_part = line[10:].strip()
                    q, a = teach_part.split(' then ', 1)
                    q = q.strip().lower()
                    a = a.strip()
                    self.custom_pairs.append((q, a))
                    # Save to file
                    with open(self.custom_file, 'a', encoding='utf-8') as f:
                        f.write(f'{q}||{a}\n')
                except Exception:
                    continue
        # Build pairs from consecutive messages
        for i in range(len(data) - 1):
            input_msg = data[i].split(':', 1)[-1].strip()
            reply_msg = data[i+1].split(':', 1)[-1].strip()
            self.pairs.append((input_msg, reply_msg))
    def generate(self, prompt):
        prompt = prompt.strip().lower()
        # Check custom-taught pairs first
        for q, a in self.custom_pairs:
            if prompt == q or q in prompt or prompt in q:
                return a
        # Find best match in chat history
        for input_msg, reply_msg in self.pairs:
            if prompt in input_msg.lower() or input_msg.lower() in prompt:
                return reply_msg
        if self.pairs:
            return self.pairs[-1][1]
        return "I'm still learning!"

model = SimpleChatModel()

@app.route('/train', methods=['POST'])
def train():
    if not os.path.exists(DATA_FILE):
        return jsonify({'status': 'no data'}), 400
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = [line.strip() for line in f if line.strip()]
    model.train(data)
    return jsonify({'status': 'trained', 'count': len(data)})

@app.route('/chat', methods=['POST'])
def chat():
    # Retrain on every chat request
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = [line.strip() for line in f if line.strip()]
        model.train(data)
    prompt = request.json.get('prompt', '')
    response = model.generate(prompt)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(port=5005)
