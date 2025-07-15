async function sendMessage() {
  const input = document.getElementById('user-input');
  const txt = input.value.trim();
  if (!txt) return;
  appendMessage('user', txt);
  input.value = '';
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: txt })
  });
  const { reply } = await res.json();
  appendMessage('bot', reply);
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = `
    <div class="msg-content">
      <div class="sender">${role==='bot'?'AI助手':'我'}</div>
      ${text}
    </div>`;
  document.getElementById('messages').appendChild(div);
  document.getElementById('messages').scrollTop = 1e9;
}

function clearChat() {
  document.getElementById('messages').innerHTML = '';
}

document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('clear-btn').addEventListener('click', clearChat);

const inputEl = document.getElementById('user-input');
inputEl.addEventListener('keydown', function(e) {
  // e.key 也可以用 e.keyCode === 13 检测回车
  if (e.key === 'Enter') {
    e.preventDefault();      // 阻止默认换行或表单提交
    sendMessage();           // 调用发送函数
  }
});