const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;
const { createServer } = require('http');

let stats = {
  sendCount: 0,
  perSecond: 0,
}

let sendCount = 0;

const requestListener = ((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.writeHead(200);
  res.end(JSON.stringify(stats));
});

const server = createServer(requestListener);
const wss = new WebSocketServer({ noServer: true });
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream")

require('dotenv').config()

server.on('upgrade', function upgrade(request, socket, head) {
  wss.handleUpgrade(request, socket, head, function done(ws) {
    wss.emit('connection', ws, request);
  });
});

socket.onopen = function (_) {
  let subscriptionMessage = {
    Apikey: process.env.key,
    //BoundingBoxes: [[[41.487257103013874, -88.13593909680387], [42.11272086777214, -87.30558780843432]]], //chicagoland
    BoundingBoxes: [[[18.701364353993327, -125.22055064144826], [47.746510317565416, -58.22518318121378]]], //usa
    //BoundingBoxes: [[[-90, -180], [90, 180]]], //world
    //FiltersShipMMSI: ["366825870", "367152790"], // Optional!
    FilterMessageTypes: ["PositionReport", "ExtendedClassBPositionReport", "StandardClassBPositionReport"] // Optional!
  }
  socket.send(JSON.stringify(subscriptionMessage));

  console.log('API Initialized')

  setInterval(() => {
    console.log(`Sent ${sendCount} messages (${(sendCount / 5).toFixed(2)}/s)`)
    stats.sendCount += sendCount;
    stats.perSecond = Number((sendCount / 5).toFixed(2));
    sendCount = 0;
  }, 5000)
};

socket.onmessage = function (event) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(event.data.toString('utf8'));
      sendCount++;
    } else {
      console.log('Socket is not OPEN')
    }
  });
};

socket.onclose = function (_) {
  console.log('Connection closed from aisstream')
}

server.listen(80);