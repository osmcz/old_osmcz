var map, gml;

function unserialize(data)
{
    // Takes a string representation of variable and recreates it
    //
    // version: 903.3016
    // discuss at: http://phpjs.org/functions/unserialize
    // +     original by: Arpad Ray (mailto:arpad@php.net)
    // +     improved by: Pedro Tainha (http://www.pedrotainha.com)
    // +     bugfixed by: dptr1988
    // +      revised by: d3x
    // +     improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // %            note: We feel the main purpose of this function should be to ease the transport of data between php & js
    // %            note: Aiming for PHP-compatibility, we have to translate objects to arrays
    // *       example 1: unserialize('a:3:{i:0;s:5:"Kevin";i:1;s:3:"van";i:2;s:9:"Zonneveld";}');
    // *       returns 1: ['Kevin', 'van', 'Zonneveld']
    // *       example 2: unserialize('a:3:{s:9:"firstName";s:5:"Kevin";s:7:"midName";s:3:"van";s:7:"surName";s:9:"Zonneveld";}');
    // *       returns 2: {firstName: 'Kevin', midName: 'van', surName: 'Zonneveld'}
    var error = function (type, msg, filename, line){throw new this.window[type](msg, filename, line);};
    var read_until = function (data, offset, stopchr){
        var buf = [];
        var chr = data.slice(offset, offset + 1);
        var i = 2;
        while (chr != stopchr) {
            if ((i+offset) > data.length) {
                error('Error', 'Invalid');
            }
            buf.push(chr);
            chr = data.slice(offset + (i - 1),offset + i);
            i += 1;
        }
        return [buf.length, buf.join('')];
    };
    var read_chrs = function (data, offset, length){
        var buf;

        buf = [];
        for(var i = 0;i < length;i++){
            var chr = data.slice(offset + (i - 1),offset + i);
            buf.push(chr);
        }
        return [buf.length, buf.join('')];
    };
    var _unserialize = function (data, offset){
        var readdata;
        var readData;
        var chrs = 0;
        var ccount;
        var stringlength;
        var keyandchrs;
        var keys;

        if(!offset) {offset = 0;}
        var dtype = (data.slice(offset, offset + 1)).toLowerCase();

        var dataoffset = offset + 2;
        var typeconvert = new Function('x', 'return x');

        switch(dtype){
            case 'i':
                typeconvert = function (x) {return parseInt(x, 10);};
                readData = read_until(data, dataoffset, ';');
                chrs = readData[0];
                readdata = readData[1];
                dataoffset += chrs + 1;
            break;
            case 'b':
                typeconvert = function (x) {return parseInt(x, 10) == 1;};
                readData = read_until(data, dataoffset, ';');
                chrs = readData[0];
                readdata = readData[1];
                dataoffset += chrs + 1;
            break;
            case 'd':
                typeconvert = function (x) {return parseFloat(x);};
                readData = read_until(data, dataoffset, ';');
                chrs = readData[0];
                readdata = readData[1];
                dataoffset += chrs + 1;
            break;
            case 'n':
                readdata = null;
            break;
            case 's':
                ccount = read_until(data, dataoffset, ':');
                chrs = ccount[0];
                stringlength = ccount[1];
                dataoffset += chrs + 2;

                readData = read_chrs(data, dataoffset+1, parseInt(stringlength, 10));
                chrs = readData[0];
                readdata = readData[1];
                dataoffset += chrs + 2;
                if(chrs != parseInt(stringlength, 10) && chrs != readdata.length){
                    error('SyntaxError', 'String length mismatch');
                }
            break;
            case 'a':
                readdata = {};

                keyandchrs = read_until(data, dataoffset, ':');
                chrs = keyandchrs[0];
                keys = keyandchrs[1];
                dataoffset += chrs + 2;

                for(var i = 0;i < parseInt(keys, 10);i++){
                    var kprops = _unserialize(data, dataoffset);
                    var kchrs = kprops[1];
                    var key = kprops[2];
                    dataoffset += kchrs;

                    var vprops = _unserialize(data, dataoffset);
                    var vchrs = vprops[1];
                    var value = vprops[2];
                    dataoffset += vchrs;

                    readdata[key] = value;
                }

                dataoffset += 1;
            break;
            default:
                error('SyntaxError', 'Unknown / Unhandled data type(s): ' + dtype);
            break;
        }
        return [dtype, dataoffset - offset, typeconvert(readdata)];
    };
    return _unserialize(data, 0)[2];
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
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
  return "";
  else
  return results[1];
}

function kill_cookie(){
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
//alert(document.cookie);
    b=map.getCenter();
    a=b.transform(map.getProjectionObject(),map.displayProjection);
    lat = a.lat;
    lon = a.lon;

//    zproj = map.getProjectionObject();
//    kproj = map.displayProjection;
//    html= lat+"<br>"+lon+"<br>"+zproj+"<br>"+kproj
//    alert(html);

    set_cookie("osm_position", lon+";"+lat+";12", 2);
//alert(document.cookie);
}


function init()
{
  OpenLayers.ProxyHost = "cgi-bin/proxy.cgi?url=";
  OpenLayers.IMAGE_RELOAD_ATTEMPTS=3;
  map = new OpenLayers.Map('map', {
    controls: [
        new OpenLayers.Control.PanZoomBar(),
        new OpenLayers.Control.MouseDefaults(),
        new OpenLayers.Control.LayerSwitcher({'ascending':false}),
        new OpenLayers.Control.ScaleLine(),
        new OpenLayers.Control.Permalink('permalink'),
        new OpenLayers.Control.MousePosition(),
//                    new OpenLayers.Control.OverviewMap(),
        new OpenLayers.Control.KeyboardDefaults()                    ],
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
  var layer_osmcz2 = new OpenLayers.Layer.TMS(
      "opentracksmap TMS",
      "http://opentrackmap.no-ip.org/tiles/",
      {
        layername: 'blackhex sq',
        type: 'png', getURL: osm_getTileURL,
        displayOutsideMaxExtent: true,
        attribution: '<a href="http://www.openstreetmap.org/">OpenStreetMap</a>'
      }
  );
  map.addLayer(layer_osmcz2);

  var gml_all = new OpenLayers.Layer.GML(
      "KCT vse, pomale!", "http://openstreetmap.cz/kct.osm", 
      {format: OpenLayers.Format.OSM, projection: map.displayProjection});
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
        attribution: '<a href="http://www.openstreetmap.org/">OpenStreetMap</a>'
      }
  );
  map.addLayer(layer_kctcz);

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
//    osm_cookie = "17.07;49.7;12";
    if (osm_cookie != "") {
      var re = new RegExp("(.*);(.*);(.*)");
      var geo_array = re.exec(osm_cookie);
//      alert("c:"+osm_cookie+"-> "+geo_array[1]+" "+geo_array[2]+" "+geo_array[3]);
      lon_get = geo_array[1];
      lat_get = geo_array[2];
      zoom_get = geo_array[3];
    } else {
      lon_get = 17.07;
      lat_get = 49.7;
      zoom_get = 12;
//      alert("no cookie");
    }
  }
  map.setCenter(new OpenLayers.LonLat(lon_get,lat_get).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), zoom_get);
//  get_center();
}

var poi_layer = [];
var newl;

function show_poi(category)
{
/*  poi_layer[category] = new OpenLayers.Layer.GML("KML", "cz.kml",
  {
      format: OpenLayers.Format.KML,
      formatOptions: {extractStyles: false, extractAttributes: false}
  });
  map.addLayer(poi_layer[category]);*/

  newl = new OpenLayers.Layer.Text( "text", { 
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
 * markers - layer added by me
 * ll - {<OpenLayers.LonLat>} Where to place the marker
 * popupClass - {<OpenLayers.Class>} Which class of popup to bring up 
 *     when the marker is clicked.
 * popupContentHTML - {String} What to put in the popup
 * closeBox - {Boolean} Should popup have a close box?
 * overflow - {Boolean} Let the popup overflow scrollbars?
 */
function addMarker(markers, ll, popupClass, popupContentHTML, closeBox, overflow) {

    var icon   = new OpenLayers.Icon('http://openstreetmap.cz/img/guidepost.png');

    var feature = new OpenLayers.Feature(markers, ll, icon); 
    feature.closeBox = true;
    feature.popupClass = popupClass;
    feature.data.popupContentHTML = popupContentHTML;
    feature.data.overflow = (overflow) ? "auto" : "hidden";

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

    markers.addMarker(marker);
}

function handler(request) 
{
  AutoSizeFramedCloudMaxSize = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
    'autoSize': true,
    'maxSize': new OpenLayers.Size(450,450)
  });

  var markers = new OpenLayers.Layer.Markers( "Markers" );
  map.addLayer(markers);

  //alert(request.responseText);
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
    html_content += " <img src='img/guidepost/"+b.name+"' width='180' alt='guidepost'>" 
    addMarker(markers, pos, popupClass, html_content, true, true);

//    markers.addMarker(marker);
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
