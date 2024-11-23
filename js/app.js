(function () {
  // Define layer properties
  const layerProps = [
    {
      id: "K",
      text: "Fatal Crash",
      color: "#330601",
      size: 12,
      checked: true,
    },
    {
      id: "A",
      text: "Serious Injury Crash",
      color: "#8c1001",
      size: 10,
      checked: true,
    },
    {
      id: "B",
      text: "Minor Injury Crash",
      color: "#fc1d03",
      size: 7.5,
      checked: true,
    },
    {
      id: "C",
      text: "Possible Injury Crash",
      color: "#fc9083",
      size: 6,
      checked: true,
    },
    {
      id: "O",
      text: "Property Damage Only",
      color: "#fae1de",
      size: 4,
      checked: true,
    },
  ];

  // Define common marker styles
  const commonStyles = {
    weight: 1,
    stroke: 0.5,
    fillOpacity: 1,
  };

  // HTML page settings
  const spinner = document.querySelector(".spinner-container");

  // Map options
  const options = {
    zoomSnap: 0.1,
    center: [37.62092, -84.75305],
    zoom: 18,
  };

  // Create the Leaflet map
  const map = L.map("map", options);

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution:
        "Tiles &copy; Esri | Developed by Palmer Engineering",
    }
  ).addTo(map);

  // Function to show the spinner
  function showSpinner() {
    spinner.style.display = "flex"; // Show the spinner
  }

  // Function to hide the spinner
  function hideSpinner() {
    spinner.style.display = "none"; // Hide the spinner
  }

  // Load the data asynchronously
  async function fetchData() {
    // Let the user know the data is loading
    showSpinner();

    // Load the data
    const data = await d3.csv("data/Danville_Crashes_2019to2023.csv");
    const cityLimits = await d3.json("data/danville-city-limits.json");

    // Process the CSV data
    data.forEach((row) => {
      if (!["K", "A", "B", "C", "O"].includes(row.KABCO)) {
        row.KABCO = "O";
      }
      if (
        !row.MannerofCollision_Real ||
        row.MannerofCollision_Real.trim() === ""
      ) {
        row.MannerofCollision_Real = "UNKNOWN";
      }
    });

    // Add Danville polygons to the map
    const city = L.geoJSON(cityLimits, {
      style: function (feature) {
        return {
          color: "#ffffff", // Color of the polygon outline
          weight: 4,
          fillOpacity: 0, // Fill opacity
        };
      },
    }).addTo(map);

    // Create crash layers
    const crashLayers = {};

    layerProps.forEach((prop) => {
      crashLayers[prop.id] = L.layerGroup().addTo(map); // Create layer groups
    });

    data.forEach((row) => {
      const lat = parseFloat(row.Latitude);
      const lng = parseFloat(row.Longitude);
      const kabco = row.KABCO;

      if (isNaN(lat) || isNaN(lng)) return; // Skip invalid coordinates

      const layerProp = layerProps.find((p) => p.id === kabco);
      if (!layerProp) return; // Skip unconfigured KABCO values

      const marker = L.circleMarker([lat, lng], {
        radius: layerProp.size,
        fillColor: layerProp.color,
        color: "#000",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0.8,
      });

      marker.bindTooltip(
        `<strong>MasterFile</strong>: ${row.MasterFile}<br>
         <strong>KABCO</strong>: ${row.KABCO}<br>
         <strong>Manner of Collision</strong>: ${row.MannerofCollision_Real}`
      );

      crashLayers[kabco].addLayer(marker); // Add marker to the appropriate layer group
    });

    hideSpinner(); // Hide the spinner once data is loaded
  }

  fetchData();
})();
