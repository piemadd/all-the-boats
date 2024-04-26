const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;

const server = new WebSocketServer({ port: 3001 });
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream")

require('dotenv').config()

let sendCount = 0;

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
    sendCount = 0;
  }, 5000)
};

socket.onmessage = function (event) {
  //let aisMessage = JSON.parse(event.data)
  //console.log(processMessageData(aisMessage))

  //console.log(`Sending ${event.data}`)

  //console.log('sending')

  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(event.data.toString('utf8'));
      sendCount++;
    } else {
      console.log('Socket is not OPEN')
    }
  });
};

socket.onclose = function (_) {
  console.log('aw poop :c')
}