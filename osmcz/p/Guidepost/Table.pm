package Guidepost::Table;

use Apache2::Reload;
use Apache2::RequestRec ();
use Apache2::RequestIO ();
use Apache2::URI ();
use APR::URI ();
use Apache2::Connection ();
use Apache2::RequestRec ();

use APR::Const -compile => qw(URI_UNP_REVEALPASSWORD);
use Apache2::Const -compile => qw(OK);

use DBI;

use Data::Dumper;
use Scalar::Util qw(looks_like_number);

my $dbh;

sub connection_info
{
  my ($c) = @_;
  print $c->id();
  print $c->local_addr();
  print $c->remote_addr();
  print $c->local_host();
  print $c->get_remote_host();
  print $c->remote_host();
  print $c->local_ip();
  print $c->remote_ip();
}

sub rrr
{
   $parsed_uri = $r->parsed_uri();

    print "s".$parsed_uri->scheme;print "<br>";
    print "u".$parsed_uri->user;print "<br>";
    print "pw".$parsed_uri->password;print "<br>";
    print "h".$parsed_uri->hostname;print "<br>";
    print "pt".$parsed_uri->port;print "<br>";
    print "pa".$parsed_uri->path;print "<br>";
    print "rpa".$parsed_uri->rpath;print "<br>";
    print "q".$parsed_uri->query;print "<br>";
    print "f".$parsed_uri->fragment;print "<br>";
    print "<hr>\n";
 }

################################################################################
sub connect_db
################################################################################
{
  my $dbfile = '/var/www/mapy/guidepost';
  $dbh = DBI->connect( "dbi:SQLite:$dbfile" );
  if (!$dbh) {
    &debuglog("db failed","Cannot connect: ".$DBI::errstr);
    die;
  }
}

################################################################################
sub handler 
################################################################################
{
  my $r = shift;
  $r->content_type('text/html');
  my $uri = $r->uri;      # what does the URI (URL) look like ?

  &connect_db();

  my $query_string = $r->args;
  @uri_components = split("/", $uri);

  if ($uri =~ "table\/all") {
    print "<h1>all</h1>\n";
  } elsif ($uri =~ /goodbye/) {
    say_goodbye($r);
  } elsif ($uri =~ "/table/count") {
    print &get_gp_count();
  } elsif ($uri =~ "/table/get") {
    &table_get($uri_components[3], $uri_components[4]);
  } elsif ($uri =~ "/table/leaderboard") {
    &leaderboard();
  }

#    print Dumper(\%ENV);
#    connection_info($r->connection);

#    $r->status = 200;       # All's ok, so set a "200 OK" status
#    $r->send_http_header;   # Now send the http headers.

#my $dbfile = '/var/www/mapy/guidepost';
#$dbh = DBI->connect( "dbi:SQLite:$dbfile" );
#if (!$dbh) {
#  &debuglog("db failed","Cannot connect: ".$DBI::errstr);
#  die;
#}
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

   $dbh->disconnect;
   return Apache2::Const::OK;
}

################################################################################
sub table_get
################################################################################
{
  my ($pf, $pt) = @_;

  my $from_gp = looks_like_number($pf) ? $pf : 0;
  my $to_gp = looks_like_number($pt) ? $pt : 0;
  print "<h1>from ($pf $pt) ($from_gp) ($to_gp)</h1><hr>";

  &connect_db();

  my $query = "select * from guidepost LIMIT " . ($to_gp - $from_gp) . " OFFSET $from_gp";
#  print $query;
  $res = $dbh->selectall_arrayref($query);
  print $DBI::errstr;

  foreach my $row (@$res) {
    my ($id, $lat, $lon, $url, $name, $attribution) = @$row;
    &gp_line($id, $lat, $lon, $url, $name, $attribution);
    print "</p>\n";
  }

}

################################################################################
sub play_badge()
################################################################################
{
print '<a href="https://play.google.com/store/apps/details?id=org.walley.guidepost">
  <img alt="Android app on Google Play"
       src="https://developer.android.com/images/brand/en_app_rgb_wo_45.png" />
</a>';

}

################################################################################
sub leaderboard
################################################################################
{

  &page_header();
  print "<h1>Leaderboard</h1>";

  my $query = "select attribution, count (*) as num from guidepost group by attribution order by num desc";
  my $pos = 1;

  $res = $dbh->selectall_arrayref($query);
  print $DBI::errstr;

  &play_badge();

  print "<table>\n";
  print "<tr><th>position</th><th>name</th><th>count</th></tr>";
  foreach my $row (@$res) {
    my ($name, $count) = @$row;
    print "<tr><td>" . $pos++. "</td><td>$name</td><td>$count</td></tr>";
  }
  print "</table>\n";
  &page_footer();

}

################################################################################
sub gp_line()
################################################################################
{
  my ($id, $lat, $lon, $url, $name, $attribution) = @_;

  print "<hr>\n";
  print "<div class='gp_line'>\n";
  print "<p class='location'>\n";
  print "<h2>$id</h2>";
  print "latitude: $lat<br>";
  print "longtitude: $lon<br>";
  print "by $attribution<br>";
  print "</p>\n";

  print "<span class='maplinks'>\n";
  print "<ul>";
  print "<li><a href='http://maps.yahoo.com/#mvt=m&lat=$lat&lon=$lon&mag=6&q1=$lat,$lon'>Yahoo</a>";
  print "<li><a href='http://www.openstreetmap.org/?mlat=$lat&mlon=$lon&zoom=16#map=16/$lat/$lon'>OSM</a>";
  print "<li><a href='https://maps.google.com/maps?ll=$lat,$lon&q=loc:$lat,$lon&hl=en&t=m&z=16'>Google</a>";
  print "<li><a href='http://www.bing.com/maps/?v=2&cp=$lat~$lon&style=r&lvl=16'>Bing</a>";
  print "<li><a href='http://www.mapy.cz/?st=search&fr=loc:".$lat."N ".$lon."E'>Mapy.cz</a>";
  print "</ul>\n";
  print "</span>\n";

  $full_uri = "http://openstreetmap.cz/".$url;
  print "<p class='image'>\n";
  print "<a href='$full_uri'><img src='$full_uri' height='150px'><br>$name</a>";
  print "</p>\n";
  print "<span class='staticmap'>\n";

  $static_map = "http://open.mapquestapi.com/staticmap/v4/getmap?key=Fmjtd%7Cluu22qu1nu%2Cbw%3Do5-h6b2h&center=$lat,$lon&zoom=14&size=200,200&type=map&imagetype=png&pois=";
#  print "<img src='http://staticmap.openstreetmap.de/staticmap.php?center=$lat,$lon&zoom=14&size=200x200&maptype=mapnik&markers=$lat,$lon,lightblue1' />";
  print "<img src='".$static_map."'/>";
  print "</span>\n";
  print "</div>\n";
  print "<hr>\n";

}

################################################################################
sub get_gp_count
################################################################################
{
  my $query = "select count() from guidepost";
  my $sth = $dbh->prepare($query);
  my $rv = $sth->execute() or die $DBI::errstr;
  my @row = $sth->fetchrow_array();
  return $row[0];
}

################################################################################
sub page_header()
################################################################################
{
print '
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>openstreetmap.cz guidepost editor</title>
</head>
<body>
';
}

################################################################################
sub page_footer()
################################################################################
{
print '
</body>
</html>
';
}

1;
