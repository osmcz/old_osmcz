#!/usr/bin/perl
use DBI;
use File::Basename;
use File::Copy;


#0x0001|N                                                                       
#0x0002|50.00, 1.00, 29.61                                                      
#0x0003|E                                                                       
#0x0004|14.00, 23.00, 40.41                                                     
#0x0005|0x00                                                                    
#0x0006|193.39 


# insert into guidepost values (NULL, 50.1, 17.1, 'x', 'znacka');

print "start\n";
$i = $ARGV[0];
$author = $ARGV[1];
$new_location = $ARGV[2];
@output = `exif -i $i`;
@exiflat = grep(/^0x0002/, @output);
@exiflon = grep(/^0x0004/, @output);

if (!scalar(@exiflat) || !scalar(@exiflon)) {
  print "No geo info\n";
  exit;
}
@l1 = split (", ",substr($exiflat[0], 7));
@l2 = split (", ",substr($exiflon[0], 7));
$lat = $l1[0]+$l1[1]/60+$l1[2]/3600;
$lon = $l2[0]+$l2[1]/60+$l2[2]/3600;
print "$lat $lon\n";
my $dbfile = 'guidepost';
my $dbh = DBI->connect("dbi:SQLite2:dbname=$dbfile","","",{ RaiseError => 1 },) or die $DBI::errstr;
print"cont";
$q = "insert into guidepost values (NULL, $lat, $lon, '".$i."','".basename($i)."', '$author');\n";
print $q;
$dbh->do($q) or die;
print "sql executed";
$dbh->disconnect();
move(basename($i),$new_location);
print "done";
