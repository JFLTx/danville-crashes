(function () {
  // Define layer properties
  const layerProps = [
    {
      id: "K",
      text: "Fatal Crash",
      color: "#0f4264",
      size: 12,
      checked: true,
    },
    {
      id: "A",
      text: "Serious Injury Crash",
      color: "#236d99",
      size: 10,
      checked: true,
    },
    {
      id: "B",
      text: "Minor Injury Crash",
      color: "#3db7e8",
      size: 7.5,
      checked: true,
    },
    {
      id: "C",
      text: "Possible Injury Crash",
      color: "#bce5f6",
      size: 6,
      checked: true,
    },
    {
      id: "O",
      text: "Property Damage Only",
      color: "#f0faff",
      size: 4,
      checked: true,
    },
  ];

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

  // create Leaflet panes for ordering map layers
  setPanes = ["bottom", "middle", "top"];
  setPanes.forEach((pane, i) => {
    map.createPane(pane);
    map.getPane(pane).style.zIndex = 401 + i;
  });

  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Imagery &copy; Esri",
    }
  ).addTo(map);

  // labels for map
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Developed by Palmer Engineering',
      pane: "top",
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
    showSpinner();

    // Load the data
    const data = await d3.csv("data/Danville_Crashes_2019to2023_updated.csv");
    const cityLimits = await d3.json("data/danville-city-limits.json");

    // Initialize crashLayers and layersLabels before using them
    const crashLayers = {};
    const layersLabels = {};

    const city = L.geoJSON(cityLimits, {
      style: function (feature) {
        return {
          color: "#ffffff",
          weight: 4,
          fillOpacity: 0,
        };
      },
    }).addTo(map);

    // Define Manner of Collision Mapping
    const mannerOfCollisionMapping = {
      1: "ANGLE",
      2: "BACKING",
      3: "HEAD ON",
      4: "OPPOSING LEFT TURN",
      5: "REAR END",
      6: "REAR TO REAR",
      7: "SIDESWIPE-OPPOSITE DIRECTION",
      8: "SIDESWIPE-SAME DIRECTION",
      9: "SINGLE VEHICLE",
    };

    // Initialize crashLayers and layersLabels with layerProps
    layerProps.forEach((prop) => {
      crashLayers[prop.id] = L.layerGroup().addTo(map);

      layersLabels[
        `<span class="legend-text" style="color: ${prop.color};">${prop.text}</span>`
      ] = crashLayers[prop.id];
    });

    // Process the data
    data.forEach((row) => {
      if (!["K", "A", "B", "C", "O"].includes(row.KABCO)) {
        row.KABCO = "O";
      }
      // Check MannerofCollisionCode and map or set to UNKNOWN
      if (mannerOfCollisionMapping[row.MannerofCollisionCode]) {
        row.MannerofCollisionCode =
          mannerOfCollisionMapping[row.MannerofCollisionCode];
      } else {
        row.MannerofCollisionCode = "UNKNOWN";
      }

      // Define factors to check
      const factorsToCheck = [
        "Motorcyclist",
        "CommercialVehicle",
        "YoungDriver",
        "MatureDriver",
        "Pedestrian",
        "Bicyclist",
        "Distracted",
        "Aggressive",
        "Impaired",
        "Unrestrain",
        "MedXover",
      ];

      // Collect factors with a value of 1
      const factors = factorsToCheck.filter((factor) => row[factor] === "1");

      const lat = parseFloat(row.Latitude);
      const lng = parseFloat(row.Longitude);
      const kabco = row.KABCO;

      if (isNaN(lat) || isNaN(lng)) return;

      const layerProp = layerProps.find((p) => p.id === kabco);
      if (!layerProp) return;

      // Create the popup content
      const popupContent = `
        <u>MasterFile</u>: ${row.MasterFile}<br>
        <u>KABCO</u>: ${layerProp.text}<br>
        <u>Manner of Collision</u>: ${row.MannerofCollisionCode}<br>
        <u>Factors</u>: ${factors.length > 0 ? factors.join(", ") : "None"}
      `;

      const marker = L.circleMarker([lat, lng], {
        radius: layerProp.size,
        fillColor: layerProp.color,
        color: "#444",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1,
        zIndex: 2000,
      });

      marker.bindPopup(popupContent);

      crashLayers[kabco].addLayer(marker);
    });

    // Add the legend control to the map
    const legendControl = L.control.layers(null, layersLabels, {
      collapsed: false, // Ensure legend starts expanded on larger screens
    });

    // Add the legend to the map
    legendControl.addTo(map);

    // Dynamically manage legend visibility based on screen size
    function legendDisplay() {
      const legendContainer = document.querySelector(".leaflet-control-layers");
      const legendContent = legendContainer.querySelector(
        ".leaflet-control-layers-list"
      );

      // Check if the toggle button already exists
      let toggleButton = legendContainer.querySelector(".toggle-legend-btn");

      if (window.innerWidth <= 768) {
        legendContent.style.display = "none";

        // If the button doesn't already exist, create it
        if (!toggleButton) {
          toggleButton = document.createElement("button");
          toggleButton.className =
            "btn btn-primary float-end toggle-legend-btn";
          toggleButton.textContent = "Show Legend";

          // Insert the button before the legend content
          legendContainer.insertBefore(toggleButton, legendContent);

          // Add toggle functionality for smaller screens
          toggleButton.addEventListener("click", () => {
            const isVisible = legendContent.style.display !== "none";
            legendContent.style.display = isVisible ? "none" : "block";
            toggleButton.textContent = isVisible
              ? "Show Legend"
              : "Hide Legend";
          });
        }
      } else {
        // For larger screens, always show the legend and remove the button if it exists
        legendContent.style.display = "block";
        if (toggleButton) {
          toggleButton.remove();
        }
      }

      // Prevent map interaction when using the legend
      L.DomEvent.disableScrollPropagation(legendContainer);
      L.DomEvent.disableClickPropagation(legendContainer);
    }

    // Call the function on initial load
    legendDisplay();

    // Reapply on window resize to handle dynamic screen changes
    window.addEventListener("resize", () => {
      legendDisplay();
    });

    hideSpinner();
  }

  fetchData();
})();
