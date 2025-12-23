const socket = io({
    withCredentials: true
});

const fetchUser = async() => {
    const res = await fetch("/api/user-info");
    if(res.status == 401) window.location.href = "/login"
    
    const usernameEl = document.getElementById("username");
    const user = await res.json();
    usernameEl.innerHTML = user.username;
    // if(user.active_room) window.location.href =  "/room/" + user.active_room;
    if(user.active_room) window.location.href =  "/room";
}

async function fetchRooms() {
  try {
    const res = await fetch("/api/rooms");
    const rooms = await res.json();
    renderRooms(rooms);

  } catch (err) {
    console.error(err);
  }
}

function renderRooms(rooms) {
  const container = document.querySelector(".rooms");
  container.innerHTML = "";

  if (rooms.length === 0) {
    container.innerHTML = "<p>No rooms available</p>";
    return;
  }

  rooms.forEach(room => {
    const div = document.createElement("div");
    div.className = "room";

    div.innerHTML = `
      <span class="room-name">${room.name}</span>
      <span class="tag ${room.difficulty}">
      ${room.difficulty}
      </span>
      <span class="room-users">${room.users.length}/2</span>
      <button onClick=joinRoom("${room._id}") ${room.users.length==2 ? "disabled" : ""}>Join</button>
    `;

    container.appendChild(div);
  });
}
const logout = () => {
    localStorage.removeItem("username");
    window.location.href = "login";
}


const modal = document.getElementById("modalOverlay");
const createRoomBtn = document.getElementById("createRoomBtn");
const cancelBtn = document.getElementById("cancelBtn");
const createBtn = document.getElementById("createBtn");
const errorEl = document.getElementById("error")

createRoomBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

cancelBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

createBtn.addEventListener("click", async () => {
  const name = document.getElementById("roomName").value.trim();
  const difficulty = document.getElementById("roomDifficulty").value;

  if (!name) {
    alert("Room name is required");
    return;
  }

  try {
    const res = await fetch("/api/createRoom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, difficulty })
    });

    // if (!res.ok) {
    //   throw new Error("Failed to create room");
    // }
    if(res.status == 409){
        errorEl.hidden = false;
        errorEl.innerHTML = res.statusText;
        return;
    }

    const data = await res.json();    
    const roomId = data._id.toString();

    modal.classList.add("hidden");
    // document.getElementById("roomName").value = "";
    // fetchRooms(); // odaları yeniden çek
    // window.location.href = "/room/" + roomId;
    window.location.href = "/room";

  } catch (err) {
    alert(err.message);
  }
});

const joinRoom = async(roomId) =>  {
    const res = await fetch("/api/joinRoom", {
        method: "POST",
        headers:{
            "Content-Type": "Application/json"
        },
        body: JSON.stringify({roomId})
    })
    if(res.status == 409) return alert("Room is full");
    // socket.emit("user_join");  // Henüz istek sunucuya gidip odaya katılma gerçekleşmedi
    window.location.href = "/room"
}


document.addEventListener("DOMContentLoaded", fetchUser);
document.addEventListener("DOMContentLoaded", fetchRooms);




