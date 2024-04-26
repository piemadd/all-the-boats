const statusColors = {
  0: '#00a33c', //green
  1: '#b80425', //red
  2: '#b80425', //red
  3: '#b8a004', //yellow
  4: '#b8a004', //yellow,
  5: '#b80425', //red
  6: '#b80425', //red
  7: '#00a33c', //green
  8: '#00a33c', //green
  9: '#b80425', //red
  10: '#b80425', //red
  11: '#00a33c', //green
  12: '#00a33c', //green
  13: '#b80425', //red
  14: '#b80425', //red
  15: '#b80425', //red
}

var map = new maplibregl.Map({
  container: "map", // container id
  hash: "mapHash",
  style: mapStyle = {
    zoom: 0,
    pitch: 0,
    center: [41.884579601743276, -87.6279871036212],
    glyphs:
      "https://fonts.transitstat.us/_output/{fontstack}/{range}.pbf",
    sprite: "https://osml.transitstat.us/sprites/osm-liberty",
    layers: mapLayers, //layers("protomaps", "dark"),
    bearing: 0,
    sources: {
      protomaps: {
        type: "vector",
        tiles: [
          "https://tilea.transitstat.us/tiles/{z}/{x}/{y}.mvt",
          "https://tileb.transitstat.us/tiles/{z}/{x}/{y}.mvt",
          "https://tilec.transitstat.us/tiles/{z}/{x}/{y}.mvt",
          "https://tiled.transitstat.us/tiles/{z}/{x}/{y}.mvt",
        ],
        maxzoom: 15,
      }
    },
    version: 8,
    metadata: {},
  },
  center: [-95.9079205, 41.7751895],
  zoom: 4,
});

map.on('load', () => {
  map.addSource('boats', {
    "type": "geojson",
    "data": {
      type: "FeatureCollection",
      features: []
    }
  });

  map.addLayer({
    'id': 'boats',
    'type': 'circle',
    'source': 'boats',
    'paint': {
      'circle-color': ['get', 'color']
    }
  });

  const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false
  });

  map.on('mouseenter', 'boats', (e) => {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    const coordinates = e.features[0].geometry.coordinates.slice();
    const title = e.features[0].properties.title;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup.setLngLat(coordinates).setHTML(title).addTo(map);
  });

  map.on('mouseleave', 'boats', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });

  window.boats = {};

  const processData = (aisMessage) => {
    window.boats[aisMessage.shipName] = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [aisMessage.position.lon, aisMessage.position.lat]
      },
      "properties": {
        "id": aisMessage.mmsi,
        "title": aisMessage.shipName,
        "color": statusColors[aisMessage.statusCode]
      }
    }
  };

  const updateBoatsOnMap = () => {
    const features = Object.values(window.boats)
    map.getSource('boats').setData(
      {
        type: "FeatureCollection",
        features: features
      }
    )

    document.getElementById('info').innerText = `Total Count: ${features.length}`

    return;
  }

  fetch("https://atbs.pgm.sh")
  //fetch('http://localhost')
    .then((res) => res.json())
    .then((data) => {
      Object.values(data.boats).forEach((boat) => processData(boat));
      updateBoatsOnMap();
    })

  const socket = new WebSocket("wss://atbs.pgm.sh")
  //const socket = new WebSocket('ws://localhost:80')

  socket.onmessage = function (event) {
    const aisMessage = JSON.parse(event.data)

    processData(aisMessage);
    updateBoatsOnMap();
  };

  socket.onclose = function (_) {
    console.log('aw poop :c')
  }
})