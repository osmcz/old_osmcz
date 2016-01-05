package Guidepost::Table;

use Apache2::Reload;
use Apache2::RequestRec ();
use Apache2::RequestIO ();
use Apache2::URI ();

use APR::URI ();
use APR::Brigade ();
use APR::Bucket ();
use Apache2::Filter ();

#use Apache2::Const -compile => qw(MODE_READBYTES);
#use APR::Const    -compile => qw(SUCCESS BLOCK_READ);

use constant IOBUFSIZE => 8192;
use Apache2::Connection ();
use Apache2::RequestRec ();

use APR::Const -compile => qw(URI_UNP_REVEALPASSWORD);
use Apache2::Const -compile => qw(OK);

use DBI;

use Data::Dumper;
use Scalar::Util qw(looks_like_number);

use Geo::JSON;
use Geo::JSON::Point;
use Geo::JSON::Feature;
use Geo::JSON::FeatureCollection;

use Sys::Syslog;                        # all except setlogsock()
use HTML::Entities;

use File::Copy;
#use Encode::decode_utf8();
use Encode;

#use utf8;
#binmode STDIN, ':utf8';
#binmode STDOUT, ':utf8';


my $dbh;
my $BBOX = 0;
my $minlon;
my $minlat;
my $maxlon;
my $maxlat;


################################################################################
sub handler
################################################################################
{
  $r = shift;
  openlog('guidepostapi', 'cons,pid', 'user');

#  syslog('info', 'start method:'. $r->method());

  $r->content_type('text/html');
  my $uri = $r->uri;      # what does the URI (URL) look like ?
  &parse_query_string($r);
  &parse_post_data($r);

  if (exists $currargs{bbox}) {
    &parse_bbox($currargs{bbox});
  }

  if (!exists $currargs{output}) {
    $OUTPUT_FORMAT = "html";
  } elsif ($currargs{output} eq "geojson") {
    $OUTPUT_FORMAT = "geojson";
  } elsif ($currargs{output} eq "kml") {
    $OUTPUT_FORMAT = "kml";
  } else {
    $OUTPUT_FORMAT = "html";
  }

  &connect_db();

  @uri_components = split("/", $uri);

  foreach $text (@uri_components) {
    $text =~ s/[^A-Za-z0-9ěščřžýáíéĚŠČŘŽÝÁÍÉůúŮÚ]//g;
  }

  if ($uri =~ "table\/all") {
    my $query = "select * from guidepost";
    if ($BBOX) {
      $query .= " where ".&add_bbox();
    }
    &output_data($query);
  } elsif ($uri =~ /goodbye/) {
    &say_goodbye($r);
  } elsif ($uri =~ "/table/count") {
    print &get_gp_count();
  } elsif ($uri =~ "/table/get") {
    &table_get($uri_components[3], $uri_components[4]);
  } elsif ($uri =~ "/table/leaderboard") {
    &leaderboard();
  } elsif ($uri =~ "/table/ref") {
    &show_by_ref($uri_components[3]);
  } elsif ($uri =~ "/table/id") {
    &show_by_id($uri_components[3]);
  } elsif ($uri =~ "/table/name") {
    &show_by_name($uri_components[3]);
  } elsif ($uri =~ "/table/note") {
    &show_by($uri_components[3],"note");
  } elsif ($uri =~ "/table/setbyid") {
    &set_by_id($post_data{id}, $post_data{value});
  } elsif ($uri =~ "isedited") {
    #/isedited/ref/id
    &is_edited($uri_components[3], $uri_components[4]);
  } elsif ($uri =~ "isdeleted") {
    &is_deleted($uri_components[3]);
  } elsif ($uri =~ "/table/approve") {
    &approve_edit($uri_components[3]);
  } elsif ($uri =~ "/table/reject") {
    &reject_edit($uri_components[3]);
  } elsif ($uri =~ "/table/review") {
    &review_form();
  } elsif ($uri =~ "/table/delete") {
    &delete_id($uri_components[3]);
  } elsif ($uri =~ "/table/remove") {
    &remove($uri_components[3]);
  }

#Dumper(\%ENV);
#    connection_info($r->connection);

#    $r->status = 200;       # All's ok, so set a "200 OK" status
#    $r->send_http_header;   # Now send the http headers.

   $dbh->disconnect;
   return Apache2::Const::OK;
}

################################################################################
sub connection_info
################################################################################
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

################################################################################
sub rrr
################################################################################
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
sub say_goodbye
################################################################################
{
  my $r = shift;
  print $r->args;

  &parse_query_string($r);

  foreach (sort keys %currargs) {
    print "$_ : $currargs{$_}\n";
  }
}

################################################################################
sub smartdecode
################################################################################
{
  use URI::Escape qw( uri_unescape );
  my $x = my $y = uri_unescape($_[0]);
  return $x if utf8::decode($x);
  return $y;
}

################################################################################
sub parse_query_string
################################################################################
{
  my $r = shift;

  %currargs = map { split("=",$_) } split(/&/, $r->args);

  #sanitize
  foreach (sort keys %currargs) {
    $currargs{$_} =~ s/\%2C/,/g;
    if (lc $_ eq "bbox" ) {
      $currargs{$_} =~ s/[^A-Za-z0-9\.,-]//g;
    } else {
      $currargs{$_} =~ s/[^A-Za-z0-9 ]//g;
    }
    syslog('info', "getdata " . $_ . "=" . $currargs{$_});
  }
}

################################################################################
sub parse_post_data
################################################################################
{
  my $r = shift;

  $raw_data = decode_entities(&read_post($r));

  %post_data = map { split("=",$_) } split(/&/, $raw_data);

  #sanitize
  foreach (sort keys %post_data) {
    syslog('info', "postdata before " . $_ . "=" . $post_data{$_});
    $post_data{$_} = &smartdecode($post_data{$_});
    $post_data{$_} =~ s/\+/ /g;
    $post_data{$_} =~ s/\%2F/\//g;
    $post_data{$_} =~ s/\%2C/,/g;
    syslog('info', "postdata after decode " . $_ . "=" . $post_data{$_});

    if (lc $_ eq "id" ) {
      $post_data{$_} =~ s/[^A-Za-z0-9_\/]//g;
    } elsif (lc $_ eq "value" ) {
      syslog('info',"value");
      $post_data{$_} =~ s/[^A-Za-z0-9_ \p{IsLatin}\/,]//g;
    } else {
      $post_data{$_} =~ s/[^A-Za-z0-9 ]//g;
    }
    syslog('info', "postdata " . $_ . "=" . $post_data{$_});
  }
}

################################################################################
sub connect_db
################################################################################
{
  my $dbfile = '/var/www/mapy/guidepost';
  $dbh = DBI->connect( "dbi:SQLite:$dbfile" );
  if (!$dbh) {
#    &debuglog("db failed","Cannot connect: ".$DBI::errstr);
    die;
  }
  my $sql = qq{SET NAMES 'utf8';};
  $dbh->do($sql);
}

################################################################################
sub parse_bbox
################################################################################
{
  my $b = shift;
#BBox=-20,-40,60,40

  #print $b;

  @bbox = split(",", $b);
  $minlon = $bbox[0];
  $minlat = $bbox[1];
  $maxlon = $bbox[2];
  $maxlat = $bbox[3];
  $BBOX = 1;
}

################################################################################
sub add_bbox
################################################################################
{
  if ($BBOX) {
    return "lat < $maxlat and lat > $minlat and lon < $maxlon and lon > $minlon";
  }
}

################################################################################
sub show_by_ref
################################################################################
{
  my $ref = shift;
  &show_by($ref,'ref');
}

################################################################################
sub show_by_id
################################################################################
{
  my $id = shift;
  &show_by($id,'id');
}

################################################################################
sub show_by
################################################################################
{
  my ($val, $what) = @_;

  syslog('info', "show_by($val, $what)");

  my $query = "select * from guidepost where $what='$val'";

  if ($BBOX) {
    $query .= " and ".&add_bbox();
  }

  &output_data($query);
}

################################################################################
sub show_by_name
################################################################################
{
  my $name = shift;

  my $query = "select * from guidepost where attribution='$name'";

  if ($BBOX) {
    $query .= " and ".&add_bbox();
  }
  &output_data($query);
}

################################################################################
sub output_data
################################################################################
{
  my ($query) = @_;

  if ($OUTPUT_FORMAT eq "html") {
    output_html($query);
  } elsif ($OUTPUT_FORMAT eq "geojson") {
    output_geojson($query);
  } elsif ($OUTPUT_FORMAT eq "kml") {
    output_kml($query);
  }
}

################################################################################
sub output_html
################################################################################
{
  my ($query) = @_;

  &page_header((
    "http://code.jquery.com/jquery-1.11.3.min.js", 
    "http://www.appelsiini.net/download/jquery.jeditable.mini.js",
    "http://api.openstreetmap.cz/wheelzoom.js"
    ));

  $res = $dbh->selectall_arrayref($query);
  if (!$res) {
    syslog("info", "output_html dberror" . $DBI::errstr);
    $out = "DB error";
    print $out;
    return;
  }

  foreach my $row (@$res) {
    my ($id, $lat, $lon, $url, $name, $attribution, $ref, $note) = @$row;
    $out .= &gp_line($id, $lat, $lon, $url, $name, $attribution, $ref, $note);
    $out .= "\n";
  }

  $out .= "<script>wheelzoom(document.querySelectorAll('img'));</script>";
  $out .= &init_inplace_edit();
  $out .= &page_footer();

#  $r->print($out);
  print $out;
}

################################################################################
sub output_geojson
################################################################################
{

  my ($query) = @_;

  my $pt;
  my $ft;
  my @feature_objects;

#  &connect_db();

#  my $query = "select * from guidepost";
  $res = $dbh->selectall_arrayref($query);
  print $DBI::errstr;

  foreach my $row (@$res) {
    my ($id, $lat, $lon, $url, $name, $attribution, $ref) = @$row;
    my $fixed_lat = looks_like_number($lat) ? $lat : 0;
    my $fixed_lon = looks_like_number($lon) ? $lon : 0;

    $pt = Geo::JSON::Point->new({
      coordinates => [$fixed_lon, $fixed_lat],
      properties => ["prop0", "value0"],
    });

    my %properties = (
      'ref' => $ref,
      'name' => $attribution,
      'id' => $id,
    );

    $ft = Geo::JSON::Feature->new({
      geometry   => $pt,
      properties => \%properties,
    });

    push @feature_objects, $ft;
  }


  my $fcol = Geo::JSON::FeatureCollection->new({
     features => \@feature_objects,
  });

  print $fcol->to_json."\n";
}


################################################################################
sub table_get
################################################################################
{
  my ($pf, $pt) = @_;

  my $from_gp = looks_like_number($pf) ? $pf : 0;
  my $to_gp = looks_like_number($pt) ? $pt : 0;
  print "<h1>from ($pf $pt) ($from_gp) ($to_gp)</h1><hr>";

  my $query = "select * from guidepost LIMIT " . ($to_gp - $from_gp) . " OFFSET $from_gp";
  $res = $dbh->selectall_arrayref($query);
  print $DBI::errstr;

  foreach my $row (@$res) {
    my ($id, $lat, $lon, $url, $name, $attribution, $ref, $note) = @$row;
    print &gp_line($id, $lat, $lon, $url, $name, $attribution, $ref, $note);
    print "</p>\n";
  }

  print &init_inplace_edit();
  print "<script>wheelzoom(document.querySelectorAll('img'));</script>";

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
sub init_inplace_edit()
################################################################################
{
  my $url = "http://api.openstreetmap.cz/table/setbyid";
  my $out = "";

  $out .= "<script>\n";
  $out .= "  \$('.edit').editable('" . $url. "', {\n";
  $out .= "     indicator   : 'Saving...',\n";
  $out .= "     cancel      : 'Cancel',\n";
  $out .= "     submit      : 'OK',\n";
  $out .= "     event       : 'click',\n";
  $out .= "     width       : 100,\n";
  $out .= "     select      : true,\n";
  $out .= "     placeholder : '" . &t("edited") . "',\n";
  $out .= "     tooltip     : '" . &t("Click to edit...") . "',\n";
  $out .= " 
  callback : function(value, settings) {
    console.log(this);
    console.log(value);
    console.log(settings);
  }
  ";
  $out .= "  });\n";
  $out .= "</script>\n";

  return $out;
}



################################################################################
sub maplinks()
################################################################################
{
  my ($lat, $lon) = @_;
  my $out = "<!-- maplinks -->";
#  $out .=  "<span class='maplinks'>\n";
  $out .=  "<span>\n";
  $out .=  "<ul>\n";
#  $out .=  "<li><a href='http://maps.yahoo.com/#mvt=m&lat=$lat&lon=$lon&mag=6&q1=$lat,$lon'>Yahoo</a>";
  $out .=  "<li><a href='http://www.openstreetmap.org/?mlat=$lat&mlon=$lon&zoom=16#map=16/$lat/$lon'>OSM</a>";
  $out .=  "<li><a href='https://maps.google.com/maps?ll=$lat,$lon&q=loc:$lat,$lon&hl=en&t=m&z=16'>Google</a>";
  $out .=  "<li><a href='http://www.bing.com/maps/?v=2&cp=$lat~$lon&style=r&lvl=16'>Bing</a>";
  $out .=  "<li><a href='http://www.mapy.cz/?st=search&fr=loc:".$lat."N ".$lon."E'>Mapy.cz</a>";
  $out .=  "<li><a href='http://mapy.idnes.cz/#pos=".$lat."P".$lon."P13'>idnes.cz</a>";
  $out .=  "</ul>\n";
  $out .=  "</span>\n";
  
  return $out;
}


################################################################################
sub static_map()
################################################################################
{
#minimap smallmap
  my ($lat, $lon) = @_;
  my $out = "<!-- static map -->";

  $static_map = "http://open.mapquestapi.com/staticmap/v4/getmap?key=Fmjtd%7Cluu22qu1nu%2Cbw%3Do5-h6b2h&center=$lat,$lon&zoom=15&size=200,200&type=map&imagetype=png&pois=x,$lat,$lon";
#  $out .=  "<img src='http://staticmap.openstreetmap.de/staticmap.php?center=$lat,$lon&zoom=14&size=200x200&maptype=mapnik&markers=$lat,$lon,lightblue1' />";

#  $out .=  "<span class='staticmap'>\n";
#  $out .=  "<span>\n";
  $out .=  "<img class='zoom' src='".$static_map."'/>";
#  $out .=  "</span>\n";

  return $out;
}


################################################################################
sub delete_button
################################################################################
{
  my $ret = "";
  $ret .= "<span title='" . &t("remove_picture") ."'>";
  $ret .= "delete <img src='http://api.openstreetmap.cz/img/delete.png' width=16 height=16>";
  $ret .= "</span>";
  return $ret;
}

################################################################################
sub id_stuff
################################################################################
{
  ($id) = @_;
  my $ret = "<!-- is stuff -->";
  $ret .= "<div class='Table'>\n";
  $ret .= "<div class='Row'>\n";
  $ret .= "<div class='Cell'>\n";
  $ret .= "<h2>$id</h2>\n";
  $ret .= "</div>\n";
  $ret .= "</div>\n";
  $ret .= "<div class='Row'>\n";
  $ret .= "<div class='Cell'>\n";

  $ret .= "<div id='remove$id'>\n";
  $ret .= &delete_button();
  $ret .= "</div>";


  $ret .= "</div>\n";
  $ret .= "</div>\n";
  $ret .= "</div>\n";

  $ret .= "
  <script>
  \$('#remove$id').click(function() {
    \$.ajax({
       url: 'http://api.openstreetmap.cz/table/remove/$id',
    }).done(function() {
      \$('#remove$id').html('marked for deletion')
    });  
  });
  </script>
  ";

  return $ret;
}

################################################################################
sub t()
################################################################################
{
  my ($s, $lang) = @_;

  if ($s eq "Click to show items containing") {return "Zobraz položky obsahující";}
  if ($s eq "note") {return "Poznámka";}
  if ($s eq "nothing") {return "Vlož text ...";}
  if ($s eq "edited") {return "Editováno ...";}
  if ($s eq "remove_picture") {return "Smazat obrázek. Smazána budou pouze metadata, fotka bude skryta.";}
  if ($s eq "attribute") {return "Atribut";}
  if ($s eq "value") {return "Hodnota";}
  if ($s eq "isedited") {return "Bylo editováno?";}
  if ($s eq "Click to edit...") {return "Klikněte a editujte...";}
  if ($s eq "marked for delete") {return "Označeno pro smazání";}
  if ($s eq "times") {return "krát";}

#  return  utf8::decode($s);
  return $s;
}

################################################################################
sub show_table_row()
################################################################################
{
  my ($p1, $p2, $id, $col) = @_;

  my $out = "<!-- table row -->\n";
  $out .=
  "<div class='Row'>
    <div class='Cell'>
      <span>". $p1 ."</span>
    </div>
    <div class='Cell'>
       <span>" . $p2 . "</span>
    </div>
    <div class='Cell'>
      <div id='edited" . $col . $id . "'>checking ...</div>
    </div>
  </div>\n";
  $out .= "<!-- end table row -->\n";

  return $out;
}

################################################################################
sub show_table_header()
################################################################################
{
  my ($c1, $c2, $c3) = @_;

  my $out = "<!-- table header -->\n";
  $out .=
  "<div class='Row'>
    <div class='Cell'>
      <span>". $c1 ."</span>
    </div>
    <div class='Cell'>
       <span>" . $c2 . "</span>
    </div>
    <div class='Cell'>
       <span>" . $c3 . "</span>
    </div>
  </div>\n";
  $out .= "<!-- end table row -->\n";

  return $out;
}

################################################################################
sub edit_stuff
################################################################################
{
  my ($id, $lat, $lon, $url, $name, $attribution, $ref, $note) = @_;

  my $out;

  $out .= "<div class='Table'>";
  $out .= &show_table_header(&t("attribute"),&t("value"),&t("isedited"));
  $out .= &show_table_row("latitude", $lat, $id, "lat");
  $out .= &show_table_row("longtitude", $lon, $id, "lon");

  my $p1 = "<a title='" . &t("Click to show items containing") . " ref' href='/table/ref/" . $ref . "'>" . &t("ref") . "</a>:";
  my $p2 = "<div class='edit' id='ref_$id'>" . $ref . "</div>";
  $out .= &show_table_row($p1, $p2, $id, "ref");

  $out .= &show_table_row(
   "<a title='" . &t("Click to show items containing") . " name' href='/table/name/$attribution'>" . &t("by") . "</a>:",
   "<div class='edit' id='attribution_$id'>$attribution</div>",
   $id, "attribution"
  );
  $out .= &show_table_row(
   "<a title='" . &t("Click to show items containing") . " note' href='/table/note/$note'>" . &t("note") . "</a>:",
   "<div class='edit' id='note_$id'>$note</div>",
   $id, "note"
  );

  $out .= "</div>";

  return $out;
}

################################################################################
sub gp_line()
################################################################################
{
  my ($id, $lat, $lon, $url, $name, $attribution, $ref, $note) = @_;

  my $out = "<!-- GP LINE -->";

  if ($ref eq "") {
    $ref = "none";
  }

  if ($note eq "") {
    $note = &t("nothing");
  }

  $out .= "<hr>\n";
  $out .= "<div class='gp_line'>\n";

  $out .= "<div class='master_table'>";
  $out .= "<div class='Row'>";

  #id stuff
  $out .= "<div class='Cell'>\n";
  $out .= &id_stuff($id);
  $out .= "</div>\n";

  #edit stuff
  $out .= "<div class='Cell cell_middle'>\n";

  $out .= &edit_stuff($id, $lat, $lon, $url, $name, $attribution, $ref, $note);
  $out .= "</div>";

  @attrs= ("lat", "lon", "ref", "attribution", "note");

  $out .= "<script>";
  foreach $col (@attrs) {
    $out .= "
  \$.ajax({
    url: 'http://api.openstreetmap.cz/table/isedited/". $col ."/" . $id . "',
    timeout:3000
  })
  .done(function(data) {
    \$('#edited" . $col . $id . "').text(data);
  })
  .fail(function() {
    \$('#edited" . $col . $id . "').text('error');
  })
  .always(function(data) {
  });";
  }

    $out .= "
  var text = \"" . &delete_button() . "\";
  \$.ajax({
    url: 'http://api.openstreetmap.cz/table/isdeleted/" . $id . "',
    timeout:3000
  })
  .done(function(data) {
    if (data.length > 1) {
      \$('#remove" . $id . "').text(data);
    } else {
      \$('#remove" . $id . "').html(text);
    }
  })
  .fail(function() {
    \$('#remove" . $id . "').html(text + '??');
  })
  .always(function(data) {
  });";

  $out .= "  </script>";

  $out .= "<div class='Cell cell_middle'>";
  $out .= &maplinks($lat, $lon);
  $out .= "</div>\n";

  $out .= "<div class='Cell cell_middle'>";
  $out .= &static_map($lat, $lon);
  $out .= "</div>\n";


  $out .= "<div class='Cell'>";
  $full_uri = "http://api.openstreetmap.cz/".$url;
  $out .= "<a href='$full_uri'><img src='$full_uri' height='150px'><br>$name</a>";
  $out .= "</div>\n";

  $out .= "</div> <!-- row -->\n";

  $out .= "</div> <!-- table -->\n";

  $out .= "</div> <!-- gp_line -->\n";
#  syslog('info', $out);

  return $out;
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
@scripts = @_;
print '
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" type="text/css" href="http://api.openstreetmap.cz/editor.css"/>
  <title>openstreetmap.cz guidepost editor</title>
';

  foreach $i (@scripts) {
    print "  <script type='text/javascript' src='";
    print $i;
    print "'></script>\n";
  }

print '</head>
<body>
';
}

################################################################################
sub page_footer()
################################################################################
{
return '
</body>
</html>
';
}

################################################################################
sub set_by_id()
################################################################################
{
  my ($id, $val) = @_;
  syslog('info', "$id, $val");
  my @data = split("_", $id);
  $db_id = $data[1];
  $db_col = $data[0];
  $query = "insert into changes (gp_id, col, value) values ($db_id, '$db_col', '$val')";
  syslog('info', $query);
  my $sth = $dbh->prepare($query);
  my $rv = $sth->execute() or die $DBI::errstr;
}

################################################################################
sub read_post()
################################################################################
{
  my $r = shift;
  my $bb = APR::Brigade->new($r->pool, $r->connection->bucket_alloc);
  my $data = '';
  my $seen_eos = 0;
  do {
    $r->input_filters->get_brigade($bb, Apache2::Const::MODE_READBYTES, APR::Const::BLOCK_READ, IOBUFSIZE);
    for (my $b = $bb->first; $b; $b = $bb->next($b)) {
      if ($b->is_eos) {
          $seen_eos++;
        last;
      }
      if ($b->read(my $buf)) {
        $data .= $buf;
      }
      $b->remove; # optimization to reuse memory
    }
  } while (!$seen_eos);
  $bb->destroy;
  return $data;
}


################################################################################
sub review_entry
################################################################################
{
  my ($req_id, $id, $gp_id, $col, $value, $img, $action) = @_;

  $original = &get_gp_column_value($gp_id, $col);

  print "<div id='reviewdiv$req_id'>";
  print "<table>";
  print "<tr>";
  print "<td>change id:$id";
  print "<td>guidepost id:<a href='http://api.openstreetmap.cz/table/id/$gp_id'>$gp_id</a>";
  if ($action eq "remove") {
    print "<td>DELETE";
  } else {
    print "<td>column: $col";
    print "<td>original value: $original";
    print "<td>value: $value";
  }
  print "</tr>";
  print "</table>\n";

  print "<img id='wheelzoom$req_id' src='http://api.openstreetmap.cz/img/guidepost/$img' width='320' height='200' alt='mapic'>";
  print "<button onclick='javascript:reject(".$id."," . $req_id . ")' > reject </button>";
  print "<button onclick='javascript:approve(".$id."," . $req_id . ")'> approve </button>";
  print "\n";

  print "</div>";
  print "<hr>\n";
}

################################################################################
sub get_gp_column_value
################################################################################
{
  ($id, $column) = @_;
  $query = "select $column from guidepost where id=$id";
  @res = $dbh->selectrow_array($query) or return "db error error";
  return $res[0];
}

################################################################################
sub review_form
################################################################################
{

  my $query = "select guidepost.name, changes.id, changes.gp_id, changes.col, changes.value, changes.action from changes, guidepost where changes.gp_id=guidepost.id limit 20";
  $res = $dbh->selectall_arrayref($query);
  print $DBI::errstr;
#http://code.jquery.com/jquery-1.11.3.min.js
#http://code.jquery.com/jquery-2.1.4.min.js
  &page_header(("http://code.jquery.com/jquery-1.11.3.min.js", "http://api.openstreetmap.cz/wheelzoom.js"));

  print "<script>";
  print "
function approve(id,divid)
{
  \$.ajax( 'http://api.openstreetmap.cz/table/approve/' + id, function(data) {
    alert( 'Load was performed.' + data );
  })
  .done(function() {
  \$('#reviewdiv'+divid).css('background-color', 'lightgreen');
  })
  .fail(function() {
    alert( 'error' );
  })
  .always(function() {
  });
}

function reject(id,divid)
{
  \$.ajax( 'http://api.openstreetmap.cz/table/reject/' + id, function(data) {
    alert( 'Load was performed.'+data );
  })
  .done(function() {
  \$('#reviewdiv'+divid).css('background-color', 'red');
  })
  .fail(function() {
    alert( 'error' );
  })
  .always(function() {
  });
}

";

  print "</script>";

  print "\n<h1>Review</h1>\n";

  my $req_id = 0;
  foreach my $row (@$res) {
    my ($img, $id, $gp_id, $col, $value, $action) = @$row;
    &review_entry($req_id++, $id, $gp_id, $col, $value, $img, $action);
  }

  print "<script>";
#  print "wheelzoom(document.querySelector('img.wheelzoom'));";
  print "wheelzoom(document.querySelectorAll('img'));";
  print "</script>\n";

  &page_footer();
}

################################################################################
sub is_edited
################################################################################
{
  my ($what, $id) = @_;
  my $query = "select count() from changes where gp_id=$id and col='$what'";
  @out = $dbh->selectrow_array($query);
  print $DBI::errstr;
  if ($out[0] > 0) {
    print " edited " . $out[0] . "x";
  } else {
    print "";
  }
}

################################################################################
sub is_deleted
################################################################################
{
  my ($id) = @_;
  my $query = "select count() from changes where gp_id=$id and action='remove'";
  @out = $dbh->selectrow_array($query);
  print $DBI::errstr;
  if ($out[0] > 0) {
    print &t("marked for delete") . " " . $out[0] . " " . &t("times");
  } else {
    print "";
  }
}

################################################################################
sub reject_edit
################################################################################
{
  my ($id) = @_;
  my $query = "delete from changes where id=$id";

  syslog('info', "removing change id: " . $id);

  $rv  = $dbh->do($query) or return $dbh->errstr;
  return "OK $id removed";
}

################################################################################
sub approve_edit
################################################################################
{
  my ($id) = @_;

  syslog('info', "accepting change id: " . $id);

  my $query = "select * from changes where id='$id'";
  @res = $dbh->selectrow_array($query) or return $DBI::errstr;
  my ($xid, $gp_id, $col, $value, $action) = @res;

  if ($action eq "remove") {
    syslog('info', "deleting");
    &delete_id($gp_id);
  } else {
    my $query = "update guidepost set $col='$value' where id=$gp_id";
    syslog('info', "updating" . $query);
    $rv  = $dbh->do($query) or return $dbh->errstr;
  }

  my $query = "delete from changes where id=$id";
  syslog('info', "removing change request" . $query);
  $rv  = $dbh->do($query) or return $dbh->errstr;
  return "OK $id changed";
}

################################################################################
sub delete_id
################################################################################
{
  my ($id) = @_;

  syslog('info', "deleting id: " . $id);

  my $query = "select * from guidepost where id=$id";
#  $res = $dbh->selectall_hashref($query, { Slice => {} });
  $res = $dbh->selectall_hashref($query, 'id');

  my $original_file = "/home/walley/www/mapy/img/guidepost/" . $res->{$id}->{name};
  my $new_file = "/home/walley/www/mapy/img/guidepost/deleted/" . $res->{$id}->{name};

#move picture to backup directory
  syslog('info', "Moving $original_file to $new_file");
  if (!move($original_file, $new_file)) {
    syslog('info', "Move failed($original_file,$new_file): $!");
  }

#delete from db
  $query = "delete from guidepost where id='$id'";
  $dbh->do($query);
}

################################################################################
sub remove
################################################################################
{
  my ($id) = @_;
  syslog('info', "removing $id");
  $query = "insert into changes (gp_id, action) values ($id, 'remove')";
  syslog('info', $query);
  my $sth = $dbh->prepare($query);
  my $rv = $sth->execute() or die $DBI::errstr;
  print $query;
}

1;
