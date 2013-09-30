package Checkinosm::Process;

use Apache2::Reload;
use Apache2::RequestRec ();
use Apache2::RequestIO ();
use Apache2::URI ();
use APR::URI ();
use Apache2::Connection ();
use Apache2::RequestRec ();
use Apache2::Access ();
#http://perl.apache.org/docs/2.0/api/Apache2/Access.html
use APR::Const -compile => qw(URI_UNP_REVEALPASSWORD);
use Apache2::Const -compile => qw(OK);

use DBI;

use Data::Dumper;
use Scalar::Util qw(looks_like_number);
use JSON;

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

#  @uri_components = split("/", $uri);

  if ($uri =~ "/nearby/") {
    my ($a0, $a1, $lat, $lon)  = split("/", $uri);
    print &get_nearby($lat, $lon);
  } elsif ($uri =~ "/checkin/") {
    print "<h1>checkin</h1>\n";
#    &table_get($uri_components[3], $uri_components[4]);
  }

   $dbh->disconnect;
   return Apache2::Const::OK;
}

sub get_nearby
{
  my ($lat, $lon) = @_;

  $maxlat = $lat + 0.1;
  $maxlon = $lon + 0.1;
  $minlat = $lat - 0.1;
  $minlon = $lon - 0.1;

  my %rec_hash = ('a' => 1, 'b' => 2, 'c' => 3, 'd' => 4, 'e' => 5);
  my $json = encode_json \%rec_hash;

  @AoA = (
           [ "49.0", "17.0", "hospoda u pajzlu", "www.pajzl.cz","5" ],
           [ "49.1", "17.1", "hospoda u aajzlu", "www.pajzl.cz","5" ],
           [ "49.2", "17.2", "hospoda u bajzlu", "www.pajzl.cz","5" ],
           [ "49.3", "17.3", "hospoda u cajzlu", "www.pajzl.cz","5" ],
           [ "49.4", "17.4", "hospoda u dajzlu", "www.pajzl.cz","5" ],
           [ "49.5", "17.5", "hospoda u eajzlu", "www.pajzl.cz","5" ],
           [ "49.6", "17.6", "hospoda u gajzlu", "www.pajzl.cz","5" ],
           [ "49.7", "17.7", "hospoda u hajzlu", "www.pajzl.cz","5" ],
    );

#   $ref_to_AoA = [
#        [ "fred", "barney", "pebbles", "bambam", "dino", ],
#        [ "homer", "bart", "marge", "maggie", ],
#        [ "george", "jane", "elroy", "judy", ],
#    ];

  $json = encode_json \@AoA;
#  $json = encode_json $ref_to_AoA;

  my $query = "select * from guidepost where lat < $maxlat and lat > $minlat and lon < $maxlon and lon > $minlon";

  return $json;
}

1;
