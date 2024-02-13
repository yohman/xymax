mapboxgl.accessToken = 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw';
var building_layer_id = 'building-layer' 
var selectedvar = '事務所建築物'; // Default selected value
var extrusionHeight = 10; // Default extrusion height
var mapStyle = 'mapbox://styles/mapbox/satellite-streets-v11'; // Default map style
var selectedyear = '2016'; // Default selected year

const map = new mapboxgl.Map({
	container: 'map',
	// style: mapStyle,
	center: [139.6917, 35.6895],
	zoom: 10,
	// pitch: 45, // Set the pitch angle to make it a 3D map
	// bearing: -17.6 // Set the bearing angle for a better perspective
});

function changeMapStyle(style) {
	map.setStyle(style);
}

document.getElementById('dropdown').addEventListener('change', function() {
	selectedvar = this.value;
	updateExtrusionLayer_diff();
	labelMinMax();
	addChart();
});

document.getElementById('extrusion-slider').addEventListener('input', function() {
	max_bin_val = parseInt(this.value);
	updateExtrusionLayer_diff();
	updateLegend();
});

document.getElementById('style-selector').addEventListener('change', function() {
	map.setStyle(this.value);
	
	
});

// create a function to change the year
function changeYear(year) {
	selectedyear = year;
	console.log(selectedyear);
	// change the class of the year buttons from active to inactive according to the selected year
	if (selectedyear == '2011') {
		document.getElementById('button-2011').className = 'active';
		document.getElementById('button-2016').className = 'inactive';
	} else {
		document.getElementById('button-2011').className = 'inactive';
		document.getElementById('button-2016').className = 'active';
	}
	// update the extrusion layer
	updateExtrusionLayer();
}

var popup = new mapboxgl.Popup({
	className: 'popup',
	closeButton: false,
	closeOnClick: false
});

var colors = ['rgba(165,0,38,0.8)', 'rgba(248,139,81,0.8)', 'rgba(253,254,186,0.8)', 'rgba(113,193,100,0.8)', 'rgba(0,104,55,0.8)'];

function updateLegend(){

	// getdocumentid legend1, legend2 and legend3, and update their background color
	document.getElementById('legend1').style.backgroundColor = colors[0];
	document.getElementById('legend2').style.backgroundColor = colors[2];
	document.getElementById('legend3').style.backgroundColor = colors[4];
	// set the text of the legend to the max_bin_val
	document.getElementById('legend1').innerHTML = -max_bin_val + ' (decrease)';
	document.getElementById('legend2').innerHTML = 0 + ' (no change)';
	document.getElementById('legend3').innerHTML = max_bin_val + ' (increase)';


}

map.on('load', function () {
	console.log('loading map...');

	updateLegend();

	map.addSource('my-data', {
		type: 'geojson',
		// data: 'data/mesh2011_2016.geojson'
		data: 'data/mesh2011_2016_diff.geojson'
		// data: 'data/mesh2011.geojson'
	});
	
	map.addLayer({
		id: building_layer_id,
		// type: 'fill-extrusion',
		type: 'fill',
		source: 'my-data',
		slot: 'top'
	});

	map.addLayer({
		id: 'mesh-borders',
		type: 'line',
		source: 'my-data',
		layout: {},
		paint: {
			'line-color': '#666',
			'line-width': 0.2
		},
		slot: 'top'

	});



	map.on('mousemove', building_layer_id, (e) => {
		if (e.features.length > 0) {

			map.getCanvas().style.cursor = 'pointer';

			value_2011 = e.features[0].properties['2011_'+selectedvar];
			value_2016 = e.features[0].properties['2016_'+selectedvar];
			value_diff = value_2016 - value_2011;

			if (value_2011 > value_2016) {
				popup_html = '<div style="text-align:center"><b style="color:'+colors[0]+';font-size:2rem">⬇︎' + value_diff + '</b><table width=100%><tr><td>2011</td><td>→</td><td><b>'  + value_2011 + '</td></tr><tr><td>2016</td><td>→</td><td><b>' + value_2016 + '</td></tr></table>'+selectedvar+'</div>';
			} 
			else if (value_2011 == value_2016) {
				popup_html = '<div style="text-align:center"><b style="color:gray;font-size:2rem">' + value_diff + '</b><table width=100%><tr><td>2011</td><td>→</td><td><b>'  + value_2011 + '</td></tr><tr><td>2016</td><td>→</td><td><b>' + value_2016 + '</td></tr></table>'+selectedvar+'</div>';
			}
			else {
				popup_html = '<div style="text-align:center"><b style="color:'+colors[4]+';font-size:2rem">⬆︎' + value_diff + '</b><table width=100%><tr><td>2011</td><td>→</td><td><b>'  + value_2011 + '</td></tr><tr><td>2016</td><td>→</td><td><b>' + value_2016 + '</td></tr></table>'+selectedvar+'</div>';
			}
			

			popup.setLngLat(e.lngLat)
				.setHTML(popup_html)
				.addTo(map);

			

		}
	});
		
	// When the mouse leaves the state-fill layer, update the feature state of the
	// previously hovered feature.
	map.on('mouseleave', 'building_layer_id', () => {
		map.getCanvas().style.cursor = '';
		popup.remove();
	});


	updateExtrusionLayer_diff();
	// execute this function 1 second after the map is loaded
	setTimeout(labelMinMax, 1000);
	setTimeout(addChart, 1000);
	// labelMinMax();


});

function updateExtrusionLayer() {
	console.log(selectedyear+'_'+selectedvar);
	map.setPaintProperty(building_layer_id, 'fill-extrusion-color', [
		'interpolate',
		['linear'],
		['get', selectedyear+'_'+selectedvar],
		0, 'rgba(0,255,0, 0.7)',
		500, 'rgba(255,0,0, 0.7)'
	]);

	map.setPaintProperty(building_layer_id, 'fill-extrusion-height', ['*', ['get', selectedyear+'_'+selectedvar], extrusionHeight]);
	map.setPaintProperty(building_layer_id, 'fill-extrusion-opacity', 0.8);


}

var max_bin_val = 20;

var minPopup = document.createElement('div');
var maxPopup = document.createElement('div');

function labelMinMax() {

	// Add a popup to the polygon that has the highest value of the selected variable
	const features = map.queryRenderedFeatures({ layers: ['mesh-borders'] });

	// find highest value
	let maxVal = -Infinity;
	let maxFeature = null;
	for (const feature of features) {
		// console.log(feature.properties);
		const value = feature.properties[selectedvar+'_diff'];
		if (value > maxVal) {
			maxVal = value;
			maxFeature = feature;
		}
	}

	// find lowest value
	let minVal = Infinity;
	let minFeature = null;
	for (const feature of features) {
		const value = feature.properties[selectedvar+'_diff'];
		if (value < minVal) {
			minVal = value;
			minFeature = feature;
		}
	}

	// ------------------------------------------------
	// create a custom popup for MAX
	// ------------------------------------------------
	maxPopup.className = 'custom-popup';
	maxPopup.style.backgroundColor = colors[4];
	maxPopup.innerHTML = '<div style="text-align:center;">⬆︎' + maxVal + '</div>';

	// calculate the center of maxFeature
	var maxcenter = turf.center(maxFeature);

	// Position the custom popup on the map
	var maxpopupCoordinates = maxcenter.geometry.coordinates; 
	
	// Add the custom popup to the map
	var popupElement = new mapboxgl.Marker(maxPopup)
	  .setLngLat(maxpopupCoordinates)
	  .addTo(map);

	// ------------------------------------------------
	// create a custom popup for MIN
	// ------------------------------------------------
	minPopup.className = 'custom-popup';
	minPopup.style.backgroundColor = colors[0];
	minPopup.innerHTML = '<div style="text-align:center;">⬇︎' + minVal + '</div>';

	// calculate the center of minFeature
	var mincenter = turf.center(minFeature);

	// Position the custom popup on the map
	var minpopupCoordinates = mincenter.geometry.coordinates; 
	
	// Add the custom popup to the map
	var popupElement = new mapboxgl.Marker(minPopup)
	  .setLngLat(minpopupCoordinates)
	  .addTo(map);

	  

	// var minPopup = document.createElement('div');
	// minPopup.className = 'custom-popup';
	// minPopup.style.backgroundColor = colors[0];
	// minPopup.innerHTML = '<div style="text-align:center;">⬇︎' + minVal + '</div>';

	// console.log(minFeature.geometry);
	// // calculate the center of maxFeature
	// var mincenter = turf.center(minFeature);

	// // Position the custom popup on the map
	// var minpopupCoordinates = mincenter.geometry.coordinates; 
	
	// // Add the custom popup to the map
	// var popupElement = new mapboxgl.Marker(minPopup)
	//   .setLngLat(minpopupCoordinates)
	//   .addTo(map);


	  
}

function updateExtrusionLayer_diff() {

	console.log('updateExtrusionLayer_diff');
	console.log(building_layer_id);
	map.setPaintProperty(building_layer_id, 'fill-color', [
		'interpolate',
		['linear'],
		// ['get', selectedyear+'_'+selectedvar],
		['get', selectedvar+'_diff'],
		
		-max_bin_val, colors[0],
		-max_bin_val/2, colors[1],
		0, colors[2],
		max_bin_val/2, colors[3],
		max_bin_val, colors[4]
	]);


}

function makeBox(num) {
	var box = '';

	if (num === 0) {
		box += '<span style="background-color:gray;border:1px solid white;width:25px;height:25px;font-size:0.6em;color:white;display:inline-block;line-height:25px;text-align:center;"></span>';
	} else {
		for (var i = 0; i < num; i++) {
			box += '<span style="background-color:red;border:1px solid white;width:25px;height:25px;font-size:0.6em;color:white;display:inline-block;line-height:25px;text-align:center;">50</span>';
		}
	}
	return box;
}


// ------------------------------------------------
// function to access info-panel and add a chart
// ------------------------------------------------

// create a line array
var lineArray = [];
// create a key_code array
var key_codeArray = [];

function addChart() {
	// clear the arrays
	lineArray = [];
	key_codeArray = [];
	
	console.log('addChart...');
	var chart = document.getElementById('info-panel');
	chart.innerHTML = ''


	const features = map.queryRenderedFeatures({ layers: ['mesh-borders'] });



	// sort the elements by greatest to smallest
	features.sort((a, b) => b.properties[selectedvar+'_diff'] - a.properties[selectedvar+'_diff']);


	// loop through every element in features
	features.forEach(element => {
		
		// draw a line for each element with the length being the variable value
		const lineLength = element.properties[selectedvar+'_diff'];
		const key_code = element.properties['KEY_CODE'];

		// add length to linearray
		lineArray.push(lineLength);
		key_codeArray.push(key_code);
	});

	// find the value of the 10th element, and slice the array to only include all numeric values that are larger than the 10th element
	var tenth = lineArray[200];
	lineArray = lineArray.filter(value => value >= tenth);
	console.log(lineArray);
	// reverse the array so that the largest value is at the top
	lineArray.reverse()
	// now reverse the key_codeArray so that the key_code matches the lineArray, then slice the array to the same number of elements as lineArray
	key_codeArray.reverse()
	key_codeArray = key_codeArray.slice(0, lineArray.length);
	// now reverse it again
	key_codeArray.reverse()

	var data = [{
		type: 'bar',
		x: lineArray,
		// y: key_codeArray,
		// y: ['giraffes', 'orangutans', 'monkeys'],
		orientation: 'h',
		hovertemplate: 'Value: %{x} key_code: %{y} %{text}',
	  }];
	  
	  Plotly.newPlot('info-panel', data);
	  

	// Add event listener to capture hover event
	document.getElementById('info-panel').on('plotly_hover', function(data) {
		// Extract x and y values from the event data
		var xValue = data.points[0].x;
		var yValue = data.points[0].y;

		// Log x and y values to the console
		console.log('Hovered X:', xValue);
		console.log('Hovered Y:', yValue);
		console.log('Hovered keycode:', key_codeArray[yValue]);
		highlightFeature(yValue);

	});

	// // draw a line for each element in lineArray
	// lineArray.forEach(length => {

	//     drawLine(length);
	// });

	// // function to draw a line
	// function drawLine(length) {
	// // code to draw a line with the given length
	//     chart.innerHTML += length + '<br>';
	// }

	
}

// function to highlight a feature from mesh-borders by KEY_CODE
function highlightFeature(pos) {

	// filter by key_code and paint the feature with a different color
	map.setFilter('mesh-borders', ['==', 'KEY_CODE', key_codeArray[pos]]);
	map.setPaintProperty('mesh-borders', 'line-color', 'red');
	map.setPaintProperty('mesh-borders', 'line-width', 4);

	
}