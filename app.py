import os
from flask import Flask, request, jsonify, render_template
import requests
from config import API_URL, API_KEY, MODEL
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# 使用 instance 目录，并确保文件夹存在
app = Flask(__name__, static_folder="templates", static_url_path="", template_folder="templates", instance_relative_config=True)
os.makedirs(app.instance_path, exist_ok=True)
# 数据库配置，使用绝对路径
db_path = os.path.join(app.instance_path, 'chat_history.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 定义消息模型
class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(10), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# 启动时创建数据表
with app.app_context():
    db.create_all()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/config", methods=["GET"])
def api_config():
    # 前端加载时获取模型名称和 API 配置状态
    return jsonify({
        "model": MODEL,
        "api_configured": bool(API_KEY)
    })

@app.route("/chat", methods=["POST"])
def api_chat():
    data = request.get_json() or {}
    history = data.get("history", [])  # 前端传来的上下文数组
    user_message = data.get("message", "")
    # 保存用户消息
    user_msg = Message(role='user', content=user_message)
    db.session.add(user_msg)
    db.session.commit()
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
        "model": MODEL,
        "messages": messages,
    }
    # 调用外部聊天 API
    try:
        resp = requests.post(API_URL, headers=headers, json=payload, timeout=10)
    except requests.RequestException:
        return jsonify({"error": True, "response": "请求聊天服务失败，请稍后再试"}), 503
    # 如果第三方返回非 200，给用户友好提示
    if resp.status_code != 200:
        return jsonify({"error": True, "response": f"第三方服务不可用（{resp.status_code}），请稍后重试"}), resp.status_code
    data = resp.json()
    reply_text = data.get("choices", [])[0].get("message", {}).get("content", "")
    # 保存机器人回复
    bot_msg = Message(role='bot', content=reply_text)
    db.session.add(bot_msg)
    db.session.commit()
    return jsonify({"error": False, "response": reply_text})

@app.route("/history", methods=["GET"])
def api_history():
    # 返回所有历史消息
    msgs = Message.query.order_by(Message.id).all()
    return jsonify([
        {"role": m.role, "content": m.content, "timestamp": m.timestamp.isoformat()}
        for m in msgs
    ])

if __name__ == "__main__":
    app.run(debug=True)
