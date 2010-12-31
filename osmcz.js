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
    if (document.navform.fromcheck.checked) {
      document.navform.from.value = lonlat.lat + "," + lonlat.lon;
    }
    if (document.navform.tocheck.checked) {
      document.navform.to.value = lonlat.lat + "," + lonlat.lon;
    }
  }
});

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
  if (document.cookie.length>0) {
    c_start=document.cookie.indexOf(c_name + "=");
    if (c_start!=-1) {
      c_start=c_start + c_name.length+1; 
      c_end=document.cookie.indexOf(";",c_start);
      if (c_end==-1) c_end=document.cookie.length;
      return unescape(document.cookie.substring(c_start,c_end));
    }
  }
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
  OpenLayers.ProxyHost = "cgi-bin/proxy.cgi?url=";
  OpenLayers.IMAGE_RELOAD_ATTEMPTS=3;
  map = new OpenLayers.Map('map', {
    controls: [
      new OpenLayers.Control.PanZoomBar(),
      new OpenLayers.Control.MouseDefaults(),
//        new OpenLayers.Control.LayerSwitcher({'ascending':false}),
      new OpenLayers.Control.LayerSwitcher({'div': OpenLayers.Util.getElement('layerswitcher')}),
      new OpenLayers.Control.ScaleLine(),
      new OpenLayers.Control.Permalink('permalink'),
      new OpenLayers.Control.MousePosition(),
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

  var layerMapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik");
  var layerTah    = new OpenLayers.Layer.OSM.Osmarender("Tiles@Home");
  var layerCycle  = new OpenLayers.Layer.OSM.CycleMap("Cycle map");
  map.addLayers([layerMapnik,layerTah,layerCycle]);

  var layer_osmcz2 = new OpenLayers.Layer.TMS(
    "osm.cz TMS",
    "http://openstreetmap.cz/tms/",
    {
      layername: 'osmcz',
      type: 'png', 
      getURL: osm_getTileURL,
      displayOutsideMaxExtent: true,
      attribution: "<a href=\"http://www.openstreetmap.org/\">OpenStreetMap</a>"
    }
  );
  map.addLayer(layer_osmcz2);
  var layer_otm = new OpenLayers.Layer.TMS(
    "opentracksmap TMS",
    "http://opentrackmap.no-ip.org/tiles/",
    {
      layername: 'blackhex sq',
      type: 'png', getURL: osm_getTileURL,
      displayOutsideMaxExtent: true,
      attribution: '<a href="http://opentrackmap.no-ip.org/">opentrackmap</a>'
    }
  );
  map.addLayer(layer_otm);

  var gml_all = new OpenLayers.Layer.GML(
    "KCT vse, pomale!", "http://openstreetmap.cz/kct.osm", 
    {format: OpenLayers.Format.OSM, projection: map.displayProjection}
  );
  gml_all.setVisibility(false);
  gml_all.preFeatureInsert = style_osm_feature; 
  map.addLayer(gml_all);

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
      attribution: '<a href="http://openstreetmap.cz/">osmcz</a>'
    }
  );
  map.addLayer(layer_kctcz);

  var hiking_tracks = new OpenLayers.Layer.OSM(
    "OTM Hiking Tracks", 
    "http://opentrackmap.no-ip.org/tracks/", 
    {
      isBaseLayer:false,
      type: 'png', 
      numZoomLevels: 19, 
      getURL: osm_getTileURL,
      attribution: '<a href="http://opentrackmap.no-ip.org/">otm</a>'
  });
  map.addLayer(hiking_tracks);

  gml = new OpenLayers.Layer.GML("KCT", "", {format: OpenLayers.Format.OSM, projection: map.displayProjection});
  gml.events.register("loadstart", null, function() { loader_on(); });
  gml.events.register("loadend", null, function() { loader_off(); gml.setVisibility(true);});
  gml.setVisibility(false);
  gml.preFeatureInsert = style_osm_feature; 
  map.addLayer(gml);

  var lat_get = gup('lat');
  var lon_get = gup('lon');
  var zoom_get = gup('zoom');
  if (lat_get == "" || lon_get == "") {
    osm_cookie = get_cookie("osm_position");
    if (osm_cookie != "") {
      var re = new RegExp("(.*);(.*);(.*)");
      var geo_array = re.exec(osm_cookie);
      lon_get = geo_array[1];
      lat_get = geo_array[2];
      zoom_get = geo_array[3];
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
  var marker_icon = new OpenLayers.Icon('http://openstreetmap.cz/img/guidepost_nice.png', icon_size);

  var icon_url = 'http://openstreetmap.cz/img/guidepost.png';
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
  var layers = map.getLayersByName("Rozcestniky");
  for(var layerIndex = 0; layerIndex < layers.length; layerIndex++) {
    map.removeLayer(layers[layerIndex]);
  }

  var markers = new OpenLayers.Layer.Markers("Rozcestniky");
  map.addLayer(markers);

  a = JSON.decode(request.responseText);

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
}

function show_guideposts(x)
{
  var kokot = map.getExtent().transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
  var request = OpenLayers.Request.GET({
    url: "http://openstreetmap.cz/guidepost.php",
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

function nav_ajax(from,to)
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

  navurl = "http://open.mapquestapi.com/directions/v0/route?outFormat=json&routeType="+ route_type +"&narrativeType=html&enhancedNarrative=false&shapeFormat=raw&generalize=10&locale=en_BG&unit=k&from=" + from + "&to=" + to;

  var request = OpenLayers.Request.GET({
    url: navurl,
//    params: {q:what, format:"json"},
    callback: on_nav,
  });
}

function on_nav(request)
{
//  request='{"route":{"hasTollRoad":false,"shape":{"maneuverIndexes":[0,2,4,6,8,11,13,15],"shapePoints":[49.699619,17.000192,49.702922,17.001604,49.702922,17.001604,49.703201,17.001726,49.703201,17.001726,49.691192,17.048229,49.691192,17.048229,49.689445,17.05046,49.689445,17.05046,49.681045,17.06295,49.663738,17.100896,49.663738,17.100896,49.660255,17.103466,49.660255,17.103466,49.654716,17.09626],"legIndexes":[0]},"hasHighway":true,"hasUnpaved":false,"boundingBox":{"ul":{"lng":17.000192,"lat":49.703483},"lr":{"lng":17.103466,"lat":49.654716}},"distance":10.399579048156738,"time":547,"locationSequence":[0,1],"sessionId":"4d1b511e-018b-0000-02b7-16ec-001ec93b8bf0","locations":[{"latLng":{"lng":17,"lat":49.7},"adminArea4":"","adminArea5Type":"City","adminArea4Type":"County","adminArea5":"","street":"","adminArea1":"","adminArea3":"","type":"s","displayLatLng":{"lng":17,"lat":49.7},"linkId":260668,"postalCode":"","sideOfStreet":"N","dragPoint":false,"adminArea1Type":"Country","geocodeQuality":"LATLNG","geocodeQualityCode":"XXXXX","adminArea3Type":"State"},{"latLng":{"lng":17.1,"lat":49.65},"adminArea4":"","adminArea5Type":"City","adminArea4Type":"County","adminArea5":"","street":"","adminArea1":"","adminArea3":"","type":"s","displayLatLng":{"lng":17.1,"lat":49.650001},"linkId":19776580,"postalCode":"","sideOfStreet":"N","dragPoint":false,"adminArea1Type":"Country","geocodeQuality":"LATLNG","geocodeQualityCode":"XXXXX","adminArea3Type":"State"}],"hasSeasonalClosure":false,"legs":[{"hasTollRoad":false,"index":0,"time":547,"distance":10.399579048156738,"hasSeasonalClosure":false,"hasCountryCross":false,"formattedTime":"00:09:07","hasUnpaved":false,"hasHighway":true,"hasFerry":false,"maneuvers":[{"signs":[],"index":0,"maneuverNotes":[],"direction":1,"narrative":"Start out going NORTH on <b>37310<\/b>.","iconUrl":"http://content.mapquest.com/mqsite/turnsigns/icon-dirs-start_sm.gif","distance":0.4168199896812439,"time":37,"linkIds":[],"streets":["37310"],"attributes":0,"formattedTime":"00:00:37","directionName":"North","turnType":0,"startPoint":{"lng":17.000192,"lat":49.699619}},{"signs":[],"index":1,"maneuverNotes":[],"direction":1,"narrative":"Turn SLIGHTLY RIGHT.","iconUrl":"http://content.mapquest.com/mqsite/turnsigns/rs_slight_right_sm.gif","distance":0.03218600153923035,"time":8,"linkIds":[],"streets":[],"attributes":0,"formattedTime":"00:00:08","directionName":"North","turnType":1,"startPoint":{"lng":17.001604,"lat":49.702922}},{"signs":[],"index":2,"maneuverNotes":[],"direction":8,"narrative":"Turn RIGHT onto <b>635<\/b>.","iconUrl":"http://content.mapquest.com/mqsite/turnsigns/rs_right_sm.gif","distance":3.6982719898223877,"time":228,"linkIds":[],"streets":["635"],"attributes":0,"formattedTime":"00:03:48","directionName":"East","turnType":2,"startPoint":{"lng":17.001726,"lat":49.703201}},{"signs":[],"index":3,"maneuverNotes":[],"direction":4,"narrative":"Turn RIGHT onto <b>slip road<\/b>.","iconUrl":"http://content.mapquest.com/mqsite/turnsigns/rs_right_sm.gif","distance":0.3202590048313141,"time":21,"linkIds":[],"streets":[],"attributes":0,"formattedTime":"00:00:21","directionName":"South","turnType":2,"startPoint":{"lng":17.048229,"lat":49.691192}},{"signs":[],"index":4,"maneuverNotes":[],"direction":5,"narrative":"Merge onto <b>R35<\/b>.","iconUrl":"http://content.mapquest.com/mqsite/turnsigns/rs_merge_right_sm.gif","distance":4.662269115447998,"time":160,"linkIds":[],"streets":["R35"],"attributes":128,"formattedTime":"00:02:40","directionName":"Southeast","turnType":10,"startPoint":{"lng":17.05046,"lat":49.689445}},{"signs":[{"text":"256","extraText":"","direction":0,"type":1001,"url":"http://api-signs.mqcdn.com/?s=rs&t=RSEXITRIGHTNUM_SM&n=256&d="}],"index":5,"maneuverNotes":[],"direction":5,"narrative":"Take <b>EXIT<\/b> <b>256<\/b>.","iconUrl":"http://content.mapquest.com/mqsite/turnsigns/rs_gr_exitright_sm.gif","distance":0.4634909927845001,"time":48,"linkIds":[],"streets":[],"attributes":0,"formattedTime":"00:00:48","directionName":"Southeast","turnType":14,"startPoint":{"lng":17.100896,"lat":49.663738}},{"signs":[],"index":6,"maneuverNotes":[],"direction":6,"narrative":"Turn RIGHT onto <b>449<\/b>.","iconUrl":"http://content.mapquest.com/mqsite/turnsigns/rs_right_sm.gif","distance":0.8062809705734253,"time":45,"linkIds":[],"streets":["449"],"attributes":0,"formattedTime":"00:00:45","directionName":"Southwest","turnType":2,"startPoint":{"lng":17.103466,"lat":49.660255}},{"signs":[],"index":7,"maneuverNotes":[],"direction":0,"narrative":"Welcome to <b><\/b>.","iconUrl":"http://content.mapquest.com/mqsite/turnsigns/icon-dirs-end_sm.gif","distance":0,"time":0,"linkIds":[],"streets":[],"attributes":0,"formattedTime":"00:00:00","directionName":"","turnType":-1,"startPoint":{"lng":17.096261,"lat":49.654716}}]}],"hasCountryCross":false,"formattedTime":"00:09:07","options":{"mustAvoidLinkIds":[],"countryBoundaryDisplay":true,"generalize":200,"stateBoundaryDisplay":true,"narrativeType":"html","maxLinkId":0,"locale":"en_BG","avoidTimedConditions":false,"destinationManeuverDisplay":true,"enhancedNarrative":false,"timeType":0,"tryAvoidLinkIds":[],"unit":"K","shapeFormat":"raw","routeType":"SHORTEST","sideOfStreetDisplay":true},"hasFerry":false},"info":{"copyright":{"text":"© 2010 MapQuest, Inc.","imageUrl":"http://tile21.mqcdn.com/res/mqlogo.gif","imageAltText":"© 2010 MapQuest, Inc."},"statuscode":0,"messages":[]}}';
  alert(request.responseText);
  bla = JSON.decode(request.responseText);

  var lineLayer = new OpenLayers.Layer.Vector('Line Layer');
  map.addLayer(lineLayer);
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

  alert(s);

  var line = new OpenLayers.Geometry.LineString(points);
  var defaultProj = new OpenLayers.Projection('EPSG:4326');
  line = line.transform(defaultProj, map.getProjectionObject());

  var style = {
    strokeColor: '#0000ff',
    strokeOpacity: 0.5,
    strokeWidth: 5
  };
  lineFeature = new OpenLayers.Feature.Vector(line, null, style);
  lineLayer.addFeatures([lineFeature]);
}

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
    search_result += "<a href='http://openstreetmap.cz/?zoom=12&lat="+a[i].lat+"&lon="+a[i].lon+"&layers=B0000FTTFTTT'>"+a[i].display_name+"</a>";
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

  g =  new OpenLayers.Format.KML({extractStyles: true});
  html = ""
  features = g.read(req.responseText);
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
}

function commons_on(url)
{
  OpenLayers.loadURL(url, "", null, parse_data);
}
