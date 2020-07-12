import express from 'express';
import http from 'http';
import socketIO, { Socket } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Collection for user cinnection
let users: { [key: string]: string } = {};

io.on('connection', (socket: Socket) => {
  if (users[socket.id] === undefined) {
    users[socket.id] = socket.id;
  }

  socket.emit("yourID", socket.id);
  io.sockets.emit("allUsers", users);

  // Delete usee when this is desconnected
  socket.on('disconnect', () => {
    delete users[socket.id];
  });

  // On call user
  socket.on('callUser', (data: any) => {
    io.to(data.userToCall).emit('hey',{
      signal: data.signalData,
      from: data.from
    });
  });

  // On acapt call
  socket.on('aceptCall', (data: any) => {
    io.to(data.to).emit('callAcepted', data.signal);
  })
})

server.listen(8000, () => console.log('Server is running')); 