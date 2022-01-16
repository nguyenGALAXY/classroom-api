import io from 'socket.io'
import debug from 'src/utils/debug'

let socketServer
let clients = []

export const initSocket = (server) => {
  socketServer = new io.Server(server, {
    cors: {
      origin: '*',
    },
  })

  socketServer.on('connection', (connection) => {
    debug.log('socket', 'New connection')
    connection.on('new-user', (userId) => {
      const newConnection = {
        userId,
        clientId: connection.id,
        client: connection,
      }
      clients.push(newConnection)
    })

    connection.on('disconnect', (data) => {
      clients = clients.filter((c) => c.clientId != connection.id)
    })
  })
}

const notifyClient = (userId) => {
  for (let i = 0, len = clients.length; i < len; ++i) {
    let c = clients[i]
    if (c.userId == userId) {
      socketServer.to(c.clientId).emit('notify', 'new notify')
    }
  }
}

const notifyMultipleClients = (userIds = []) => {
  const randomRoom = Math.random().toString()
  for (let i = 0, len = clients.length; i < len; ++i) {
    let c = clients[i]
    if (userIds.includes(c.userId)) {
      c.client.join(randomRoom)
    }
    socketServer.in(randomRoom).emit('notify', 'new notify')
    socketServer.in(randomRoom).socketsLeave(randomRoom)
  }
}

export default {
  socketServer,
  notifyClient,
  notifyMultipleClients,
}
