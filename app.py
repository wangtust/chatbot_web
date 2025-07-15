from flask import Flask, request, jsonify, render_template
import requests
from config import API_URL, API_KEY

app = Flask(__name__, static_folder="templates", static_url_path="", template_folder="templates")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json()
    user_message = data.get("message", "")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": user_message}],
    }
    resp = requests.post(API_URL, headers=headers, json=payload)
    if resp.status_code != 200:
        return jsonify({"reply": "请求失败", "error": resp.text}), 500
    result = resp.json()
    try:
        reply_text = result["choices"][0]["message"]["content"]
    except Exception:
        reply_text = "解析返回结果失败"
    return jsonify({"reply": reply_text})

if __name__ == "__main__":
    app.run(debug=True)
