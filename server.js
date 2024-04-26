const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;
const { createServer } = require('http');

let stats = {
  sendCount: 0,
  perSecond: 0,
}

let boats = {};

let sendCount = 0;

const requestListener = ((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.writeHead(200);
  res.end(JSON.stringify({
    stats,
    boats
  }));
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

const statuses = {
  0: 'Under way using engine',
  1: 'Anchored',
  2: 'Not under command',
  3: 'Has restricted maneuverability',
  4: 'Ship draught is limiting its movement',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in fishing',
  8: 'Under way sailing',
  9: '(Number reserved for modifying reported status of ships carrying dangerous goods/harmful substances/marine pollutants)',
  10: '(Number reserved for modifying reported status of ships carrying dangerous goods/harmful substances/marine pollutants)',
  11: 'Power-driven vessel towing astern',
  12: 'Power-driven vessel pushing ahead/towing alongside',
  13: '(Reserved for future use)',
  14: 'Any of the following are active: AIS-SART (Search and Rescue Transmitter), AIS-MOB (Man Overboard), AIS-EPIRB (Emergency Position Indicating Radio Beacon)',
  15: 'undefined'
}

const processMessageData = (data) => {
  const processed = {
    shipName: data.MetaData.ShipName,
    position: {
      lat: data.Message[data.MessageType].Latitude,
      lon: data.Message[data.MessageType].Longitude,
      course: data.Message[data.MessageType].Cog,
      heading: data.Message[data.MessageType].TrueHeading,
      speed: data.Message[data.MessageType].Sog
    },
    mmsi: data.MetaData.MMSI,
    statusCode: data.Message[data.MessageType].NavigationalStatus,
    statusString: statuses[data.Message[data.MessageType].NavigationalStatus]
  }

  /*
  boats[processed.shipName] = {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": [processed.position.lon, processed.position.lat]
    },
    "properties": {
      "id": processed.mmsi,
      "title": processed.shipName,
      "color": statusColors[processed.statusCode]
    }
  }
  */
  boats[processed.shipName] = processed;

  return processed;
};

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
  const processed = processMessageData(JSON.parse(event.data));

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(processed));
      sendCount++;
    } else {
      console.log('Socket is not open')
    }
  });
};

socket.onclose = function (_) {
  console.log('Connection closed from aisstream')
}

server.listen(80);