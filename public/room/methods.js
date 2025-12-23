import {socket} from "./socket.js";
let selected;
let selected_f;
let roomId;

export const fetchRoomData = async() => {
    const res = await fetch("/api/room-info", {
        // method: "POST",
        // headers: {
        //     "Content-Type": "Aplication/json"
        // },
        // body: JSON.stringify({roomId})
    })
    if(res.status == 401) window.location.href = "/login"
    if(res.status == 404 || res.status == 403) window.location.href = "/";

    const {_id, name, difficulty, board, initial_data, users} = await res.json();
    roomId = _id.toString()
    createBoard(board, initial_data);

    const res2 = await fetch("/api/username",{
        method: "POST",
        headers:{
            "Content-Type": "Application/json"
        },
        body: JSON.stringify({users})
    })  
    const {userList} = await res2.json();
    renderUsers(name, userList, difficulty);
}

export const logout = async () => {
    try{
        await fetch("/api/leaveRoom");
        socket.emit("user_leave")
        window.location.href = "/"
    }catch(err){
        console.log(err)
    }
}

// ------------------------------------------------------------------------------------
const boardElement = document.getElementById("sudoku-board");

function createBoard(board, initial_data) {
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
            if(initial_data[row][col] == -1){
                cell.style.color = "green"
            }

            if (value !== 0) {
                cell.textContent = value;
            }

            // Useful metadata
            cell.dataset.row = row;
            cell.dataset.col = col;

            cell.style.userSelect = "none"
            cell.addEventListener("click", () => {
                if(cell.classList.contains("fixed")) return;
                if(selected) selected.classList.remove("highlighted");
                selected = cell;
                cell.classList.add("highlighted")
                socket.emit("click", {roomId, row,col});
            });

            boardElement.appendChild(cell);
        }
    }
}

function renderUsers(name, userList, difficulty) {
    const room = document.getElementById("roomname");
    room.innerHTML = `${name}(${difficulty})`

    const userListEl = document.getElementById("user-list");
    userListEl.innerHTML = "";
    // console.log(userList)
    userList.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user.username;
        if(user.user == "me"){
            li.style.backgroundColor = "green";
            li.id = "user"
        }
        else{
            if(user.socket) li.style.backgroundColor = "green"
            else li.style.backgroundColor = "red"
            li.id = "friend"
        }
        userListEl.appendChild(li);
    });
}

const numbers = document.querySelectorAll(".num-btn");
numbers.forEach(num => {
    num.addEventListener("click", () => {
        const number = num.dataset.value;   // tıklama anında num değerini alır !!!!
        if(!selected) return alert("Choose a cell!")
        const row  = selected.dataset.row;
        const col  = selected.dataset.col;
        selected.innerHTML = number;
        socket.emit("select_number", {row, col, number})
    })
});

window.addEventListener("keydown", (e) => {
    if (!selected) return;

    const row = selected.dataset.row;
    const col = selected.dataset.col;

    if (e.key >= '1' && e.key <= '9') {
        const number = e.key;
        selected.innerHTML = number;
        socket.emit("select_number", { row, col, number });
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        selected.innerHTML = "";
        socket.emit("select_number", { row, col, number: 0 });
    }
    else if (e.key == "Shift"){
        if(!selected) return alert("Choose a cell!")
        const row  = selected.dataset.row;
        const col  = selected.dataset.col;
        socket.emit("get_hint", {row,col});
    }
});

const hint = document.getElementById("hint-btn");
hint.addEventListener("click", () => {
    if(!selected) return alert("Choose a cell!")
    const row  = selected.dataset.row;
    const col  = selected.dataset.col;
    socket.emit("get_hint", {row,col});
})

// ------------------------------------------------------------------------------------
socket.on("connect", () => {
    console.log("Connected to socket:", socket.id);
});
socket.on("disconnect", () => {
    console.log("Disconnected from socket");
});

socket.on("user_online", () => {
    document.getElementById("friend").style.backgroundColor = "green";
})
socket.on("user_offline", () => {
    document.getElementById("friend").style.backgroundColor = "red";
})
socket.on("user_leave", () => fetchRoomData());
socket.on("user_join", () => fetchRoomData());


socket.on("click_update", ({row, col}) => {
    if(selected_f) selected_f.classList.remove("highlighted-friend");
    
    const cells = document.querySelectorAll(".sudoku-cell");
    cells.forEach(cell => {
        const r = cell.dataset.row;
        const c = cell.dataset.col;
    
        if (r == row && c == col) {
            cell.classList.add("highlighted-friend")
            selected_f = cell;
        }
    });
})

socket.on("select_update", ({row, col, number}) => {
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    cell.innerHTML = number;
})

socket.on("hint", ({row, col, solve}) => {
    const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
    cell.innerHTML = solve;
    cell.style.fontWeight = "bolder"
    console.log(solve)
    cell.style.color = "green";

    cell.classList.add("fixed"); 
    cell.style.cursor = "not-allowed";
    cell.classList.remove("highlighted")
    selected = null;
})

socket.on("success", () => {
    const container = document.querySelector(".sudoku-container");
    container.style.border = "5px solid green"
    alert("Tebrikler!")
})
socket.on("fail", () => {
    const container = document.querySelector(".sudoku-container");
    container.style.border = "8px solid red"
    setTimeout(() => {
        container.style.border = "3px solid black"
    }, 1000);
})