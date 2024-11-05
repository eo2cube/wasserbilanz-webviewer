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

function getSourceForDOY(doy) {
    return new GeoTIFF({
        sources: [
            {
                url: 'all/geotiff_NDVI_DOY/NDVI_DOY_'+doy+'.tif',
            },
        ],
        projection: getProjection('EPSG:32633'),
        //normalize: false,
        //interpolate: false,
    });
}

export function handleSlider(e) {
    let doy = e.srcElement.value;
    map.getLayers()
      //.filter((v,i,a) => i != 0 && i != a.length-1)
      //.forEach(e => e.set('source', getSourceForDOY(doy)));
      .forEach((e,i,a) => { if(i!=0 && i!=a.length-1) { e.set('source', getSourceForDOY(doy))}});
    document.getElementById('DOY').innerHTML = 'Day of year: ' + doy;
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
  ],
  view: new View({
    center: fromLonLat([13.242731, 53.941841]), //fromLonLat([13.0328, 53.9071]),
    zoom: 15, //10,
  }),
});

const layers = {
    ETc: "Verdunstungleistung der Pflanzen pro Tag [mm], d.h. die Anzahl der Liter Wasser, die pro Tag auf einem Quadratmeter verdunstet ist.",
    ETc_cumulated: "Verdunstungsleitung der Pflanzen kumuliert über die bisherige Vegetationsperiode [mm], d.h. die Anzahl Liter Wasser, die bisher pro Quadratmeter verdunstet ist.",
    ETc_precip: "Verdunstungsleistung der Pflanzen pro Tag [mm] abzüglich der Niederschlagshöhe [mm], d.h. die Differenz zwischen dem Niederschlagswasser und dem Verbrauch der Pflanze in Liter pro Tag und Quadratmeter.",
    ETc_precip_cumulated: "Verdunstungsleistung der Pflanzen pro Tag [mm] abzüglich der Niederschlagshöhe [mm] kumuliert über die Vegetationsperiode, d.h. die Differenz zwischen dem während der Vegetationsperiode gefallenen Niederschlag und dem Wasserverbrauch der Pflanze in Liter pro Quadratmeter.",
    Irrigation: "Beregnungshöhe pro Quadratmeter und Tag in Liter [mm].",
    Irrigation_cumulated: "Beregnungshöhe in Liter pro Quadratmeter [mm] während der bisherigen Vegetationsperiode.",
    Kc: "Kc-Wert pro Tag, d.h. der Pflanzenkoeffizient abhängig vom Entwicklungsstadium der Pflanzen und ihrer Pflanzdichte.",
    NDVI: "Normalized Difference Vegetation Index (NDVI) als Index, der mit der Pflanzenvitalität und -dichte korreliert.",
    precipitation: "Niederschlag in Liter je Quadratmeter [mm] und Tag.",
    precipitation_cumulated: "Kumulierte Niederschlagssumme während der Vegetationsperiode in Liter je Quadratmeter [mm].",
    waterbalance: "Klimatische Wasserbilanz des aktuellen Tages bestehend aus den Komponenten Niederschlag, Beregnung und Verdunstung in Liter je Quadratmeter [mm].",
    waterbalance_cumulated: "Kumulierte klimatische Wasserbilanz während der Vegetationsperiode bestehend aus den Komponenten Niederschlag, Beregnung und Verdunstung in Liter je Quadratmeter [mm]."
}

var layerForDataExtraction;

for (var name in layers) {
    console.log(name, layers[name]);
    let source = new GeoTIFF({
        sources: [
            {
                url: 'all/geotiff_'+name+'_DOY/'+name + '_DOY_154.tif',
                //min: 0, 
                //max: 1,
                //nodata: -9999,
            },
        ],
        projection: getProjection('EPSG:32633'),
        //normalize: false,
        //interpolate: false,
    });
    let layer = new TileLayer({
        title: name + ' <span style="font-size: smaller" title="' + layers[name] + '">ℹ️</span>',
        visible: false,
        source: source,
        style: {
            color: [ 'case',
                ['==', ['band', 2], 0],
                '#00000000',
                [
                    'interpolate',
                    ['linear'],
                    ['band', 1],
                    // color ramp for NDVI values
                    ...getColorStops(name=='Kc' || name=='NDVI' ? 'summer' : 'RdBu', 0, 1, 100, name=='ETc' || name=='ETc_cumulated' ? false : true),
                ],
            ]
        }
    });
    map.addLayer(layer);
    console.log(layer);
    if (name == 'precipitation') {
        layerForDataExtraction = layer;
    }
}

addMeasureTool(map);

const layerSwitcher = new LayerSwitcher({
    reverse: false,
    groupSelectStyle: 'group'
});
map.addControl(layerSwitcher);

function displayPixelValue(event) {
  const data = layerForDataExtraction.getData(event.pixel);
  console.log(data);
}
map.on(['pointermove', 'click'], displayPixelValue);
