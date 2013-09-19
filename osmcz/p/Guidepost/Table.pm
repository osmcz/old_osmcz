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

  if ($uri =~ "table\/all") {
    print "<h1>all</h1>\n";
  } elsif ($uri =~ /goodbye/) {
    say_goodbye($r);
  } elsif ($uri =~ "/table/count") {
    print &get_gp_count();
  } elsif ($uri =~ "/table/get") {
    &table_get();
  }

sub table_get
{

#    print Dumper(\%ENV);
#    connection_info($r->connection);

#    print "Uri: $uri";
    my $query_string = $r->args;
#    $r->print("query string was: $query_string\n" );

#    print "<hr>\n";

    @uri_components = split("/", $uri);

#    foreach my $i (@uri_components) {
#      print "x:".$i;
#    }
    my $from_gp = looks_like_number($uri_components[3]) ? $uri_components[3] : 0;
    my $to_gp = looks_like_number($uri_components[4]) ? $uri_components[4] : 0;
    print "<h1>from ($from_gp) ($to_gp)</h1><hr>";

    &connect_db();

  my $query = "select * from guidepost LIMIT " . ($to_gp - $from_gp) . " OFFSET $from_gp";
  print $query;
  $res = $dbh->selectall_arrayref($query);
  print $DBI::errstr;

  foreach my $row (@$res) {
    my ($id, $lat, $lon, $url, $name, $attribution) = @$row;
    &gp_line($id, $lat, $lon, $url, $name, $attribution);
    print "</p>\n";
  }

}



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




#   foreach( @$res ) {
#    foreach $i (0..$#$_) {
#       print "$_->[$i] ";
#       }
#    print "\n";
#   }

   $dbh->disconnect;
   return Apache2::Const::OK;
}

################################################################################
sub gp_line()
################################################################################
{
  my ($id, $lat, $lon, $url, $name, $attribution) = @_;

  print "<hr>\n";
  print "<div class='gp_line'>\n";
  print "<p>\n";
  print "<h2>$id</h2>";
  print "lat lon:$lat $lon";
  print "by $attribution";
  $full_uri = "http://openstreetmap.cz/".$url;
  print "<a href='$full_uri'><img src='$full_uri' width='100px'>$name</a>";
  print "</p>\n";

  print "<p>\n";
  print "<img src='http://staticmap.openstreetmap.de/staticmap.php?center=$lat,$lon&zoom=14&size=200x200&maptype=mapnik&markers=$lat,$lon,lightblue1' />";
  print "<hr>\n";
  print "</div>\n";

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

1;
