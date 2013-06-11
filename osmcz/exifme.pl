#!/usr/bin/perl
use DBI;
use File::Basename;
use File::Copy;


#GPS Latitude : N 49d 43m 49.22s
#GPS Longitude: E 17d 17m 56.25s

# insert into guidepost values (NULL, 50.1, 17.1, 'x', 'znacka');

$debug = 0;

if ($debug) {print "start<br>\n";}

if (scalar @ARGV == 0) {die("not enough parameters, died");}

$i = $ARGV[0];
$author = $ARGV[1];
$new_location = $ARGV[2];
@output = `jhead $i`;

@exiflat = grep(/^GPS Latitude/, @output);
@exiflon = grep(/^GPS Longitude/, @output);

if (!scalar(@exiflat) || !scalar(@exiflon)) {
  if ($debug) {print "No geo info\n"};
  exit 1;
}

@l1 = split (" ", substr($exiflat[0], 14));
@l2 = split (" ", substr($exiflon[0], 14));

foreach (@l1) {chop();}
foreach (@l2) {chop();}

$lat = $l1[1] + $l1[2] / 60 + $l1[3] / 3600;
$lon = $l2[1] + $l2[2] / 60 + $l2[3] / 3600;
if ($debug) {print "vysledek: $lat $lon\n";}

move("uploads/".basename($i),$new_location.basename($i)) or die;

my $dbfile = 'guidepost';
my $dbh = DBI->connect("dbi:SQLite2:dbname=$dbfile","","",{ RaiseError => 1 },) or die $DBI::errstr;
$q = "insert into guidepost values (NULL, $lat, $lon, '".$new_location.basename($i)."','".basename($i)."', '$author');\n";
if ($debug) {print $q;}
$dbh->do($q) or die;
$dbh->disconnect();
if ($debug) {print "done\n";}
exit 0;
