import Draw from 'ol/interaction/Draw.js';
import Overlay from 'ol/Overlay.js';
import {Vector as VectorSource} from 'ol/source.js';
import {Vector as VectorLayer} from 'ol/layer.js';
import {getLength} from 'ol/sphere.js';
import {unByKey} from 'ol/Observable.js';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style.js';

export function addMeasureTool(map) {

    // Create and add layer that stores drawn lines
    const drawSource = new VectorSource();  // also needed in Draw interaction
    const drawLayer = new VectorLayer({
        source: drawSource,
        style: {
            'fill-color': 'rgba(255, 255, 255, 0.2)',  // subtle gray
            'stroke-color': '#ffcc33',  // orange
            'stroke-width': 2,
            'circle-radius': 7,
            'circle-fill-color': '#ffcc33',  // same orange
        },
    });
    map.addLayer(drawLayer);

    // Create and add Draw interaction
    let draw = new Draw({
        source: drawSource,
        type: 'LineString',
        style: new Style({
            fill: new Fill({
                color: 'rgba(255, 255, 255, 0.2)',
            }),
            stroke: new Stroke({  // dashed line while drawing
                color: 'rgba(0, 0, 0, 0.5)',
                lineDash: [10, 10],
                width: 2,
            }),
            image: new CircleStyle({
                radius: 5,
                stroke: new Stroke({
                    color: 'rgba(0, 0, 0, 0.7)',
                }),
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)',
                }),
            }),
        }),
    });
    map.addInteraction(draw);

    // These are used later in the event handlers, so they must be declared here
    let helpTooltipElement;
    let helpTooltip;
    let measureTooltipElement;
    let measureTooltip;

    // Create and add tooltip that says "Click to measure"/"Double-click to finish"
    function createHelpTooltip() {
        if (helpTooltipElement) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = document.createElement('div');
        helpTooltipElement.className = 'ol-tooltip hidden';
        helpTooltip = new Overlay({
            element: helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left',
        });
        map.addOverlay(helpTooltip);
    }
    createHelpTooltip();

    // Create and add tooltip that says "x meters" (code is similar to the one above but still significantly different)
    function createMeasureTooltip() {
        if (measureTooltipElement) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
        measureTooltip = new Overlay({
            element: measureTooltipElement,
            offset: [0, -15],
            positioning: 'bottom-center',
            stopEvent: false,
            insertFirst: false,
        });
        map.addOverlay(measureTooltip);
    }
    createMeasureTooltip();

    // Now register the event handlers

    let sketch;
    let listener;

    map.on('pointermove', function (evt) {
        if (evt.dragging) {
            return;
        }
        let helpMsg = sketch ? 'Double-click to finish' : 'Click to measure';
        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);
        helpTooltipElement.classList.remove('hidden');
    });

    map.getViewport().addEventListener('mouseout', function () {
        helpTooltipElement.classList.add('hidden');
    });

    draw.on('drawstart', function (evt) {
        sketch = evt.feature;  // set sketch
        listener = sketch.getGeometry().on('change', function (evt) {  // register another event handler within this event handler
            const geom = evt.target;
            measureTooltipElement.innerHTML = Math.round(getLength(geom)) + ' ' + 'm'
            measureTooltip.setPosition(geom.getLastCoordinate());
        });
    });

    draw.on('drawend', function () {
        measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
        measureTooltip.setOffset([0, -7]);
        sketch = null;  // unset sketch
        measureTooltipElement = null;  // unset tooltip so that a new one can be created
        createMeasureTooltip();  // create that new one
        unByKey(listener);  // unregister the event handler that was created within the other event handler
        helpTooltipElement.innerHTML = 'Click to measure';  // setup for next measurement
    });
    
}
