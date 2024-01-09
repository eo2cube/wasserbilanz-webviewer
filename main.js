import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import OSM from 'ol/source/OSM.js';
import View from 'ol/View.js';
import {fromLonLat} from 'ol/proj.js';

import proj4 from 'proj4';
import {register} from 'ol/proj/proj4.js';
import {get as getProjection} from 'ol/proj.js';

import LayerSwitcher from 'ol-layerswitcher';

import colormap from 'colormap';

import {addMeasureTool} from './measuretool.js';

proj4.defs('EPSG:32633', '+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs');
register(proj4);

// from https://openlayers.org/workshop/en/cog/colormap.html
function getColorStops(name, min, max, steps, reverse) {
    const delta = (max - min) / (steps - 1);
    const stops = new Array(steps * 2);
    const colors = colormap({colormap: name, nshades: steps, format: 'rgba'});
    if (reverse) {
        colors.reverse();
    }
    for (let i = 0; i < steps; i++) {
        stops[i * 2] = min + i * delta;
        stops[i * 2 + 1] = colors[i];
    }
    return stops;
}

let cogs = [];
for(var i = 160; i<=180; i++) {
    cogs.push(new TileLayer({
        title: 'Day '+i,
        visible: false,  
        source: new GeoTIFF({
            sources: [
                {
                    url: 'data/doy'+i+'-cog-georef.tif',
                    nodata: -9999,
                    min: 20,
                    max: 100
                },
            ],
            projection: getProjection('EPSG:32633'),
            normalize: false,
            interpolate: false,
        }),
        style: {
            color: [ 'case',
                ['==', ['band', 2], 0],
                '#00000000',
                [
                    'interpolate',
                    ['linear'],
                    ['band', 1],
                    // color ramp for NDVI values
                    ...getColorStops('viridis', 20, 100, 80, true),
                ],
            ]
        }
    }));
}

export function handleSlider(e) {
    let index = e.srcElement.value-160;
    // set to visible: the current layer (given by index), the basemap (always the first layer), and the drawn measurements (always the last layer)
    // and everything else to unvisible
    map.getLayers().forEach((e,i,a) => i==index+1 || i==0 || i==a.length-1 ? e.setVisible(true) : e.setVisible(false));
    document.getElementById('DOY').innerHTML = 'Day of year: ' + (index+160);
}
window.handleSlider = handleSlider;

const map = new Map({
  target: 'map',
  layers: [
      new TileLayer({
          source: new OSM(),
          title: 'OpenStreetMap',
          type: 'base'
      }),
      ...cogs  // spread out all the COGs from the array
  ],
  view: new View({
    center: fromLonLat([13.242731, 53.941841]), //fromLonLat([13.0328, 53.9071]),
    zoom: 15, //10,
  }),
});

addMeasureTool(map);

const layerSwitcher = new LayerSwitcher({
    reverse: false,
    groupSelectStyle: 'group'
});
map.addControl(layerSwitcher);
