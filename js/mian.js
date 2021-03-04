// 1.Create a map object and set the initial view point
var mymap = L.map('map', {
  center: [47.33, -121.93],
  zoom: 8,
  maxZoom: 10,
  minZoom: 3,
  zoomControl: false,
  detectRetina: true
});

var grayscale = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png').addTo(mysmap);
var streets = L.tileLayer('http://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}@2x.png').addTo(mysmap);
var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}@2x').addTo(mysmap);

var baseLayers = {
  'Grayscale': grayscale,
  'Streets': streets,
  'Satellite': satellite
};

L.control.layers(baseLayers, {
  collapsed: false,
  position: 'topright'
}).addTo(mymap);

new L.Control.Zoom({
   position: 'bottomright'
}).addTo(mymap);

// 3. Add a base map.
//  L.tileLayer('http://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}.png').addTo(mymap);

// 4. Declare three global variables for the wa counties thematic layer, bar chart, and the organized wa data.
var countiesLayer = null,
  bchart = null,
  counties = {};

// 5. load all datasets through promise mechnism and store them in an array
Promise.all([d3.json("assets/wacountydata.geojson")]).then(function(datasets) {
// or Promise.all([$.getJSON("assets/wacountydata.geojson")]).then(function(datasets) {
  // 6. Map relevant operations

  // 6.1 create a couties layer
  countiesLayer = L.geoJSON(datasets[0], {
    onEachFeature: onEachFeature,
    style: {
      fillOpacity: 0.4,
      weight: 1,
      opacity: 3,
      color: '#4E4C4C',
    }
  }).addTo(mymap);

  // 6.2 add three events to the the layer “countiesLayer”.
  function onEachFeature(feature, layer) {
    layer.on({
      mouseover: highlightFeature,
      click: clickFeature,
      mouseout: resetHighlight
    });
  }

  // 6.3 this function works when the mouse hovers over on a map feature.
  function highlightFeature(e) {
    // e indicates the current event
    var feature = e.target; //the target capture the object which the event associates with
    feature.setStyle({
      weight: 2,
      opacity: 0.8,
      color: '#e3e3e3',
      fillColor: '#00ffd9',
      fillOpacity: 0.1
    });
  }

  // 6.4 this function executes when the mouse clicks on a map feature.
  function clickFeature(e) {
    L.DomEvent.stopPropagation(e);
    $("#placename").text(e.target.feature.properties.NAME + " County");
    $("#county-count").text(e.target.feature.properties.CTNUM);
  }

  // 6.5 reset the hightlighted feature when the mouse is out of its region.
  function resetHighlight(e) {
    countiesLayer.resetStyle(e.target);
  }

  // 6.6 bind the onMapClick function to the mymap object.
  mymap.on('click', onMapClick);
  // when click on any place on the map expect the counties layer, the text on the sidebar will be reset to the total number of WA.
  function onMapClick(e) {
    $("#placename").text("Washington");
    $("#county-count").text("341");
  }

  // 7 Chart relevant operations

  // 7.1 generate the declared dictionary object "counties".
  // add the county name as key and the number of cell tower as values in a dictionary declared before
  datasets[0].features.forEach(function(d) {
    counties[d.properties.NAME] = d.properties.CTNUM;
  })

  // 7.2 this function take a dictionary, return a dictionary that sorted by the number of cell towers.
  function sortJsObject(obj) {
    items = Object.keys(obj).map(function(key) {
      return [key, obj[key]];
    });
    items.sort(function(first, second) {
      return second[1] - first[1];
    });
    sorted_obj = {}
    $.each(items, function(k, v) {
      use_key = v[0]
      use_value = v[1]
      sorted_obj[use_key] = use_value
    })
    return (sorted_obj)
  }
  // 7.3 execute the sortJsObject function
  counties_sorted = sortJsObject(counties);

  // 7.4 slicing the arrays
  // only keep the top 10 values, and push “county” to the first of the array.
  x = Object.keys(counties_sorted).slice(0, 10);
  x.reverse();
  x.push("county");
  x.reverse();

  // only keep the top 10 values, and push “#” to the first of the array.
  y = Object.values(counties_sorted).slice(0, 10);
  y.reverse();
  y.push("#");
  y.reverse();


  // 7.5 generate the chart
  bchart = c3.generate({
    size: {
      height: 350,
      width: 460
    },
    data: {
      x: 'county',
      columns: [x, y], //input the x - sorted county number, y - the corresponding # of cell towers.
      type: 'bar', //a bar chart
      onclick: function(d) { // update the map and sidebar once the bar is clicked.
        var countyName = x[d.x + 1];


        //display the onclick feature's name to the tag with id 'placename' and 'county-count'on dashboard

        $("#placename").text(countyName + " County");
        $("#county-count").text(counties[countyName]);


        datasets[0].features.forEach(function(t) {
          if (t.properties.NAME == countyName) {
            countybound = L.geoJSON(t);
            mymap.fitBounds(countybound.getBounds());
            mymap.setZoom(12);
          }
        });
      }
    },
    axis: {
      x: { //county
        type: 'category',
        tick: {
          rotate: -60,
          multiline: false
        }
      },
      y: { //count
        tick: {
          values: [5, 10, 15, 20, 25, 30]
        },
      }
    },
    legend: {
      show: false
    },
    bindto: "#county-chart" //bind the chart to the place holder element "county-chart".
  });
});
