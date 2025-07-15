//存储用户与ai的历史对话，用于上下文记忆
let conversationHistory = [];
//控制是否等待ai响应，发放时重复发送请求
let isWaiting = false;

//页面加载完成后获取配置信息
document.addEventListener('DOMContentLoaded',function(){
    loadConfig();

    //回车发送信息（使用 keydown 以兼容更多浏览器）
    document.getElementById('user-input').addEventListener('keydown', function(e){
        if(e.key === 'Enter' && !e.shiftKey){
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

       //进行错误处理（网络，什么的出错就会报错，就会进入.catch(···)中）
       .catch(err =>{
        //打印错误信息到控制台
          console.error('发送消息失败',err);
          loadingMsg.remove();
          //显示友好的错误提示信息
          addMessage("系统","抱歉，网络出现问题，请稍后再试","bot error");
          //恢复按钮和输入框状态
          setWaiting(false);
       });
    }
function addMessage(sender,text,cls){
        const msgDiv = document.createElement("div");
        msgDiv.className = "msg " + cls;

        const contentDiv = document.createElement("div");
-        contentDiv,className = "msg-content" + (cls.includes('error') ? 'error':'');
        contentDiv.className = "msg-content" + (cls.includes('error') ? ' error':'');

        const senderDiv=document.createElement("div");
        senderDiv.className="sender";
        senderDiv.textContent=sender;

        const textDiv=document.createElement("div");
        textDiv.innerHTML=text;

        contentDiv.appendChild(senderDiv);
        contentDiv.appendChild(textDiv);
        msgDiv.appendChild(contentDiv);

        const messagesContainer=document.getElementById("messages");
        messagesContainer.appendChild(msgDiv);

        //滚动到底部
        messagesContainer.scrollTop=messagesContainer.scrollHeight;

        //返回创建的消息元素
        return msgDiv;
}

function setWaiting(waiting){
    //设置全局变量isWaiting
    isWaiting=waiting;

    //获取DOM元素
    const sendBtn=document.getElementById('send-btn');
    const input = document.getElementById("user-input");
    
    //设置禁用状态
    sendBtn.disabled=waiting;
    input.disabled=waiting;

    if(waiting){
        sendBtn.textContent='发送中···';
    } else{
        sendBtn.textContent='发送';
        input.focus();
    }
}

// 添加清空聊天函数，以配合 HTML 中 clear-btn
function clearChat(){
    // 询问是否确认清空
    if (!confirm("确定要清空聊天记录吗？")) return;
    document.getElementById('messages').innerHTML = '';
    // 同时清空本地对话历史
    conversationHistory = [];
}