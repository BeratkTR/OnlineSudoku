import {socket} from "./socket.js";
let selected;
let selected_f;
let roomId;
let friendCursor;
let currentUsername = "";
let currentMode = "insert"; // "insert" or "note"

const chatMessages = document.getElementById("chat-messages");
const chatFab = document.getElementById("chat-fab");
const chatWindow = document.getElementById("chat-window");
const closeChat = document.getElementById("close-chat");
const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("chat-input");

export const fetchRoomData = async() => {
    try {
        const res = await fetch("/api/room-info")
        if(res.status == 401) return window.location.href = "/login"
        if(res.status == 404 || res.status == 403) return window.location.href = "/";

        const data = await res.json();
        const {_id, name, difficulty, board, initial_data, users, messages, notesBoard} = data;
        roomId = _id.toString()
        createBoard(board, initial_data, notesBoard);

        const res2 = await fetch("/api/username",{
            method: "POST",
            headers:{"Content-Type": "Application/json"},
            body: JSON.stringify({users})
        })  
        const {userList} = await res2.json();
        
        const me = userList.find(u => u.user === "me");
        if (me) currentUsername = me.username;

        renderUsers(name, userList, difficulty);

        if (chatMessages) {
            chatMessages.innerHTML = "";
            if (messages && messages.length > 0) {
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

function createBoard(board, initial_data, notesBoard = []) {
    const boardElement = document.getElementById("sudoku-board");
    if (!boardElement) return;
    boardElement.innerHTML = "";
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement("div");
            cell.classList.add("sudoku-cell");
            cell.dataset.row = row;
            cell.dataset.col = col;

            const valDiv = document.createElement("div");
            valDiv.className = "cell-value";
            cell.appendChild(valDiv);

            const notesDiv = document.createElement("div");
            notesDiv.className = "cell-notes";
            cell.appendChild(notesDiv);

            const value = board[row][col];
            if(initial_data[row][col] != 0){
                cell.style.fontWeight = "bolder";
                cell.style.cursor = "not-allowed";
                cell.classList.add("fixed");
            }
            if(initial_data[row][col] == -1) {
                valDiv.style.color = "green";
                valDiv.classList.add("hint-value");
            }
            if (value !== 0) valDiv.textContent = value;
            
            // Render notes
            if (notesBoard[row] && notesBoard[row][col]) {
                updateNotesInCell(cell, notesBoard[row][col]);
            }

            cell.style.userSelect = "none"
            cell.addEventListener("click", () => {
                if(cell.classList.contains("fixed")) return;
                if(selected) selected.classList.remove("highlighted");
                selected = cell;
                cell.classList.add("highlighted")
                socket.emit("click", {row, col});
            });
            boardElement.appendChild(cell);
        }
    }
}

function updateNotesInCell(cell, notes) {
    const notesDiv = cell.querySelector(".cell-notes");
    if (!notesDiv) return;
    notesDiv.innerHTML = "";
    // Only show notes if there's no main value
    const valDiv = cell.querySelector(".cell-value");
    if (valDiv && valDiv.textContent !== "") {
        return;
    }
    
    // We only show up to 4 notes in corners (using grid)
    notes.slice(0, 4).forEach(num => {
        const noteSpan = document.createElement("span");
        noteSpan.className = "note";
        noteSpan.textContent = num;
        notesDiv.appendChild(noteSpan);
    });
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
    if (!chatMessages) return;
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
        socket.emit("chat_message", text);
        chatInput.value = "";
    }
};

const toggleMode = () => {
    const modeInsert = document.getElementById("mode-insert");
    const modeNote = document.getElementById("mode-note");
    if (currentMode === "insert") {
        currentMode = "note";
        if (modeNote) modeNote.classList.add("active");
        if (modeInsert) modeInsert.classList.remove("active");
    } else {
        currentMode = "insert";
        if (modeInsert) modeInsert.classList.add("active");
        if (modeNote) modeNote.classList.remove("active");
    }
};

const handleNumberInput = (number) => {
    if (!selected) return alert("Choose a cell!");
    const row = selected.dataset.row;
    const col = selected.dataset.col;

    if (currentMode === "insert") {
        const valDiv = selected.querySelector(".cell-value");
        const notesDiv = selected.querySelector(".cell-notes");
        if (number == 0) {
            valDiv.innerHTML = "";
            if (notesDiv) notesDiv.innerHTML = "";
        } else {
            valDiv.innerHTML = number;
            // Clear notes if a main number is inserted
            if (notesDiv) notesDiv.innerHTML = "";
        }
        socket.emit("select_number", {row, col, number});
    } else {
        // Note mode
        const valDiv = selected.querySelector(".cell-value");
        const notesDiv = selected.querySelector(".cell-notes");
        
        if (number == 0) {
            // In note mode, delete clears everything
            valDiv.innerHTML = "";
            if (notesDiv) notesDiv.innerHTML = "";
            socket.emit("select_number", {row, col, number: 0});
            return;
        }

        // If there's a main number, clear it first so notes can be seen
        if (valDiv.innerHTML !== "") {
            valDiv.innerHTML = "";
            socket.emit("select_number", {row, col, number: 0});
        }
        
        socket.emit("toggle_note", {row, col, number});
    }
};

// --- DOM Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    // Chat UI
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
    if (closeChat) closeChat.addEventListener("click", () => chatWindow.classList.add("hidden"));
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    if (chatInput) chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // Mode UI
    const modeInsert = document.getElementById("mode-insert");
    const modeNote = document.getElementById("mode-note");
    if (modeInsert && modeNote) {
        modeInsert.addEventListener("click", () => {
            currentMode = "insert";
            modeInsert.classList.add("active");
            modeNote.classList.remove("active");
        });
        modeNote.addEventListener("click", () => {
            currentMode = "note";
            modeNote.classList.add("active");
            modeInsert.classList.remove("active");
        });
    }

    // Hint Button
    const hintBtn = document.getElementById("hint-btn");
    if (hintBtn) {
        hintBtn.addEventListener("click", () => {
            if(!selected) return alert("Choose a cell!")
            socket.emit("get_hint", {row: selected.dataset.row, col: selected.dataset.col});
        })
    }

    // Number Buttons
    const numbers = document.querySelectorAll(".num-btn");
    numbers.forEach(num => {
        num.addEventListener("click", () => handleNumberInput(num.dataset.value));
    });
});

window.addEventListener("keydown", (e) => {
    if (document.activeElement === chatInput) return; 

    if (e.key === "Tab") {
        e.preventDefault();
        toggleMode();
        return;
    }

    if (!selected) return;

    if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleNumberInput(0);
    } else if (e.key == "Shift") {
        socket.emit("get_hint", {row: selected.dataset.row, col: selected.dataset.col});
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
    appendMessage(data.username, data.message, data.userId === socket.id);
});

socket.on("note_update", ({row, col, notes}) => {
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) updateNotesInCell(cell, notes);
});

socket.on("note_clear", ({row, col}) => {
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        const notesDiv = cell.querySelector(".cell-notes");
        if (notesDiv) notesDiv.innerHTML = "";
    }
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
    if (cell) {
        const valDiv = cell.querySelector(".cell-value");
        valDiv.innerHTML = (number == 0) ? "" : number;
        if (number == 0) cell.querySelector(".cell-notes").innerHTML = "";
    }
})

socket.on("hint", ({row, col, solve}) => {
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
        const valDiv = cell.querySelector(".cell-value");
        valDiv.innerHTML = solve;
        valDiv.style.color = "green";
        valDiv.classList.add("hint-value");
        cell.style.fontWeight = "bolder"
        cell.classList.add("fixed"); 
        cell.style.cursor = "not-allowed";
        cell.classList.remove("highlighted")
        cell.querySelector(".cell-notes").innerHTML = "";
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