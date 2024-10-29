(function () {
  // map options
  const options = {
    zoomSnap: 0.1,
    center: [36.5, -83.5],
    zoom: 5.8,
  };

  // create the Leaflet map
  const map = L.map("map", options);

  L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}",
    {
      minZoom: 0,
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      ext: "png",
    }
  ).addTo(map);

  // load the data asynchronously
  async function fetchData() {
    const data = await d3.csv("data/Danville_Crashes_2019to2023.csv");
    const cityLimits = await d3.json("data/danville-city-limits.json");

    // sort through the csv data as it loads
    data.forEach((row) => {
      if (!["K", "A", "B", "C", "O"].includes(row.KABCO)) {
        row.KABCO = "O";
      }
    });

    // Add Danville polygons to the map
    const city = L.geoJSON(cityLimits, {
      style: function (feature) {
        return {
          color: "#6795f8", // Color of the polygon outline
          weight: 4,
          fillOpacity: 0, // Fill opacity
        };
      },
    }).addTo(map);

    // create bounds based on the city limits extent
    const bounds = L.latLngBounds(city.getBounds());

    // fit the data to the extent of the bounds
    map.fitBounds(bounds.pad(0.1));

    // add the crashes to the map
  }

  fetchData();
})();
