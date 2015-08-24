/*
* osmcz.js - openstreetmap.cz support file
* Copyright (C) 2010  Michal Grezl
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

var map, gml;
var navmarkers;

var debug = true;
var newWindow;
var debug_window_content;

function loader_on()
{
  document.getElementById("loader").style.display = 'block' ;
}

function loader_off()
{
  document.getElementById("loader").style.display = 'none' ;
}

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

    var lonlat = map.getLonLatFromViewPortPx(e.xy).transform(map.projection, map.displayProjection);

    if (document.getElementById("from").checked) {
      document.getElementById("inputfrom").value = lonlat.lat + "," + lonlat.lon;
      add_simple_marker(navmarkers, lonlat.lon, lonlat.lat);
    }
    if (document.getElementById("to").checked) {
      document.getElementById("inputto").value = lonlat.lat + "," + lonlat.lon;
      add_simple_marker(navmarkers, lonlat.lon, lonlat.lat);
    }
  }
});

function add_simple_marker(layer, lon, lat)
{
  var size = new OpenLayers.Size(21,25);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
  var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
  layer.addMarker(new OpenLayers.Marker(new OpenLayers.LonLat(lon,lat).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")),icon));
}

function set_center(lon, lat)
{
  var lonlat = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
  map.panTo(lonlat);
}

function getInternetExplorerVersion()
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
//http://msdn.microsoft.com/en-us/library/ms537509.aspx
{
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

function checkVersion()
{
  var msg = "You're not using Internet Explorer.";
  var ver = getInternetExplorerVersion();

  if ( ver > -1 )
  {
    if ( ver >= 8.0 ) 
      msg = "You're using a recent copy of Internet Explorer."
    else
      msg = "You should upgrade your copy of Internet Explorer.";
  }
  alert( msg );
}

function style_osm_feature(feature) {
  feature.style = OpenLayers.Util.extend({'fill':'white'}, OpenLayers.Feature.Vector.style['default']);

  if (feature.attributes.kct_red) {
      feature.style.strokeColor = "red";
      feature.style.strokeWidth = 4;
  } else if (feature.attributes.kct_green) {
      feature.style.strokeColor = "green";
      feature.style.strokeWidth = 4;
  } else if (feature.attributes.kct_yellow) {
      feature.style.strokeColor = "yellow";
      feature.style.strokeWidth = 4;
  } else if (feature.attributes.kct_blue) {
      feature.style.strokeColor = "blue";
      feature.style.strokeWidth = 4;
  } else if (feature.attributes.highway == "primary") {
      feature.style.strokeColor = "red";
  } else if (feature.attributes.highway == "secondary") {
      feature.style.strokeColor = "orange";
  } else if (feature.attributes.highway) {
      feature.style.strokeColor = "black";
  } else  {
      feature.style.strokeColor = "black";
  }
}


function osm_getTileURL(bounds) {
    var res = this.map.getResolution();
    var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
    var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
    var z = this.map.getZoom();
    var limit = Math.pow(2, z);

    if (y < 0 || y >= limit) {
        return "404.png";
    } else {
        x = ((x % limit) + limit) % limit;
        return this.url + z + "/" + x + "/" + y + "." + this.type;
    }
}

function check_zoom()
{
  var zoom = map.getZoom();
  if (zoom >= 11) { return true; }
  if (zoom >= 9) { return confirm("Loading this amount of data may slow your browser. Are you sure you want to do this?"); }
  $("status").innerHTML = "Area too large. Zoom in to load data. (Current zoom level: "+ zoom + ". Must be at zoom 9+.)";
  return false;
}

function new_data()
{
  if (!check_zoom()) { return; }
  clear_data();
  gml.loaded = false;
  kokot = map.getExtent().transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
  gml.url = "http://osmxapi.hypercube.telascience.org/api/0.6/way[kct_red|kct_blue|kct_green|kct_yellow][bbox="+kokot.toBBOX()+"]";
  gml.loadGML();
}

function clear_data() {
  gml.destroyFeatures();
}

//from http://www.netlobo.com/url_query_string_javascript.html
function gup(name)
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if (results == null)
    return "";
  else
    return results[1];
}

function kill_cookie()
{
  var kill_time = new Date("January 1, 1970");
  var kill_string = "osm_position=stub;expires=" + kill_time.toGMTString();
  document.cookie = kill_string;
}

//from http://www.w3schools.com/JS/js_cookies.asp
function set_cookie(c_name,value,expiredays)
{
  var exdate = new Date();
  exdate.setDate(exdate.getDate()+expiredays);
  expiration = ((expiredays==null)?"":";expires="+exdate.toGMTString());
  document.cookie = c_name + "=" + escape(value) + expiration;
}

function get_cookie(c_name)
{
  debug_alert("cookie name:" + c_name);
  if (document.cookie.length>0) {
    c_start=document.cookie.indexOf(c_name + "=");
    debug_alert("cookie: " + document.cookie);
    if (c_start!=-1) {
      c_start=c_start + c_name.length+1; 
      c_end=document.cookie.indexOf(";",c_start);
      if (c_end==-1) c_end=document.cookie.length;
      retc = unescape(document.cookie.substring(c_start,c_end));
      debug_alert("cookie result: " + retc);
      return retc;
    }
  }
  debug_alert("neni cookie");
  return "";
}

function get_center()
{
  kill_cookie();
  b = map.getCenter();
  a = b.transform(map.getProjectionObject(),map.displayProjection);
  lat = a.lat;
  lon = a.lon;
  set_cookie("osm_position", lon+";"+lat+";12", 2);
}

function init()
{

  if (debug) {
    newWindow = window.open("","","scrollbar,status,height=200,width=300");
    var newContent = "<HTML><HEAD><TITLE>Debug window, do not worry</TITLE></HEAD>";
    newContent += "<BODY BGCOLOR='coral'><H1>This is debug window, site is being debugged.</H1>";
    newWindow.document.write(newContent);
    debug_window_content = "<h1>start</h1><br>";
  }

  OpenLayers.ProxyHost = "cgi-bin/proxy.cgi?url=";
  OpenLayers.IMAGE_RELOAD_ATTEMPTS=3;
  map = new OpenLayers.Map('map', {
    controls: [
      new OpenLayers.Control.PanZoomBar(),
      new OpenLayers.Control.MouseDefaults(),
      new OpenLayers.Control.LayerSwitcher({'div': OpenLayers.Util.getElement('layerswitcher')}),
      new OpenLayers.Control.ScaleLine({geodesic: true}),
      new OpenLayers.Control.Permalink('permalink'),
      new OpenLayers.Control.MousePosition(),

      new OpenLayers.Control.TouchNavigation({
            dragPanOptions: {
            enableKinetic: true
          }
      }),

      new OpenLayers.Control.Attribution(),
      //new OpenLayers.Control.OverviewMap(),
      new OpenLayers.Control.KeyboardDefaults()
    ],
    maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
    numZoomLevels: 18,
    maxResolution: 156543.0399,
    units: 'm',
    projection: new OpenLayers.Projection("EPSG:900913"),
    displayProjection: new OpenLayers.Projection("EPSG:4326")
  });

  var layer_otm = new OpenLayers.Layer.TMS(
    "opentracksmap TMS",
    "http://opentrackmap.no-ip.org/tiles/",
    {
      layername: 'opentrackmap',
      type: 'png', getURL: osm_getTileURL,
      displayOutsideMaxExtent: true,
      visibility: false,
      attribution: '<a href="http://opentrackmap.no-ip.org/">opentrackmap</a>'
    }
  );

  var layerMapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik");
  var layerTah    = new OpenLayers.Layer.OSM.Osmarender("Tiles@Home");
  var layerCycle  = new OpenLayers.Layer.OSM.CycleMap("Cycle map");
  var layermq     = new OpenLayers.Layer.OSM.Mapquest("Mapquest");
  map.addLayers([layermq,layerMapnik,layerCycle]);

  var layer_uhul = new OpenLayers.Layer.TMS(
    "Letecke snimky uhul",
    "http://openstreetmap.cz/uhul_tile.php/",
    {
      isBaseLayer:false,
      opacity: 0.4,
/*  resolutions:    [
      360/(1<<(8+14)),
      360/(1<<(8+15)),
      360/(1<<(8+16)),
      360/(1<<(8+17)),
      360/(1<<(8+18))
  ],
      numZoomLevels: 19,
*/
      layername: 'uhul_ortofoto',
      type: 'png', getURL: osm_getTileURL,
      displayOutsideMaxExtent: true,
      visibility: false,
      attribution: '<a href="http://www.uhul.cz/">uhul</a>'
    }
  );
  map.addLayer(layer_uhul);

/*
  var layer_zby2 = new OpenLayers.Layer.TMS(
    "uhul 2",
    "http://down.zby.cz/uhul_tile.php/",
    {
      isBaseLayer:false,
      opacity: 0.4,
      layername: 'Letecke snimky uhul',
      type: 'png', getURL: osm_getTileURL,
      displayOutsideMaxExtent: true,
      visibility: false,
      attribution: '<a href="http://opentrackmap.no-ip.org/">uhul</a>'
    }
  );
//  map.addLayer(layer_zby2);
*/
  var layer_kctcz = new OpenLayers.Layer.TMS(
    "Turisticke stezky",
    "http://map.openstreetmap.cz/kct_tiles/",
    {
      isBaseLayer:false,
      layername: 'kctcz',
      opacity:0.6,
      type: 'png', 
      numZoomLevels: 18,
      getURL: osm_getTileURL,
      displayOutsideMaxExtent: true,
      attribution: '<a href="http://openstreetmap.cz/">osmcz</a>'
    }
  );
  map.addLayer(layer_kctcz);

/*  var hiking_tracks = new OpenLayers.Layer.OSM(
    "OTM Hiking Tracks", 
    "http://opentrackmap.no-ip.org/tracks/", 
    {
      isBaseLayer:false,
      type: 'png', 
      numZoomLevels: 19, 
      visibility: false,
      getURL: osm_getTileURL,
      attribution: '<a href="http://opentrackmap.no-ip.org/">otm</a>'
  });
  map.addLayer(hiking_tracks);
*/

  navmarkers = new OpenLayers.Layer.Markers("Navigace",{
    displayInLayerSwitcher:true,
    visibility: false,
  });
  map.addLayer(navmarkers);

  add_simple_marker(navmarkers, 30, 30);

  gml = new OpenLayers.Layer.GML("KCT", "", {
          format: OpenLayers.Format.OSM, 
          projection: map.displayProjection,
          displayInLayerSwitcher:false
        });

  gml.setVisibility(false);
  gml.events.register("loadstart", null, function() { loader_on(); });
  gml.events.register("loadend", null, function() { loader_off(); gml.setVisibility(true);});
  gml.preFeatureInsert = style_osm_feature; 
  map.addLayer(gml);

  var lat_get = gup('lat');
  var lon_get = gup('lon');
  var zoom_get = gup('zoom');
  if (lat_get == "" || lon_get == "") {
    osm_cookie = get_cookie("osm_position");
    if (osm_cookie != "" && osm_cookie != "stub") {
      var re = new RegExp("(.*);(.*);(.*)");
      var geo_array = re.exec(osm_cookie);
      lon_get = geo_array[1];
      lat_get = geo_array[2];
      zoom_get = geo_array[3];
      if (lon_get == 0 && lat_get == 0) {
        lon_get = 17.07;
        lat_get = 49.7;
        zoom_get = 12;
      }
    } else {
      lon_get = 17.07;
      lat_get = 49.7;
      zoom_get = 12;
    }
  }

  map.setCenter(new OpenLayers.LonLat(lon_get,lat_get).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), zoom_get);
  var click = new OpenLayers.Control.Click();
  map.addControl(click);
  click.activate();
}

var poi_layer = [];
var newl;

function show_poi(category)
{
  newl = new OpenLayers.Layer.Text("radary", {
    location:"./radary.poi",
    projection:map.displayProjection
  });
  map.addLayer(newl);
}

function hide_poi(category)
{
//  map.removeLayer(poi_layer[category]);
  map.removeLayer(newl);
}

/**
 * Function: addMarker
 * Add a new marker to the markers layer given the following lonlat, 
 *     popupClass, and popup contents HTML. Also allow specifying 
 *     whether or not to give the popup a close box.
 * 
 * Parameters:
 * to_layer - layer
 * ll - {<OpenLayers.LonLat>} Where to place the marker
 * popupClass - {<OpenLayers.Class>} Which class of popup to bring up 
 *     when the marker is clicked.
 * popupContentHTML - {String} What to put in the popup
 * closeBox - {Boolean} Should popup have a close box?
 * overflow - {Boolean} Let the popup overflow scrollbars?
 */
function addMarker(to_layer, ll, popupClass, popupContentHTML, closeBox, overflow) 
{
  var icon_size = new OpenLayers.Size(48, 48);
  var marker_icon = new OpenLayers.Icon('http://map.openstreetmap.cz/img/guidepost_nice.png', icon_size);
  var icon_url = 'http://map.openstreetmap.cz/img/guidepost.png';
  var data = {
    iconURL: icon_url,
    iconSize: icon_size
  };

  var feature = new OpenLayers.Feature(to_layer, ll, data);

  feature.closeBox = true;
  feature.popupClass = popupClass;
  feature.data.popupContentHTML = popupContentHTML;
  feature.data.overflow = (overflow) ? "auto" : "hidden";
  feature.data.icon = marker_icon;
  var marker = feature.createMarker();

  var markerClick = function (evt) {
    if (this.popup == null) {
      this.popup = this.createPopup(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    currentPopup = this.popup;
    OpenLayers.Event.stop(evt);
  };

  marker.events.register("mousedown", feature, markerClick);
  to_layer.addMarker(marker);
}

var AutoSizeFramedCloudMaxSize = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true,
  'maxSize': new OpenLayers.Size(450,450)
});

function handler(request)
{

  if(request.status == 500) {
    debug_alert("handler(): 500");
  }
  if(request.status == 413) {
    debug_alert("handler(): 413");
  }

  var layers = map.getLayersByName("Rozcestniky");

  debug_alert("debugging handler():");

  for(var layerIndex = 0; layerIndex < layers.length; layerIndex++) {
    map.removeLayer(layers[layerIndex]);
  }

  var markers = new OpenLayers.Layer.Markers("Rozcestniky");
  map.addLayer(markers);

  a = JSON.decode(request.responseText);

  if (!a) {
    debug_alert("a is null");
    loader_off();
    alert("rozcestniky: Nic nenalezeno");
  }

  debug_alert("responsetext:" + request.responseText);
  debug_alert("result of JSON.decode(responsetext):" + a);

  for(i = 0; i < a.length; i++) {
    b = a[i];
    var lat = parseFloat(b.lat);
    var lon = parseFloat(b.lon);
    var size   = new OpenLayers.Size(10, 17);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    var pos    = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));

    popupClass = AutoSizeFramedCloudMaxSize;
    html_content = "guidepost by "+b.attribution+"<br>"
    html_content += "<a href='"+b.url+"'>"+b.name+"</a><br>"
    html_content += " <img src='"+b.url+"' width='180' alt='guidepost'>" 
    addMarker(markers, pos, popupClass, html_content, true, true);
  }
  status = request.status;

  loader_off();
}

function show_guideposts(x)
{

  loader_on();

  var kokot = map.getExtent().transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
  debug_alert("show_guidepost():"+kokot+" "+kokot.toBBOX());
  var request = OpenLayers.Request.GET({
    url: "http://api.openstreetmap.cz/guidepost.php",
    params: {bbox: kokot.toBBOX()},
    callback: handler
  });
}

function search_ajax(what)
{
  var request = OpenLayers.Request.GET({
    url: "http://nominatim.openstreetmap.org/search/",
    params: {q:what, format:"json"},
    callback: on_search,
  });
}

function get_radio(radio)
{
  if(!radio) {
    return "";
  }

  if(radio.length == undefined) {
    if(radio.checked) return radio.value;
  }

  for(var i = 0; i < radio.length; i++) {
    if(radio[i].checked) return radio[i].value;
  }

  return "";
}

/******************************************************************************/

var nav_line_layer = 0;

function draw_line(points, color, width)
{
  nav_line_layer++;
  var lineLayer = new OpenLayers.Layer.Vector('Line Layer ' + nav_line_layer);
  map.addLayer(lineLayer);
  var line = new OpenLayers.Geometry.LineString(points);
  var defaultProj = new OpenLayers.Projection('EPSG:4326');
  line = line.transform(defaultProj, map.getProjectionObject());

  var style = {
    strokeColor: color,
    strokeOpacity: 0.5,
    strokeWidth: width
  };
  lineFeature = new OpenLayers.Feature.Vector(line, null, style);
  lineLayer.addFeatures([lineFeature]);
}

function nav_mapquest(from, to)
{
  if (get_radio(navform.transport_type) == "car") {
    if (get_radio(navform.route_type) == "fastest") {
      route_type = "fastest"; 
    } else {
      route_type = "shortest";
    }
  } else
  if (get_radio(navform.transport_type) == "hyooman") {route_type = "pedestrian";} else 
  if (get_radio(navform.transport_type) == "bicycle") {route_type = "bicycle";}

  navurl = "http://open.mapquestapi.com/directions/v0/route?outFormat=json&routeType="+ route_type +"&narrativeType=html&enhancedNarrative=false&shapeFormat=raw&generalize=10&locale=en_GB&unit=k&from=" + from + "&to=" + to;

debug_alert(navurl);

  var request = OpenLayers.Request.GET({
    url: navurl,
//    params: {q:what, format:"json"},
    callback: on_nav_mapquest,
  });

}

function nav_cloudmade(from, to)
{
  if (get_radio(navform.transport_type) == "car") {route_vehicle = "car";}
  if (get_radio(navform.transport_type) == "hyooman") {route_vehycle = "pedestrian";} else 
  if (get_radio(navform.transport_type) == "bicycle") {route_vehicle = "bicycle";}

  if (get_radio(navform.route_type) == "fastest") {
    route_type = "fastest"; 
  } else {
    route_type = "shortest";
  }

  nav_url = "http://routes.cloudmade.com/1ad70c11d13a5b36adeb20679904ca37/api/0.3/"+from+","+to+"/"+route_vehicle+"/"+route_type+".js?units=km&lang=en";
  var request = OpenLayers.Request.GET({
    url: nav_url,
//    params: {q:what, format:"json"},
    callback: on_nav_cloudmade,
  });
}


function on_nav_cloudmade(request)
{
  debug_alert(request.responseText);
  bla = JSON.decode(request.responseText);

  var points = new Array(
  );

  var point;
  var s = "tady:";

  for (i = 0; i < bla.route_geometry.length; i++) {
    s += "2("+bla.route_geometry[i][0]+","+bla.route_geometry[i][1] +"), ";
    var x = bla.route_geometry[i][1];
    var y = bla.route_geometry[i][0];
    point = new OpenLayers.Geometry.Point(x,y);
    points.push(point);
  }

  debug_alert(s);

  draw_line(points, "red", 10);
}


function debug_alert(s)
{
  if (!debug) return;
  if (newWindow.closed) {
    newWindow = window.open("","","scrolling=auto,status,height=200,width=300");
  }
  newWindow.document.write("<hr>" + s + "<br>");
}

function on_nav_mapquest(request)
{
  debug_alert(request.responseText);

  bla = JSON.decode(request.responseText);

  var points = new Array(
  );

  var point;
  var s = "tady:";

  for (i = 0; i < bla.route.shape.shapePoints.length / 2; i++) {
    s += bla.route.shape.shapePoints[i * 2]+" "+bla.route.shape.shapePoints[i * 2 + 1] +",";
    point = new OpenLayers.Geometry.Point(bla.route.shape.shapePoints[i * 2 + 1],
                                          bla.route.shape.shapePoints[i * 2]);
    points.push(point);
  }

  debug_alert(s);
  draw_line(points,"#0000ff", 5);

}

function nav_ajax(from,to)
{
  nav_line_layer = 0;
  if (document.getElementById('checkbox_cloudmade').checked) {nav_cloudmade(from, to);}
  if (document.getElementById('checkbox_mapquest').checked) {nav_mapquest(from, to);}
}

/******************************************************************************/

function on_search(request)
{
  a = JSON.decode(request.responseText);
  if (a.length == 0) {
    document.getElementById('searchdiv').innerHTML = "<p>nic nenalezeno</p>";
    return;
  }
  search_result = "<p><ol>";
  for(i = 0; i < a.length; i++) {
    search_result += "<li>";
    search_result += "<span onclick='javascript:set_center("+a[i].lon+", "+a[i].lat+")'> <font color='blue'>&gt;&gt;</font> </span>";
    search_result += "<a href='http://map.openstreetmap.cz/?zoom=12&lat="+a[i].lat+"&lon="+a[i].lon+"&layers=B0000FTTFTTT'>"+a[i].display_name+"</a>";
  }
  search_result += "</ol></p>";

/*
class: "highway"
display_name: "Litovel, R35, Nasobůrky, Okres Olomouc, Olomoucký kraj, Czech Republic"
lat: 49.6875308
licence: "Data Copyright OpenStreetMap Contributors, Some Rights Reserved. CC-BY-SA 2.0."
lon: 17.0528042
osm_id: 25577262
osm_type: "node"
place_id: 50891542
type: "motorway_junction"
*/
  document.getElementById('searchdiv').innerHTML = search_result;
  set_center(a[0].lon, a[0].lat);
}

function parse_data(req) 
{
  var markers = new OpenLayers.Layer.Markers("Wikimedia Commons");
  map.addLayer(markers);

  var expr = /<img.*src="(.*?)".*?>/;
  var exprc = /<center>(.*?)<.center>/;

debug_alert("wikimedia parse_data ...");
  g =  new OpenLayers.Format.KML({extractStyles: true});
  html = ""
  features = g.read(req.responseText);

  debug_alert("result:(" + features + ")");

  for(var feat in features) {
    var lat = features[feat].geometry.y;
    var lon = features[feat].geometry.x;

    var size   = new OpenLayers.Size(10, 17);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    var pos    = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));

    popupClass = AutoSizeFramedCloudMaxSize;
    html_content = "guidepost by<br>";
    html_content += "<a href='http://commons.wikimedia.org/'>Wikimedia Commons</a><br>";
    for (var j in features[feat].attributes) {
      if (j == "name") {
        html_content += "Jmeno:"+features[feat].attributes[j]+"<br>";
      } else {
        //var matching = expr.exec(features[feat].attributes[j]);
        //html_content += RegExp.$1;
        var matching2 = exprc.exec(features[feat].attributes[j]);
        html_content += RegExp.$1;
      }
    }

    addMarker(markers, pos, popupClass, html_content, true, true);
  }

  loader_off();
}

function commons_on(url)
{
  debug_alert("commons_on url:" + url);
  OpenLayers.loadURL(url, "", null, parse_data);
}
