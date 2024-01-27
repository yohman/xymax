mapboxgl.accessToken = 'pk.eyJ1IjoieW9obWFuIiwiYSI6IkxuRThfNFkifQ.u2xRJMiChx914U7mOZMiZw';
var building_layer_id = 'building-layer' 
var selectedvar = '2011_事務所建築物'; // Default selected value
var extrusionHeight = 10; // Default extrusion height
var mapStyle = 'mapbox://styles/mapbox/satellite-streets-v11'; // Default map style

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
    updateExtrusionLayer();
});

document.getElementById('extrusion-slider').addEventListener('input', function() {
    extrusionHeight = parseInt(this.value);
    updateExtrusionLayer();
});

document.getElementById('style-selector').addEventListener('change', function() {
    map.setStyle(this.value);
    
    
});


map.on('load', function () {
    map.addSource('my-data', {
        type: 'geojson',
        data: 'data/mesh2011.geojson'
    });
    
    map.addLayer({
        id: building_layer_id,
        type: 'fill-extrusion',
        source: 'my-data',
        slot: 'top'
    });

    // map.on('style.load', () => {
    //     map.setConfigProperty('basemap', 'showPlaceLabels', true);
    // });

    // map.on('mousemove', building_layer_id, function(e) {
    //     map.getCanvas().style.cursor = 'pointer'; // Change cursor style to pointer

    //     var properties = e.features[0].properties;
    //     var infoPanelContent = '';
    //     var selectedProperties = ['2011_独立住宅','2011_集合住宅','2011_事務所建築物','2011_住商併用建物','2011_専用工場','2011_住居併用工場','2011_教育文化施設','2011_厚生医療施設','2011_供給処理施設','2011_専用商業施設','2011_宿泊・遊興施設','2011_スポーツ・興行施設','2011_倉庫運輸関係施設','2011_農林漁業施設']; 

    //     selectedProperties.forEach(function(key) {
    //         infoPanelContent += '<p>' + key + ': ' + properties[key] + '<br>'+makeBox(Math.floor(properties[key]/50))+'</p>';
    //     });
    //     document.querySelector('.info-panel').innerHTML = infoPanelContent;

    //     map.setPaintProperty(building_layer_id, 'fill-color', '#f00');  // Change the fill color on hover

    //     // Highlight the polygon
    //     map.setFeatureState(
    //         { source: 'my-data', id: e.features[0].id },
    //         { hover: true }
    //     );
    // });

    // map.on('mouseleave', building_layer_id, function() {
    //     map.getCanvas().style.cursor = ''; // Reset cursor style

    //     // Remove the highlight from the polygon
    //     map.setFeatureState(
    //         { source: 'my-data', id: null },
    //         { hover: false }
    //     );
    // });

    // Add hover effect
    map.on('mousemove', building_layer_id, function (e) {
        map.getCanvas().style.cursor = 'pointer';
        map.setPaintProperty(building_layer_id, 'fill-color', '#f00');  // Change the fill color on hover
    });

    map.on('mouseleave', building_layer_id, function () {
        map.getCanvas().style.cursor = '';
        map.setPaintProperty(building_layer_id, 'fill-color', '#088');  // Reset the fill color on mouseleave
    });



    updateExtrusionLayer();
    
});

function updateExtrusionLayer() {
    map.setPaintProperty(building_layer_id, 'fill-extrusion-color', [
        'interpolate',
        ['linear'],
        ['get', selectedvar],
        0, 'rgba(0,255,0, 0.7)',
        500, 'rgba(255,0,0, 0.7)'
    ]);

    map.setPaintProperty(building_layer_id, 'fill-extrusion-height', ['*', ['get', selectedvar], extrusionHeight]);
    map.setPaintProperty(building_layer_id, 'fill-extrusion-opacity', 0.8);

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