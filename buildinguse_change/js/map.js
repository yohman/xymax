// ------------------------------------------------
//
// globals
//
// ------------------------------------------------

// create a namespace variable for the project xymax
var xymax = xymax || {}

mapboxgl.accessToken = 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw'
var selectedvar 	= '集合住宅' // Default selected value
var max_bin_val 	= 20
var minPopup 		= document.createElement('div')
var maxPopup		= document.createElement('div')
var colors 			= ['rgba(165,0,38,0.8)', 'rgba(248,139,81,0.8)', 'rgba(253,254,186,0.8)', 'rgba(113,193,100,0.8)', 'rgba(0,104,55,0.8)']
var lineArray 		= []
var keyArray 		= []
var placeArray 		= []
var n = 50 // number of elements to show in the chart
var showTop 		= true

const map = new mapboxgl.Map({
	container: 'map',
	center: [139.6917, 35.6895],
	zoom: 10,
})

var popup = new mapboxgl.Popup({
	className: 'popup',
	closeButton: false,
	closeOnClick: false
})

// ------------------------------------------------
// Add event listeners
// ------------------------------------------------

document.getElementById('dropdown').addEventListener('change', function() {
	selectedvar = this.value
	updateExtrusionLayer_diff()
	labelMinMax()
	makeChart()
})

document.getElementById('extrusion-slider').addEventListener('input', function() {
	max_bin_val = parseInt(this.value);
	updateExtrusionLayer_diff();
	updateLegend();
	makeChart();
});

// Add event listener to radio buttons
document.querySelectorAll('input[type="radio"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
		// Update variable based on selected option
		showTop = this.value === 'true';
		makeChart();						
		// Log the variable value
		console.log('showTop:', showTop);
    });
  });


// ------------------------------------------------
// Load the map
// ------------------------------------------------

map.on('load', function () {
	console.log('loading map...')

	updateLegend()

	map.addSource('my-data', {
		type: 'geojson',
		// data: 'data/mesh2011_2016.geojson'
		data: 'data/mesh2011_2016_master.geojson'
		// data: 'data/mesh2011.geojson'
	})
	
	map.addLayer({
		id: 'mesh',
		// type: 'fill-extrusion',
		type: 'fill',
		source: 'my-data',
		slot: 'top'
	})

	map.addLayer({
		id: 'mesh-borders',
		type: 'line',
		source: 'my-data',
		layout: {},
		paint: {
			'line-color': '#666',
			'line-width': 0.1 
		},
		slot: 'top'

	})

	map.on('mousemove', 'mesh', (e) => {
		if (e.features.length > 0) {

			map.getCanvas().style.cursor = 'pointer'

			value_2011 = e.features[0].properties['2011_'+selectedvar]
			value_2016 = e.features[0].properties['2016_'+selectedvar]
			value_diff = value_2016 - value_2011
			value_place = e.features[0].properties['CITYNAME']
			console.log(e.features[0].properties);
			if (value_2011 > value_2016) {
				diff_html = '<p style="color:'+colors[0]+';font-size:2rem">⬇︎' + value_diff + '</p>'
			} 
			else if (value_2011 == value_2016) {
				diff_html = '<p style="color:gray;font-size:2rem">' + value_diff + '</p>'
			}
			else {
				diff_html = '<p style="color:'+colors[4]+';font-size:2rem">⬆︎' + value_diff + '</p>'
			}
			popup_html = '<div style="text-align:center"><span class="popup-title">'+value_place+'</span>'+diff_html+'<table width=100%><tr><td>2011</td><td>→</td><td><b>'  + value_2011 + '</td></tr><tr><td>2016</td><td>→</td><td><b>' + value_2016 + '</td></tr></table>'+selectedvar+'</div>'

			popup.setLngLat(e.lngLat)
				.setHTML(popup_html)
				.addTo(map);

		}
	});
		
	// When the mouse leaves the state-fill layer, update the feature state of the
	// previously hovered feature.
	map.on('mouseleave', 'mesh', () => {
		map.getCanvas().style.cursor = '';
		popup.remove();
	})

	updateExtrusionLayer_diff();
	// execute this function 1 second after the map is loaded
	setTimeout(labelMinMax, 1000);
	setTimeout(makeChart, 1000);
	// labelMinMax();


});

// ------------------------------------------------
//
// Functions
//
// ------------------------------------------------

function updateExtrusionLayer() {
	console.log(selectedyear+'_'+selectedvar);
	map.setPaintProperty('mesh', 'fill-extrusion-color', [
		'interpolate',
		['linear'],
		['get', selectedyear+'_'+selectedvar],
		0, 'rgba(0,255,0, 0.7)',
		500, 'rgba(255,0,0, 0.7)'
	]);

	map.setPaintProperty('mesh', 'fill-extrusion-height', ['*', ['get', selectedyear+'_'+selectedvar], extrusionHeight]);
	map.setPaintProperty('mesh', 'fill-extrusion-opacity', 0.8);


}

function changeMapStyle(style) {
	map.setStyle(style);
}

function labelMinMax() {

	// Add a popup to the polygon that has the highest value of the selected variable
	const features = map.queryRenderedFeatures({ layers: ['mesh'] });

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

	  
}


function updateExtrusionLayer_diff() {

	console.log('updateExtrusionLayer_diff');
	console.log('mesh');
	map.setPaintProperty('mesh', 'fill-color', [
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


// ------------------------------------------------
// function to access info-panel and add a chart
// ------------------------------------------------

function makeChart() {
	// clear the arrays
	lineArray = [];
	keyArray = [];
	placeArray = [];
	// showTop = True;
	

	// get the info-panel and clear it
	var chart = document.getElementById('info-panel');
	chart.innerHTML = ''

	// get the features from the map
	const features = map.queryRenderedFeatures({ layers: ['mesh'] });
	// const features = map.queryRenderedFeatures({ layers: ['mesh-borders'] });

	// sort the elements by greatest to smallest
	features.sort((a, b) => b.properties[selectedvar+'_diff'] - a.properties[selectedvar+'_diff']);

	// loop through every element in features
	features.forEach(element => {
		// add values to arrays
		const lineLength = element.properties[selectedvar+'_diff'];
		const key_code = element.properties['KEY_CODE_left'];
		const place = element.properties['CITYNAME'];
		lineArray.push(lineLength);
		keyArray.push(key_code);
		placeArray.push(place);
	});

	// find the value of the nth element, and slice the array to only include all numeric values that are larger than the 10th element
	// slice the lineArray to the top 200 elements

	top_lineArray = lineArray.slice(0, n);
	top_keyArray = keyArray.slice(0, n);
	top_placeArray = placeArray.slice(0, n);	
	bottom_lineArray = lineArray.slice(-n);
	bottom_keyArray = keyArray.slice(-n);
	bottom_placeArray = placeArray.slice(-n);

	
	// var tenth = lineArray[200];
	// lineArray = lineArray.filter(value => value >= tenth);
	// console.log(lineArray);
	// reverse the array so that the largest value is at the top
	if (showTop) {
		console.log('showTop')
		lineArray=top_lineArray.reverse()
		keyArray=top_keyArray.reverse()
		placeArray=top_placeArray.reverse()
		
	}
	else {
		console.log('showBottom')
		lineArray=bottom_lineArray.reverse()
		keyArray=bottom_keyArray.reverse()
		placeArray=bottom_placeArray.reverse()
	}


	// make a copy of lineArray
	var lineArrayColors = lineArray.slice();

	// go over each value in lineArray, and for any value greater than 20, set it to 20, and for any value less than -20, set it to -20
	for (var i = 0; i < lineArrayColors.length; i++) {
		if (lineArrayColors[i] > max_bin_val) {
			lineArrayColors[i] = max_bin_val;
		}
		if (lineArrayColors[i] < -max_bin_val) {
			lineArrayColors[i] = -max_bin_val;
		}
	}

	var data = [{
		type: 'bar',
		x: lineArray,
		orientation: 'h',
		text: placeArray,
		name: '',
		textposition: 'none',
		hovertemplate: '%{text}: %{x}',
		marker: {
			color: lineArrayColors, // Values for color scale
			colorscale: [[0, colors[0]], [0.5, colors[2]], [1, colors[4]]], // Custom colorscale
			cmin: -max_bin_val, // Minimum value for color scale
			cmax: max_bin_val, // Maximum value for color scale
			colorbar: {
			  title: '' // Title for color bar
			},
			

		  },
	}];
		
	// Layout options
	var layout = {
		xaxis: {
			//title: 'X Axis Title' // Add X axis title if needed
		},
		yaxis: {
			showticklabels: false // Hide y-axis tick labels
		}
	};

	Plotly.newPlot('info-panel', data, layout, {displayModeBar: false});
	  

	// Add event listener to capture hover event
	document.getElementById('info-panel').on('plotly_hover', function(data) {
		// Extract x and y values from the event data
		var xValue = data.points[0].x;
		var yValue = data.points[0].y;

		// Log x and y values to the console
		console.log('Hovered X:', xValue);
		console.log('Hovered Y:', yValue);
		console.log('Hovered keycode:', keyArray[yValue]);
		highlightFeature(yValue);

	});

}

// function to highlight a feature from mesh-borders by KEY_CODE
function highlightFeature(pos) {

	// filter by key_code and paint the feature with a different color
	map.setFilter('mesh-borders', ['==', 'KEY_CODE_left', keyArray[pos]]);
	map.setPaintProperty('mesh-borders', 'line-color', 'black');
	map.setPaintProperty('mesh-borders', 'line-width', 2);	
}

function updateLegend(){

	// getdocumentid legend1, legend2 and legend3, and update their background color
	document.getElementById('legend1').style.backgroundColor = colors[0];
	document.getElementById('legend2').style.backgroundColor = colors[2];
	document.getElementById('legend3').style.backgroundColor = colors[4];
	// set the text of the legend to the max_bin_val
	document.getElementById('legend1').innerHTML = '⬇︎'+ -max_bin_val + ' (減少)'
	document.getElementById('legend2').innerHTML = 0 + ' (変化なし)'
	document.getElementById('legend3').innerHTML = '⬆︎'+max_bin_val + ' (増加)'
}

// ------------------------------------------------
// depracated
// ------------------------------------------------

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
