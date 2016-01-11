/*
* upload.js - openstreetmap.cz support file
* Copyright (C) 2010-2015  Michal Grezl
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


var lon = 5;
var lat = 40;
var zoom = 5;
var upload_map, select;
var form_file;
var parent_lat;
var parent_lon;

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
function upload_init()
/******************************************************************************/
{
  var options = {
    projection: new OpenLayers.Projection("EPSG:900913"),
    displayProjection: new OpenLayers.Projection("EPSG:4326"),
    units: "m",
    maxResolution: 156543.0339,
    maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34)
  };

  upload_map = new OpenLayers.Map('map', options);
  var mapnik = new OpenLayers.Layer.TMS(
    "OpenStreetMap (Mapnik)",
    "http://tile.openstreetmap.org/",
    {
      type: 'png', getURL: upload_getTileURL,
      displayOutsideMaxExtent: true,
      maxZoomLevel: 19,
      numZoomLevels: 19,
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
      maxZoomLevel: 16,
      type: 'png',
      getURL: upload_getTileURL,
      displayOutsideMaxExtent: true,
      attribution: '<a href="http://www.openstreetmap.cz/">OSM CZ</a>'
    }
  );
  upload_map.addLayer(layer_kctcz);
  upload_map.addLayer(mapnik);

  var parent_lat = parent.get_lat();
  var parent_lon = parent.get_lon();

  upload_map.zoomToExtent(new OpenLayers.Bounds(parent_lon, parent_lat, parent_lon+1, parent_lat+1).transform(upload_map.displayProjection, upload_map.projection));
  var click = new OpenLayers.Control.Click();
  upload_map.addControl(click);
  click.activate();

  auto_rename_handler();

}

/******************************************************************************/
function upload_getTileURL(bounds)
/******************************************************************************/
{
  var res = this.map.getResolution();
  var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
  var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
  var z = this.map.getZoom();
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

  if (success != 1) {
    alert("error: " + message);
  }

  document.getElementById('upload_process').style.visibility = 'hidden';
  author = document.getElementById('author').value;

  document.getElementById("coord").reset();
  document.getElementById('author').value = author;

  return true;
}


/******************************************************************************/
function auto_rename_event()
/******************************************************************************/
{
  var i;
  var files = form_file.files;
  var len = files.length;

  for (i = 0; i < len; i++) {
//    alert('Type: ' + files[i].type);
//    alert('Size: ' + files[i].size + ' bytes');
    if (files[i].name == "image.jpg") {
      var timestamp = new Date().getTime();
      var rnd = Math.floor((Math.random() * 100));
      new_name = "iphone" + timestamp + rnd + "image.jpg";
//      files[i].name = 
      alert('Filename: ' + new_name);
    }
  }
}

/******************************************************************************/
function auto_rename_handler()
/******************************************************************************/
{
  form_file = document.getElementById('guidepostfile');
  form_file.addEventListener('change', auto_rename_event, false);
}


/******************************************************************************/
function exif_present()
/******************************************************************************/
{
   document.getElementById('lat').value = 0;
   document.getElementById('lat').readOnly = true;
   document.getElementById('lon').value = 0;
   document.getElementById('lon').readOnly = true;
}

/******************************************************************************/
function no_exif()
/******************************************************************************/
{
   document.getElementById('lat').readOnly = false;
   document.getElementById('lon').readOnly = false;
}

/******************************************************************************/
function exif_checkbox_action()
/******************************************************************************/
{
  if (document.getElementById('exif_checkbox').checked) {
    exif_present();
  } else {
    no_exif();
  }
}

/******************************************************************************/
function upbox_off()
/******************************************************************************/
{
  document.getElementById('upbox').style.display = 'none' ;
}
