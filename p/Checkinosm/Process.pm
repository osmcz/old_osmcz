package Checkinosm::Process;

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

  if ($uri =~ "/nearby/") {
    print "<h1>all</h1>\n";
  } elsif ($uri =~ "/checkin/") {
    print "<h1>checkin</h1>\n";
#    &table_get($uri_components[3], $uri_components[4]);
  }

   $dbh->disconnect;
   return Apache2::Const::OK;
}

1;
