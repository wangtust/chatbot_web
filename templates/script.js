//存储用户与ai的历史对话，用于上下文记忆
let conversationHistory = [];
//控制是否等待ai响应，发放时重复发送请求
let isWaiting = false;

//页面加载完成后获取配置信息
document.addEventListener('DOMContentLoaded',function(){
    loadConfig();

    //回车发送信息
    document.getElementById('user-input').addEventListener('keypress',function(e){
        if(e.key == 'Enter' &&!e.shiftKey){
            //阻止默认的换行行为

            e.preventDefault();
            sendMessage();
        }
    });
});

function loadConfig(){
    fetch('/config')
    .then(res => res.json())
    .then(config => {
        const configInfo = document.getElementById('config-info');
        //设置了文本内容
        configInfo.textContent = `模型: ${config.model}| API: ${config.api_configured ? '已配置' : '未配置'}`;
    })
    //进行错误处理
    .catch(err =>{
        console.error('获取配置失败:',err)
    });
}


//发送信息
function sendMessage(){
    //防止重复提交
    if (isWaiting) return;
    
    //获取输入内容
    const input=document.getElementById("user-input");
    const msg = input.value.trim();
    
    //检查是否为空消息
    if (!msg){
        input.focus();
        return;
    }

    //添加用户信息
    addMessage("你",msg,"user");
    
    //以对象格式添加到历史对话
    conversationHistory.push({
        //表示用户说的话
        role:"user",
        //具体内容
        content:msg
    });

    //清空输入框并禁用发送按钮
    input.value = "";
    setWaiting(true);

    //添加加载指示器
    const loadingMsg = addMessage("AI助手",'<div class="loading"></div> 正在思考···',"bot");

    //发送请求
    fetch("/chat",{
        method :"POST",
        headers : {"Content-Type":"application/json"},
        body : JSON.stringify({
            message:msg,
            history : conversationHistory.slice(-10) //只发送近10轮对话
        })
    })
       .then(res => res.json())
       .then(data =>{
        //移除加载指示器
        loadingMsg.remove();
        
        //判断是否有错误
        if(data.error){
            addMessage("系统",data.response, "bot error");
        }
        else{
            addMessage("AI助手",data.response,"bot");

            //添加到对话历史
            conversationHistory.push({
                role : "assistant",
                content: data.response
            });
        }
        setWaiting(false);
       })
       .catch(err =>{
          console.error('发送消息失败',err);
          loadingMsg.remove();
          addMessage("系统","抱歉，网络出现问题，请稍后再试","bot error");
          setWaiting(false);
       });

}
// async function sendMessage() {
//   const input = document.getElementById('user-input');
//   const txt = input.value.trim();
//   if (!txt) return;
//   appendMessage('user', txt);
//   input.value = '';
//   const res = await fetch('/api/chat', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ message: txt })
//   });
//   const { reply } = await res.json();
//   appendMessage('bot', reply);
// }

// function appendMessage(role, text) {
//   const div = document.createElement('div');
//   div.className = `msg ${role}`;
//   div.innerHTML = `
//     <div class="msg-content">
//       <div class="sender">${role==='bot'?'AI助手':'我'}</div>
//       ${text}
//     </div>`;
//   document.getElementById('messages').appendChild(div);
//   document.getElementById('messages').scrollTop = 1e9;
// }

// function clearChat() {
//   document.getElementById('messages').innerHTML = '';
// }

// document.getElementById('send-btn').addEventListener('click', sendMessage);
// document.getElementById('clear-btn').addEventListener('click', clearChat);

// const inputEl = document.getElementById('user-input');
// inputEl.addEventListener('keydown', function(e) {
//   // e.key 也可以用 e.keyCode === 13 检测回车
//   if (e.key === 'Enter') {
//     e.preventDefault();      // 阻止默认换行或表单提交
//     sendMessage();           // 调用发送函数
//   }
// });