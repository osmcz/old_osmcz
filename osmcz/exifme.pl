#!/usr/bin/perl
use DBI;
use File::Basename;
use File::Copy;


#GPS Latitude : N 49d 43m 49.22s
#GPS Longitude: E 17d 17m 56.25s

# insert into guidepost values (NULL, 50.1, 17.1, 'x', 'znacka');

$debug = 0;

 &debuglog("exifme", "start");

if (scalar @ARGV == 0) {die("not enough parameters, died");}

$i = $ARGV[0];
$author = $ARGV[1];
$new_location = $ARGV[2];
@output = `jhead $i`;

print @output;
&debuglog("params:",$i,$author,$new_location);

@exiflat = grep(/^GPS Latitude/, @output);
@exiflon = grep(/^GPS Longitude/, @output);

if (!scalar(@exiflat) || !scalar(@exiflon)) {
  &debuglog("No geo info");
  exit 1;
}

@l1 = split (" ", substr($exiflat[0], 14));
@l2 = split (" ", substr($exiflon[0], 14));

foreach (@l1) {chop();}
foreach (@l2) {chop();}

$lat = $l1[1] + $l1[2] / 60 + $l1[3] / 3600;
$lon = $l2[1] + $l2[2] / 60 + $l2[3] / 3600;
&debuglog( "vysledek: $lat $lon");

my $filename;
if (-e $new_location.basename($i)) {
  $r = int(rand(1000));
  $url = $new_location.$r.basename($i);
  $filename = $r.basename($i);
  &debuglog("file exists, renamed to $filename");
} else {
  $url = $new_location.basename($i);
  $filename = $r.basename($i);
}

$res = move("uploads/".basename($i),$url);

if (!$res) {
  &debuglog("moving failed","uploads/".basename($i),$url);
  die;
}

my $dbfile = 'guidepost';
my $dbh = DBI->connect( "dbi:SQLite:$dbfile" );
if (!$dbh) {
  &debuglog("db failed","Cannot connect: ".$DBI::errstr);
  die;
}

$q = "insert into guidepost values (NULL, $lat, $lon, '".$url."','".$filename."', '$author');\n";
&debuglog($q);

$res = $dbh->do($q);
if (!$res) {
  &debuglog("query failed","Cannot connect: $DBI::errstr");
  die;
}
$dbh->disconnect();

&debuglog("done");
exit 0;

#  $row_id = $dbh->sqlite_last_insert_rowid();

sub debuglog
{
  $x = join("-",@_);
  system ("/usr/bin/logger -t guidepost '$x'");
}
