var lon = 5;
var lat = 40;
var zoom = 5;
var upload_map, select;

OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
  defaultHandlerOptions: {
    'single': true,
    'double': false,
    'pixelTolerance': 0,
    'stopSingle': false,
    'stopDouble': false
  },

  initialize: function(options) {
    this.handlerOptions = OpenLayers.Util.extend(
        {}, this.defaultHandlerOptions
    );
    OpenLayers.Control.prototype.initialize.apply(
        this, arguments
    ); 
    this.handler = new OpenLayers.Handler.Click(
      this, {
        'click': this.trigger
      }, this.handlerOptions
    );
  }, 

  trigger: function(e) {
    var lonlat = upload_map.getLonLatFromViewPortPx(e.xy).transform(upload_map.projection, upload_map.displayProjection);
    document.coord.lon.value = lonlat.lon;
    document.coord.lat.value = lonlat.lat;
  }
});

/******************************************************************************/
function init()
/******************************************************************************/
{
  var options = {
    projection: new OpenLayers.Projection("EPSG:900913"),
    displayProjection: new OpenLayers.Projection("EPSG:4326"),
    units: "m",
    maxResolution: 156543.0339,
    maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34)
  };

  upload_map = new OpenLayers.Map('upload_map', options);
  var mapnik = new OpenLayers.Layer.TMS(
    "OpenStreetMap (Mapnik)",
    "http://tile.openstreetmap.org/",
    {
      type: 'png', getURL: osm_getTileURL,
      displayOutsideMaxExtent: true,
      attribution: '<a href="http://www.openstreetmap.org/">OpenStreetMap</a>'
    }
  );

  var layer_kctcz = new OpenLayers.Layer.TMS(
    "Turisticke stezky",
    "http://openstreetmap.cz/kct_tiles/",
    {
      isBaseLayer:false,
      layername: 'kctcz',
      opacity:0.6,
      type: 'png', 
      getURL: osm_getTileURL,
      displayOutsideMaxExtent: true,
      attribution: '<a href="http://www.openstreetmap.cz/">OSM CZ</a>'
    }
  );
  upload_map.addLayer(layer_kctcz);
  upload_map.addLayer(mapnik);
  upload_map.zoomToExtent(new OpenLayers.Bounds(15, 49, 16, 50).transform(upload_map.displayProjection, upload_map.projection));
  var click = new OpenLayers.Control.Click();
  upload_map.addControl(click);
  click.activate();

}

/******************************************************************************/
function osm_getTileURL(bounds)
/******************************************************************************/
{
  var res = this.upload_map.getResolution();
  var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
  var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
  var z = this.upload_map.getZoom();
  var limit = Math.pow(2, z);

  if (y < 0 || y >= limit) {
    return OpenLayers.Util.getImagesLocation() + "404.png";
  } else {
    x = ((x % limit) + limit) % limit;
    return this.url + z + "/" + x + "/" + y + "." + this.type;
  }
}

/******************************************************************************/
function getHTTPObject()
/******************************************************************************/
{
  if (typeof XMLHttpRequest != 'undefined') {
    return new XMLHttpRequest();
  }
  try {
    return new ActiveXObject('Msxml2.XMLHTTP');
  } catch (e) {
    try {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } catch (e) {}
  } return false;
}

/******************************************************************************/
function start_upload()
/******************************************************************************/
{
  document.getElementById('upload_process').style.visibility = 'visible';
  return true;
}

/******************************************************************************/
function stop_upload(success, message, filename)
/******************************************************************************/
{
  var result = ''; 
  var response = '';
  var out_line = '';

  if (success != 1) {
    alert(message);
  }

  document.getElementById('upload_process').style.visibility = 'hidden';
  var http = getHTTPObject();
  http.open('GET', 'http://localhost/~walley/php/index.php?action=upload&name='+filename, true);
  http.send(null)
  http.onreadystatechange = function()
  {
    if (http.readyState == 4) {
      response = http.responseText;
    }
  }
  return true;
}
