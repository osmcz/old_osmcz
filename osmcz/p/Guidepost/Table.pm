package Guidepost::Table;

use Apache2::Reload;
use Apache2::RequestRec ();
use Apache2::RequestIO ();
use Apache2::Const -compile => qw(OK);
use DBI;


  sub handler {
      my $r = shift;
      $r->content_type('text/html');
      print "mod_perl 2.0 rocks!\n";

my $dbfile = '/var/www/mapy/guidepost';
my $dbh = DBI->connect( "dbi:SQLite:$dbfile" );
if (!$dbh) {
  &debuglog("db failed","Cannot connect: ".$DBI::errstr);
  die;
}
print "bla kokot\n";

my $query = "select * from guidepost";
$res = $dbh->selectall_arrayref($query);

print'<script src="http://www.openlayers.org/api/OpenLayers.js"></script>
<script src="http://www.openstreetmap.org/openlayers/OpenStreetMap.js"></script>
';

foreach my $row (@$res) {
  my ($id, $lat, $lon, $url, $name, $attribution) = @$row;
  print "<p>\n";
  print "$id, $lat, $lon, $url, $name, $attribution";
  print "</p>\n";

  print "<p>\n";
print '
<div id="map" style="width:200px;height:200px;"></div>
<script type="text/javascript">
var map; 
function showMap(){ 
map = new OpenLayers.Map("map"); var mapnik = new OpenLayers.Layer.OSM(); map.addLayer(mapnik); map.setCenter(new OpenLayers.LonLat('.$lon.",".$lat.').transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 16); 
map.addLayer(new OpenLayers.Layer.Markers()); 
var marker = new OpenLayers.Marker(map.getCenter()); 
map.layers[map.layers.length-1].addMarker(marker); 
} 
showMap();
</script>
';

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
