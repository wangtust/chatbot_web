from flask import Flask, request, jsonify, render_template
import requests
from config import API_URL, API_KEY

app = Flask(__name__, static_folder="templates", static_url_path="", template_folder="templates")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/config", methods=["GET"])
def api_config():
    # 前端加载时获取模型名称和 API 配置状态
    return jsonify({
        "model": "gpt-3.5-turbo",
        "api_configured": bool(API_KEY)
    })

@app.route("/chat", methods=["POST"])
def api_chat():
    data = request.get_json() or {}
    history = data.get("history", [])  # 前端传来的上下文数组
    user_message = data.get("message", "")
    # 构造对话列表：先是历史，再追加当前用户输入
    messages = []
    for msg in history:
        # msg 应有 role 和 content
        messages.append({"role": msg.get("role"), "content": msg.get("content")})
    messages.append({"role": "user", "content": user_message})

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": messages,
    }
    try:
        resp = requests.post(API_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        reply_text = data.get("choices", [])[0].get("message", {}).get("content", "")
        return jsonify({"error": False, "response": reply_text})
    except Exception as e:
        err_msg = str(e)
        return jsonify({"error": True, "response": err_msg}), 500

if __name__ == "__main__":
    app.run(debug=True)
