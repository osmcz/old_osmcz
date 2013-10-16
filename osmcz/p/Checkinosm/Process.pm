package Checkinosm::Process;

use Apache2::Reload;
use Apache2::RequestRec ();
use Apache2::RequestIO ();
use Apache2::URI ();
use Apache2::Connection ();
use Apache2::RequestRec ();
use Apache2::Access ();
#http://perl.apache.org/docs/2.0/api/Apache2/Access.html
use Apache2::Const -compile => qw(OK);

use Apache2::RequestRec ();
use Apache2::Access ();
use Apache2::Const -compile => qw(OK DECLINED HTTP_UNAUTHORIZED);

use APR::URI ();
use APR::Const -compile => qw(URI_UNP_REVEALPASSWORD);

use DBI;

use Data::Dumper;
use Scalar::Util qw(looks_like_number);
use JSON;

################################################################################
sub connect_db
################################################################################
{
  my $dbfile = '/home/walley/www/mapy/c';
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

  # get the client-supplied credentials
  my ($status, $password) = $r->get_basic_auth_pw;
  my ($auth_type, $auth_name) = ($r->auth_type, $r->auth_name);

  # only continue if Apache says everything is OK
  return $status unless $status == Apache::OK;

  if ($r->user eq "") {
    $r->note_basic_auth_failure;
    return Apache2::Const::HTTP_UNAUTHORIZED;
  }

  if ($r->user eq 'walley' && $password eq 'a') {
  } else {
    $r->note_basic_auth_failure;
    return Apache2::Const::HTTP_UNAUTHORIZED;
#    return Apache2::DECLINED;
  }


#  print $r->user . " $status, $password, $auth_type, $auth_name";

  my $uri = $r->uri;      # what does the URI (URL) look like ?

  &connect_db();

  my $query_string = $r->args;

#  @uri_components = split("/", $uri);

  if ($uri =~ "/nearby/") {
## list nearby
    my ($a0, $a1, $lat, $lon)  = split("/", $uri);
    print &get_nearby($lat, $lon);
  } elsif ($uri =~ "/checkin/checkin/") {
## checkin
    my ($a0, $a1, $a2, $place)  = split("/", $uri);
    &checkin($r->user, $place)
  } elsif ($uri =~ "/checkin/history/") {
## checkin
    my ($a0, $a1, $a2, $place)  = split("/", $uri);
    &history($r->user);
  }

   $dbh->disconnect;
   return Apache2::Const::OK;
}

################################################################################
sub get_nearby
################################################################################
{
  my ($lat, $lon) = @_;

  $maxlat = $lat + 0.1;
  $maxlon = $lon + 0.1;
  $minlat = $lat - 0.1;
  $minlon = $lon - 0.1;

  @AoA = (
           [ "1234567890", "49.0", "17.0", "hospoda u pajzlu1", "www.pajzl.cz","1" ],
           [ "1234567891", "49.1", "17.1", "hospoda u aajzlu2", "www.pajzl.cz","2" ],
           [ "1234567892", "49.2", "17.2", "hospoda u bajzlu3", "www.pajzl.cz","3" ],
           [ "1234567893", "49.3", "17.3", "hospoda u cajzlu4", "www.pajzl.cz","4" ],
           [ "1234567894", "49.4", "17.4", "hospoda u dajzlu5", "www.pajzl.cz","5" ],
           [ "1234567895", "49.5", "17.5", "hospoda u eajzlu6", "www.pajzl.cz","6" ],
           [ "1234567896", "49.6", "17.6", "hospoda u gajzlu7", "www.pajzl.cz","7" ],
           [ "1234567897", "49.7", "17.7", "hospoda u hajzlu8", "www.pajzl.cz","8" ],
           [ "1234567898", "49.8", "17.8", "hospoda u wwwwww8", "www.pajzl.cz","8" ],
           [ "1234567899", "49.9", "17.9", "hospoda u xxxxxx8", "www.pajzl.cz","0" ],
           [ "1234567900", "50.0", "18.0", "hospoda u yyyyyy8", "www.pajzl.cz","8" ],
    );

  $json = encode_json \@AoA;

  my $query = "select * from guidepost where lat < $maxlat and lat > $minlat and lon < $maxlon and lon > $minlon";

  return $json;
}

################################################################################
sub get_user_id
################################################################################
{
  my ($user) = @_;
  $query = "select id from users where users.name='$user'";
  $query_handle = $dbh->prepare($query) or print "konec>".$DBI::errstr;;
  $query_handle->execute() or die $DBI::errstr;
  while(@data = $query_handle->fetchrow_array()) {
    $id = $data[0];
  }
  return $id;
}

################################################################################
sub checkin
################################################################################
{

  my ($user, $place) = @_;

  my $user_id = &get_user_id($user);

  my $time = time;
  $query = "insert into checkins values (NULL, $user_id, $time, $place)";
  print $user.$place.$query;
  $query_handle = $dbh->prepare($query) or print "konec>";
  $query_handle->execute();
  print $DBI::errstr;

}

################################################################################
sub parse_template
################################################################################
{
  my ($filename) = @_;
  my $datadir = "http://openstreetmap.cz/t/";
  open($h, "<", $filename) or die;
  while (<$h>) {
    s/\[DATADIR\]/$datadir/g;
    print;
  }
  print $tmpl;
}

################################################################################
sub table_header
################################################################################
{
  parse_template("/var/www/mapy/t/table_header.tmpl");
}

################################################################################
sub table_footer
################################################################################
{
  parse_template("/var/www/mapy/t/table_footer.tmpl");
}

################################################################################
sub thead()
################################################################################
{

  my $sth = $dbh->prepare( "PRAGMA table_info(checkins)" );
  $sth->execute();

  print "<thead>
         <tr>";

  my @row;
  while (@row = $sth->fetchrow_array()) {
    print "<th>".$row[1]."</th>\n";
  }

  print "</tr>";
  print "</thead>";

}

################################################################################
sub history
################################################################################
{

  my ($user, $place) = @_;

#  my $user_id = &get_user_id($user);

  &table_header();

  my $time = time;

  $query = "select 
              checkins.id,users.name,checkins.date,checkins.place 
            from 
              checkins,users 
            where 
              users.name='$user' and checkins.user=users.id";

  $res = $dbh->selectall_arrayref($query);
  print $DBI::errstr;

  &thead();

  print "<tbody>\n";
  foreach my $row (@$res) {
    my ($id, $user, $date, $place) = @$row;
    my @row_data = @$row;
    print "<tr class='odd'>\n";
    foreach (@row_data) {
     print "<td>".$_."</td>";
    }
    print "</tr>\n";
  }
  print "</tbody>\n";

  &table_footer();

  print $DBI::errstr;
  print $user_id.$place.$query;

}

1;
