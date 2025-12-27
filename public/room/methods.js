import {socket} from "./socket.js";
let selected;
let selected_f;
let roomId;
let friendCursor;
let currentUsername = "";

export const fetchRoomData = async() => {
    try {
        console.log("Fetching room data...");
        const res = await fetch("/api/room-info")
        if(res.status == 401) return window.location.href = "/login"
        if(res.status == 404 || res.status == 403) return window.location.href = "/";

        const data = await res.json();
        const {_id, name, difficulty, board, initial_data, users, messages} = data;
        roomId = _id.toString()
        createBoard(board, initial_data);

        const res2 = await fetch("/api/username",{
            method: "POST",
            headers:{"Content-Type": "Application/json"},
            body: JSON.stringify({users})
        })  
        const {userList} = await res2.json();
        
        // Set current username from userList
        const me = userList.find(u => u.user === "me");
        if (me) {
            currentUsername = me.username;
            console.log("Current user identified as:", currentUsername);
        }

        renderUsers(name, userList, difficulty);

        // Initial load of messages
        const chatMessages = document.getElementById("chat-messages");
        if (chatMessages) {
            chatMessages.innerHTML = "";
            if (messages && messages.length > 0) {
                console.log(`Loading ${messages.length} archived messages.`);
                messages.forEach(msg => {
                    appendMessage(msg.sender, msg.content, msg.sender === currentUsername);
                });
            }
        }
    } catch (err) {
        console.error("Error in fetchRoomData:", err);
    }
}

export const logout = async () => {
    try{
        await fetch("/api/leaveRoom");
        socket.emit("user_leave")
        window.location.href = "/"
    } catch(err) {
        console.error(err)
    }
}

function createBoard(board, initial_data) {
    const boardElement = document.getElementById("sudoku-board");
    if (!boardElement) return;
    boardElement.innerHTML = "";
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement("div");
            cell.classList.add("sudoku-cell");
            const value = board[row][col];
            if(initial_data[row][col] != 0){
                cell.style.fontWeight = "bolder";
                cell.style.cursor = "not-allowed";
                cell.classList.add("fixed");
            }
            if(initial_data[row][col] == -1) cell.style.color = "green"
            if (value !== 0) cell.textContent = value;
            
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.style.userSelect = "none"
            cell.addEventListener("click", () => {
                if(cell.classList.contains("fixed")) return;
                if(selected) selected.classList.remove("highlighted");
                selected = cell;
                cell.classList.add("highlighted")
                socket.emit("click", {roomId: roomId, row, col});
            });
            boardElement.appendChild(cell);
        }
    }
}

function renderUsers(name, userList, difficulty) {
    const room = document.getElementById("roomname");
    if (room) room.innerHTML = `${name}(${difficulty})`
    const userListEl = document.getElementById("user-list");
    if (!userListEl) return;
    userListEl.innerHTML = "";
    userList.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user.username;
        if(user.user == "me") {
            li.style.backgroundColor = "green";
            li.id = "user";
        } else {
            li.style.backgroundColor = user.socket ? "green" : "red";
            li.id = "friend";
        }
        userListEl.appendChild(li);
    });
}

function appendMessage(sender, message, isMe) {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) {
        console.warn("Attempted to append message but chat-messages container not found.");
        return;
    }
    
    const messageEl = document.createElement("div");
    messageEl.className = `message ${isMe ? 'sent' : 'received'}`;
    
    const userLabel = document.createElement("span");
    userLabel.className = "message-user";
    userLabel.textContent = isMe ? "You" : sender;
    
    const content = document.createElement("div");
    content.textContent = message;
    
    messageEl.appendChild(userLabel);
    messageEl.appendChild(content);
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

const sendMessage = () => {
    const chatInput = document.getElementById("chat-input");
    if (!chatInput) return;
    const text = chatInput.value.trim();
    if (text) {
        console.log("Sending message:", text);
        socket.emit("chat_message", text);
        chatInput.value = "";
    }
};

// --- DOM Event Listeners (ensure they attach after page load) ---
document.addEventListener("DOMContentLoaded", () => {
    const chatFab = document.getElementById("chat-fab");
    const chatWindow = document.getElementById("chat-window");
    const closeChat = document.getElementById("close-chat");
    const sendBtn = document.getElementById("send-btn");
    const chatInput = document.getElementById("chat-input");

    if (chatFab) {
        chatFab.addEventListener("click", () => {
            chatWindow.classList.toggle("hidden");
            if (!chatWindow.classList.contains("hidden")) {
                chatInput.focus();
                const chatMessages = document.getElementById("chat-messages");
                if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
    }
    if (closeChat) {
        closeChat.addEventListener("click", () => {
            chatWindow.classList.add("hidden");
        });
    }
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
    
    const hintBtn = document.getElementById("hint-btn");
    if (hintBtn) {
        hintBtn.addEventListener("click", () => {
            if(!selected) return alert("Choose a cell!")
            socket.emit("get_hint", {row: selected.dataset.row, col: selected.dataset.col});
        })
    }
    
    const numbers = document.querySelectorAll(".num-btn");
    numbers.forEach(num => {
        num.addEventListener("click", () => {
            if(!selected) return alert("Choose a cell!")
            const number = num.dataset.value;
            const row = selected.dataset.row;
            const col = selected.dataset.col;
            selected.innerHTML = number;
            socket.emit("select_number", {row, col, number})
        })
    });
});

window.addEventListener("keydown", (e) => {
    if (!selected) return;
    const row = selected.dataset.row;
    const col = selected.dataset.col;
    if (e.key >= '1' && e.key <= '9') {
        selected.innerHTML = e.key;
        socket.emit("select_number", { row, col, number: e.key });
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        selected.innerHTML = "";
        socket.emit("select_number", { row, col, number: 0 });
    } else if (e.key == "Shift") {
        socket.emit("get_hint", {row,col});
    }
});

// --- Live Cursor ---
let lastEmit = 0;
document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastEmit > 50) {
        const board = document.getElementById("sudoku-board");
        if (!board) return;
        const rect = board.getBoundingClientRect();
        const xRel = (e.clientX - rect.left) / rect.width;
        const yRel = (e.clientY - rect.top) / rect.height;
        socket.emit("cursor_move", { x: xRel, y: yRel });
        lastEmit = now;
    }
});

// --- Socket Listeners ---
socket.on("chat_message", (data) => {
    console.log("New message received via socket:", data);
    appendMessage(data.username, data.message, data.userId === socket.id);
});

socket.on("cursor_update", ({ x, y }) => {
    if (!friendCursor) {
        friendCursor = document.createElement("div");
        friendCursor.className = "remote-cursor";
        const dot = document.createElement("div");
        dot.className = "remote-cursor-dot";
        friendCursor.appendChild(dot);
        document.body.appendChild(friendCursor);
    }
    const board = document.getElementById("sudoku-board");
    if (board) {
        const rect = board.getBoundingClientRect();
        const localX = rect.left + (x * rect.width);
        const localY = rect.top + (y * rect.height);
        friendCursor.style.transform = `translate(${localX}px, ${localY}px)`;
    }
});

socket.on("user_online", () => {
    const friend = document.getElementById("friend");
    if (friend) friend.style.backgroundColor = "green";
})
socket.on("user_offline", () => {
    const friend = document.getElementById("friend");
    if (friend) friend.style.backgroundColor = "red";
    if (friendCursor) { friendCursor.remove(); friendCursor = null; }
})
socket.on("user_leave", () => {
    if (friendCursor) { friendCursor.remove(); friendCursor = null; }
    fetchRoomData();
});
socket.on("user_join", () => fetchRoomData());

socket.on("click_update", ({row, col}) => {
    if(selected_f) selected_f.classList.remove("highlighted-friend");
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.classList.add("highlighted-friend")
        selected_f = cell;
    }
})

socket.on("select_update", ({row, col, number}) => {
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) cell.innerHTML = (number == 0) ? "" : number;
})

socket.on("hint", ({row, col, solve}) => {
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        cell.innerHTML = solve;
        cell.style.fontWeight = "bolder"
        cell.style.color = "green";
        cell.classList.add("fixed"); 
        cell.style.cursor = "not-allowed";
        cell.classList.remove("highlighted")
        if (selected === cell) selected = null;
    }
})

socket.on("success", () => {
    const container = document.querySelector(".sudoku-container");
    if (container) container.style.border = "5px solid green"
    alert("Tebrikler!")
})

socket.on("fail", () => {
    const container = document.querySelector(".sudoku-container");
    if (container) {
        container.style.border = "8px solid red"
        setTimeout(() => container.style.border = "3px solid black", 1000);
    }
})