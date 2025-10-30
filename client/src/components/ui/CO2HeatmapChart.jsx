import React, { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";
import { scaleSequential } from "d3-scale";
import { interpolateReds } from "d3-scale-chromatic";

// World Atlas TopoJSON (numeric ISO codes)
const TOPO_JSON_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Minimal mapping of alpha-3 to numeric ISO (extend as needed)
const alpha3ToNumeric = {
  USA: "840",
  CHN: "156",
  IND: "356",
  RUS: "643",
  BRA: "076",
  // add more country codes if needed
};

const CO2HeatmapChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/api/global-sustainability") // your backend
      .then((res) => res.json())
      .then((res) => setData(res.charts.globalCO2Heatmap))
      .catch((err) => console.error(err));
  }, []);

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const colorScale = scaleSequential()
    .domain([0, maxValue])
    .interpolator(interpolateReds);

  // Match numeric topojson id with World Bank alpha-3 code
  const getCO2ByNumericId = (id) => {
    const country = data.find(
      (c) => alpha3ToNumeric[c.countryCode] === id
    );
    return country ? country.value : 0;
  };

  return (
    <ComposableMap>
      <Geographies geography={TOPO_JSON_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const value = getCO2ByNumericId(geo.id);
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={value ? colorScale(value) : "#EEE"}
                stroke="#999"
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
};

export default CO2HeatmapChart;