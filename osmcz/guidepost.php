<?php
#lat-y
#lon-x

################################################################################
function get_param($param)
################################################################################
{
  if (isset($_GET[$param])) {return($_GET[$param]);}
  if (isset($_POST[$param])) {return($_POST[$param]);}
  return "";
}


################################################################################
function page_header()
################################################################################
{
  print "<!DOCTYPE HTML PUBLIC '-//W3C//DTD HTML 4.01 Transitional//EN' 'http://www.w3.org/TR/html4/loose.dtd'>\n";
  print "<html>\n";
  print "  <head>\n";
  print "  <meta http-equiv='Content-Type' content='text/html; charset=UTF-8'>\n";
  print "  <title>openstreetmap.cz image upload</title>\n";
  print "  <script src='OpenLayers.2.8.0.js'></script>\n";
  print "  <script language='javascript' type='text/javascript' src='upload.js'></script>\n";
  print "  <link href='upload.css' rel='stylesheet' type='text/css'/>";
  print "  </head>\n";
}


################################################################################
function page_footer()
################################################################################
{
  print "  </body>\n";
  print "</html>\n";
}

################################################################################ 
function show_upload_dialog()
################################################################################ 
{

  $PHP_SELF = $_SERVER['PHP_SELF'];

  print"<script>\n";
  print "function upbox_off()\n";
  print "{\n";
  print "  document.getElementById('upbox').style.display = 'none' ;\n";
  print "}\n";
  print"</script>\n";

  print "  </head>
  <body onload='upload_init()'>\n";

  print "
<div id='map' class='smallmap'></div>
<form name='coord' action='".$PHP_SELF."' method='post' enctype='multipart/form-data' target='upload_target' onsubmit='start_upload();'>
  <input type='hidden' name='action' value='file' />
  <input type='hidden' name='MAX_FILE_SIZE' value='5000000' />
  <fieldset>
    <input type='text' name='author' value='autor' size='9'>
    <input name='uploadedfile' type='file' size='20'/>
    <input type='text' name='lat' value='0' size='10'>
    <input type='text' name='lon' value='0' size='10'>
  </fieldset>
  <fieldset>
    <input type='reset' name='reset' value='Reset' />
    <input type='submit' name='submitBtn' class='sbtn' value='Nahrat soubor' />
  </fieldset>
</form>\n";
  print "<p id='upload_process'>Uploading...</p>";
  print "<iframe id='upload_target' name='upload_target' src='#' style='width:0;height:0;border:0px solid #fff;'></iframe>";
}

################################################################################
function insert_to_db($lat, $lon, $url ,$file, $author)
################################################################################
{
  $database = new SQLiteDatabase('guidepost', 0777, $error);
  if (!$database) {
    $error = (file_exists($yourfile)) ? "Impossible to open, check permissions" : "Impossible to create, check permissions";
    die($error);
  }
  $q = "insert into guidepost values (NULL, '$lat', '$lon', '$url', '$file', '$author')";
print $q;
  $query = $database->queryExec($q, $query_error);
  if ($query_error) {
    print("Error: $query_error"); 
    return 0;
  }
  if (!$query) {
    print("Impossible to execute query.");
    return 0;
  };
  return 1;
}

################################################################################
function process_file()
################################################################################
{
  global $_POST;

  $result = 0;

  $filename = $_FILES['uploadedfile']['name'];
  $error_message = "";

  print "<hr>name:";
  print $filename;
  print "<br>type:";
  print $_FILES['uploadedfile']['type'];
  print "<br>size:";
  print $_FILES['uploadedfile']['size'];
  print "<br>tmp:";
  print $_FILES['uploadedfile']['tmp_name'];
  print "<br>error";
  print $_FILES['uploadedfile']['error'];
  print "<hr>";

  print $_POST['lat'];
  print $_POST['lon'];

  $lat = $_POST['lat'];
  $lon = $_POST['lon'];
  $author = $_POST['author'];

  print "<hr>";

  $file = basename($filename);
  $target_path = "uploads/";
  $target_path = $target_path . $file;
  $final_path = "img/guidepost/" . $file;
  
  print "<br>target:$target_path";
  print "<hr>";

  if (file_exists($_FILES['uploadedfile']['tmp_name'])) {
    print "existuje\n";
    $result = 1;
  } else {
    $error_message = "nepodarilo se uploadnout soubor";
    $result = 0;
  }

  if ($result) {
    if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $target_path)) {
      echo "Soubor '$file' byl uspesne nahran na server do $target_path";
      if (!$lat && !$lon) {
        $out = system ("/var/www/exifme.pl $target_path $author img/guidepost/", $errlvl);
        print "<br>vystup: $out";
        if ($errlvl) {
          $result = 0;
          $error_message = "nepodarilo se zjistit souradnice z exif" + $out;
        } else {
          $result = 1;
        }
      } else {
        if (!copy ("uploads/$file","img/guidepost/$file")) {
          $error_message = "failed to copy $file to destination ...";
          $result = 0;
        } else {
          insert_to_db($lat, $lon, $final_path, $file, $author);
        }
      }
    } else {
      $error_message = "Chyba pri otevirani souboru, mozna je prilis velky";
      $result = 0;
    }
  }

  print "
  <script language='javascript' type='text/javascript'>
    parent.stop_upload(".$result.",'".$error_message."', '".$filename."');
  </script>
  \n";
  return $result;
}

function create_db()
{
  global $db;
  global $create_query;

$create_query = "CREATE TABLE guidepost (
  id int,
  lat numeric,
  lon numeric,
  url varchar,
  name varchar,
  PRIMARY KEY (id)
);";

  $db->queryExec($create_query);

  $db->queryExec("insert into guidepost values (NULL, 50.1, 17.1, 'x', 'znacka');");
  $db->queryExec("insert into guidepost values (NULL, 50.2, 17.2, 'x', 'znacka');");
  $db->queryExec("insert into guidepost values (NULL, 50.3, 17.3, 'x', 'znacka');");
  $db->queryExec("insert into guidepost values (NULL, 50.4, 17.4, 'x', 'znacka');");
}


$action = get_param("action");

switch ($action) {
  case "show_dialog":
    page_header();
    show_upload_dialog();
    page_footer();
    break;
  case "file":
    page_header();
    process_file();
    page_footer();
    break;
  case "":
    $bbox = get_param('bbox');
    if ($bbox == "") {die("No bbox provided\n");}
    list($minlon, $minlat, $maxlon, $maxlat) = split(",", $bbox, 4);
    $db = new SQLiteDatabase('guidepost');

    if ($db) {
      $i = 0;
      $query = "select * from guidepost where lat < $maxlat and lat > $minlat and lon < $maxlon and lon > $minlon";
      $result = $db->arrayQuery($query, SQLITE_ASSOC);
      foreach ($result as $entry) {
        $result[$i++] = $entry;
      }
      print json_encode($result);
    } else {
        die($err);
    }
  break;
}

?>
