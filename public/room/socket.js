export const socket = io(
    // "http://10.60.117.83:3000", 
    {
    withCredentials: true
});


// // Emitter ==============================
// export function click({row,col}){
//     socket.emit("click", {row,col})
// }

// // Listener ===============================
// export function onClick(){
//     socket.on("click_update", () => {
        
//     })
// }

// export function onUpdate({row, col, number}){

// }
