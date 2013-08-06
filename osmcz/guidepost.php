<?php
#lat-y
#lon-x

$global_error_message = "";

################################################################################
function printdebug($x)
################################################################################
{
  //let it print when debugging
  //return;
//  print $x."<br>";
  system ("/usr/bin/logger -t guidepost '$x'");
}

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
  if (get_param("source") == "mobile") { return; }

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
  if (get_param("source") == "mobile") { return; }

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
  print "<p id='upload_process'>Uploading...</p>\n";
  //set widht and height to display debug output
  print "<iframe id='upload_target' name='upload_target' src='#' style='width:100;height:100;border:0px solid #fff;'></iframe>\n";
}

################################################################################
function insert_to_db($lat, $lon, $url ,$file, $author)
################################################################################
{
  global $global_error_message;
  $database = new SQLiteDatabase('guidepost', 0777, $error);
  if (!$database) {
    $global_error_message = (file_exists($yourfile)) ? "Impossible to open, check permissions" : "Impossible to create, check permissions";
    return 0;
  }
  $q = "insert into guidepost values (NULL, '$lat', '$lon', '$url', '$file', '$author')";
  $query = $database->queryExec($q, $query_error);
  if ($query_error) {
    $global_error_message = "Error: $query_error"; 
    return 0;
  }
  if (!$query) {
    $global_error_message = "Impossible to execute query.";
    return 0;
  };
  return 1;
}

################################################################################
function process_file()
################################################################################
{
  global $_POST;
  global $global_error_message;

  $result = 0;

  $filename = $_FILES['uploadedfile']['name'];
  $error_message = "";

  printdebug("name: $filename");
  printdebug("type:".$_FILES['uploadedfile']['type']);
  printdebug("size:".$_FILES['uploadedfile']['size']);
  printdebug("tmp:".$_FILES['uploadedfile']['tmp_name']);
  printdebug("error".$_FILES['uploadedfile']['error']);


  $lat = $_POST['lat'];
  $lon = $_POST['lon'];
  $author = $_POST['author'];

  printdebug("lat:lon:author - $lat:$lon:$author");

  $file = basename($filename);
  $target_path = "uploads/";
  $target_path = $target_path . $file;
  $final_path = "img/guidepost/" . $file;

  printdebug("target:$target_path");

  $error_message = "OK";

  if ($_FILES['uploadedfile']['error'] == "1") {
    $error_message = "soubor je prilis velky";
    $result = 0;
  }

  if (file_exists($_FILES['uploadedfile']['tmp_name'])) {
    printdebug("soubor existuje\n");
    $result = 1;
  } else {
    $error_message = "nepodarilo se uploadnout soubor";
    $result = 0;
  }

  if ($author == "") {
    $error_message = "author nezadan";
    $result = 0;
  }

  if ($result) {
    if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $target_path)) {
      printdebug("Soubor '$file' byl uspesne nahran na server do $target_path<hr>");
      if (!$lat && !$lon) {
        $command = "/var/www/mapy/exifme.pl $target_path $author img/guidepost/";
        $out = system ($command, $errlvl);
        printdebug("<br>command:vystup(exit code)<br> $command:$out ($errlvl)");
        if (!$errlvl) {
          $result = 1;
        } else {
          $result = 0;
          $error_message = "nepodarilo se zjistit souradnice z exif" . $out;
          printdebug("exifme error $error_message<br>");
        }
      } else {
        if (!copy ("uploads/$file","img/guidepost/$file")) {
          $error_message = "failed to copy $file to destination ... ";
          if (file_exists("img/guidepost/$file")) {
            $error_message .= "file already exists but cannot be overwritten (rights?), it probably is in db too";
          }
          $result = 0;
        } else {
          $ret_db = insert_to_db($lat, $lon, $final_path, $file, $author);
          if (!$ret_db) {
            $error_message = "failed to insert to db" . $global_error_message;
            $result = 0;
          }
        }
      }
    } else {
      $error_message = "Chyba pri otevirani souboru, mozna je prilis velky";
      $result = 0;
    }
  }

  if ($result == 0 and $error_message == "") {
    $error_message = "Divna chyba";
  }

  if (get_param("source") == "mobile") {
    print "$result-$error_message";
  } else {
    print "
  <script language='javascript' type='text/javascript'>
    parent.stop_upload(".$result.",'".$error_message."', '".$filename."');
  </script>\n";
  }
  return $result;
}

################################################################################
function create_db()
################################################################################
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
    if ($bbox == "") {
      system("/usr/bin/logger -t guidepost no bbox");
      die("No bbox provided\n");
    }
    list($minlon, $minlat, $maxlon, $maxlat) = preg_split('/,/', $bbox, 4);
    $db = new SQLiteDatabase('guidepost');

    if ($db) {
      $i = 0;
      $query = "select * from guidepost where lat < $maxlat and lat > $minlat and lon < $maxlon and lon > $minlon";
#print $query;
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
