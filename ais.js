const WebSocket = require('ws');
const socket = new WebSocket("wss://stream.aisstream.io/v0/stream")

require('dotenv').config()

const startTime = Date.now();

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
  return {
    shipName: data.MetaData.ShipName,
    position: {
      lat: data.Message.PositionReport.Latitude,
      lon: data.Message.PositionReport.Longitude,
      course: data.Message.PositionReport.Cog,
      heading: data.Message.PositionReport.TrueHeading,
      speed: data.Message.PositionReport.Sog
    },
    mmsi: data.MetaData.MMSI,
    statusCode: data.Message.PositionReport.NavigationalStatus,
    statusString: statuses[data.Message.PositionReport.NavigationalStatus] 
  }
}

socket.onopen = function (_) {
  let subscriptionMessage = {
    Apikey: process.env.key,
    BoundingBoxes: [[[41.82721682934945, -87.68783550156897], [41.919265004847105, -87.5861481989418]]],
    //FiltersShipMMSI: ["366825870", "367152790"], // Optional!
    FilterMessageTypes: ["PositionReport"] // Optional!
  }
  socket.send(JSON.stringify(subscriptionMessage));

  console.log('API Initialized')

  setInterval(() => {
    const now = Date.now()
    const minutesSince = ((now - startTime) / (1000 * 60)).toFixed(2)

    console.log(`${minutesSince} since API initialization`)
  }, 30 * 1000)
};

socket.onmessage = function (event) {
  let aisMessage = JSON.parse(event.data)
  console.log(processMessageData(aisMessage))
};

socket.onclose = function (_) {
  console.log('aw poop :c')
}