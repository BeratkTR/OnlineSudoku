# Online Sudoku 
### Kullandığım API
- https://sudoku-api.vercel.app/

### Öğrenilenler
- "Kullanıcıdan gelen hiçbir veriye güvenme!!" (Backend'te kontrol yap)
- Tekrar tekrar clone'lama pull'la !!

#### Javascript
- e.key == " ", e.key == "0", e.key == "Backspace"
- <div data-value="10">  -->  x.dataset.value
- el.classList.add("fixed") -> başta kitler elementi,  data[row][col] != 0 -> sürekli check etme böyle

#### Websocket
- http: req.session,userId , websocket: socket.request.session.userId
- Client: connection > userJoined yollama --> Server: connection > userJoined emit'le otomatik ("socketsession")
