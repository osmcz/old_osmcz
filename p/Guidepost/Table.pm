package Guidepost::Table;

use Apache2::Reload;
use Apache2::RequestRec ();
use Apache2::RequestIO ();
use Apache2::Const -compile => qw(OK);
use DBI;


  sub handler {
    my($r) = @_;    # grab the request info "object" that mod_perl has
#      my $r = shift;
    $r->content_type('text/html');

#    %ENV  = $r->cgi_env;


    my $uri = $r->uri;      # what does the URI (URL) look like ?
print $uri;

    my $query_string = $r->args;
    $r->print( "Hello world! Your query string was: $query_string\n" );
    if ($uri =~ "table\/all") {
print "<h1>all</h1>\n";
    } elsif ($uri =~ /goodbye/) {
say_goodbye($r);
    }

     print "mod_perl 2.0 rocks!\n";

#    $r->status = 200;       # All's ok, so set a "200 OK" status
#    $r->send_http_header;   # Now send the http headers.

my $dbfile = '/var/www/mapy/guidepost';
my $dbh = DBI->connect( "dbi:SQLite:$dbfile" );
if (!$dbh) {
  &debuglog("db failed","Cannot connect: ".$DBI::errstr);
  die;
}
print "result\n";

my $query = "select * from guidepost";# where id < 20";
$res = $dbh->selectall_arrayref($query);

print $DBI::errstr;

print'<script src="http://www.openlayers.org/api/OpenLayers.js"></script>
<script src="http://www.openstreetmap.org/openlayers/OpenStreetMap.js"></script>
';

foreach my $row (@$res) {
  my ($id, $lat, $lon, $url, $name, $attribution) = @$row;
  print "<p>\n";
  print "$id, $lat, $lon, $url, $name, $attribution";
  print "</p>\n";

  print "<p>\n";
  print "<img src='http://staticmap.openstreetmap.de/staticmap.php?center=$lat,$lon&zoom=14&size=200x200&maptype=mapnik&markers=$lat,$lon,lightblue1' />";

#print '
#<div id="map" style="width:200px;height:200px;"></div>
#<script type="text/javascript">
#var map; 
#function showMap(){ 
#map = new OpenLayers.Map("map"); var mapnik = new OpenLayers.Layer.OSM(); map.addLayer(mapnik); map.setCenter(new OpenLayers.LonLat('.$lon.",".$lat.').transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 16); 
#map.addLayer(new OpenLayers.Layer.Markers()); 
#var marker = new OpenLayers.Marker(map.getCenter()); 
#map.layers[map.layers.length-1].addMarker(marker); 
#} 
#showMap();
#</script>
#';

  print "</p>\n";

}


#   foreach( @$res ) {
#    foreach $i (0..$#$_) {
#       print "$_->[$i] ";
#       }
#    print "\n";
#   }

   $dbh->disconnect;
   

      return Apache2::Const::OK;
  }
  1;
