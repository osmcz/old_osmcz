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
  $x = str_replace('%', '(percent)',    $x);
  $x = str_replace(';', '(semicolon)',  $x);
  $x = str_replace('*', '(asterisk)',   $x);
  $x = str_replace('/', '(slash)',      $x);
  $x = str_replace("\\", '(backslash)', $x);
  $x = str_replace('~', '(tilda)',      $x);
  $x = str_replace('>', '(GT)',         $x);
  $x = str_replace('<', '(LT)',         $x);
  $x = str_replace('?', '(question)',   $x);
  $x = str_replace('-', '(minus)',      $x);

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
  print "  <script src='jquery-1.11.3.min.js'></script>\n";
  print "  <script src='jquery-ui.min.js'></script>\n";
  print "  <script language='javascript' type='text/javascript' src='upload.js'></script>\n";
  print "  <link href='upload.css' rel='stylesheet' type='text/css'/>\n";
  
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

  print "  </head>
  <body onload='upload_init()'>\n";

$title_help = "Pokud má obrázek Exif souřadnice, můžete nechat lat, lon na 0,0";

  print "
<div id='map' class='mapmap'></div>
<div id='form' class='form'>
<form id='coord' name='coord' action='".$PHP_SELF."' method='post' enctype='multipart/form-data' target='upload_target' onsubmit='start_upload();'>
  <input type='hidden' name='action' value='file' />
  <input type='hidden' name='MAX_FILE_SIZE' value='5000000' />
  <fieldset>
    <label>autor</label><input type='text' id='author' name='author' value='autor' size='9'>
    <input name='uploadedfile' type='file' id='guidepostfile' size='20'/><br>
    <label>lat</label><input type='text' id='lat' name='lat' value='0' size='10' title='".$title_help."'>
    <label>lon</label><input type='text' id='lon' name='lon' value='0' size='10' title='".$title_help."'>
    <label>exif </label><input type=checkbox id='exif_checkbox' onchange='exif_checkbox_action()'>
  </fieldset>
  <fieldset>
    <label>Ref</label><input type='text' name='ref' value='' size='6'>
    <label>Poznámka</label><input type='text' name='note' value='' size='50'>
<br>
    <input type='radio' name='gp_type' value='gp' checked>Rozcestník
    <input type='radio' name='gp_type' value='map'>Mapa
    <input type='radio' name='gp_type' value='pano'>Panorama
    <input type='radio' name='gp_type' value='info'>Informační tabule

  </fieldset>
  <fieldset>
    <input type='submit' name='submitBtn' class='sbtn' value='Nahrát soubor' />
  </fieldset>
</form>
</div>

<table><tr> 
  <td><div id='upload_div'><p style='border:3px solid #aaaaaa;' id='upload_process'>Uploading...</p></div></td>
  <td><iframe id='upload_target' name='upload_target' src='#' style='width:200px;height:30px;border:3px solid #aaaaaa;'></iframe></td>
</tr></table>

\n";

}


################################################################################ 
function show_iphone_upload_dialog()
################################################################################ 
{

  $PHP_SELF = $_SERVER['PHP_SELF'];

  print"<script>\n";
  print "function upbox_off()\n";
  print "{\n";
  print "  document.getElementById('upbox').style.display = 'none' ;\n";
  print "}\n";
  print "

  function exif_present()
  {
     document.getElementById('lat').value = 0;
     document.getElementById('lat').readOnly = true;
     document.getElementById('lon').value = 0;
     document.getElementById('lon').readOnly = true;
  }

  function no_exif()
  {
     document.getElementById('lat').readOnly = false;
     document.getElementById('lon').readOnly = false;
  }

  function exif_checkbox_action()
  {
    if (document.getElementById('exif_checkbox').checked) {
      exif_present();
    } else {
      no_exif();
    }
  }

  function send_data() 
  {
    var boundary = this.generateBoundary();
    var xhr = new XMLHttpRequest;

    xhr.open('POST', this.form.action, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            alert(xhr.responseText);
        }
    };

    var contentType = 'multipart/form-data; boundary=' + boundary;
    xhr.setRequestHeader('Content-Type', contentType);

    for (var header in this.headers) {
        xhr.setRequestHeader(header, headers[header]);
    }

    // here's our data variable that we talked about earlier
    var data = this.buildMessage(this.elements, boundary);

    // finally send the request as binary data
        xhr.sendAsBinary(data);
  }

  ";

  print"</script>\n";

  print "  </head>
  <body onload='upload_init()'>\n";

$title_help = "Pokud má obrázek Exif souřadnice, můžete nechat lat, lon na 0,0";

  print "
    <div id='map' class='smallmap'></div>

<form name='coord' action='".$PHP_SELF."' method='post' enctype='multipart/form-data' target='upload_target' onsubmit='start_upload();'>
  <input type='hidden' name='action' value='file' />
  <input type='hidden' name='MAX_FILE_SIZE' value='5000000' />
  <fieldset>
    <label>autor</label><input type='text' id='author' name='author' value='autor' size='9'>
    <input name='uploadedfile' type='file' id='guidepostfile'  size='20'/><br>
    <label>lat</label><input type='text' id='lat' name='lat' value='0' size='10' title='".$title_help."'>
    <label>lon</label><input type='text' id='lon' name='lon' value='0' size='10' title='".$title_help."'>
    <label>exif </label><input type=checkbox id='exif_checkbox' onchange='exif_checkbox_action()'>
  </fieldset>
  <fieldset>
    <input type='reset' name='reset' value='Reset' />
    <input type='submit' name='submitBtn' class='sbtn' value='Nahrat soubor' />
  </fieldset>
</form>

<table><tr>
  <td><p style='border:10px solid #fff;'> id='upload_process'>Uploading...</p></td>
  <td><iframe id='upload_target' name='upload_target' src='#' style='width:200px;height:100px;border:10px solid #aaaaaa;'></iframe></td>
</tr></table>
\n";
  //set widht and height to display debug output

}

################################################################################
function insert_to_db($lat, $lon, $url ,$file, $author, $ref, $note)
################################################################################
{
  global $global_error_message;
  $database = new SQLite3('guidepost');;
  if (!$database) {
    $global_error_message = (file_exists('guidepost')) ? "Impossible to open, check permissions" : "Impossible to create, check permissions";
    return 0;
  }
  $q = "insert into guidepost values (NULL, '$lat', '$lon', '$url', '$file', '$author', '$ref', '$note')";
  $query = $database->exec($q);
  if (!$query) {
    $global_error_message = "Error: $query_error"; 
    return 0;
  }
  printdebug("insert_to_db(): insert successful");
  return 1;
}

################################################################################
function process_file()
################################################################################
{
  global $_POST;
  global $global_error_message;

  $result = 0;

  printdebug("!!! START !!!");

  $filename = $_FILES['uploadedfile']['name'];
  $error_message = "";

  printdebug("name: $filename");
  printdebug("type: ".$_FILES['uploadedfile']['type']);
  printdebug("size: ".$_FILES['uploadedfile']['size']);
  printdebug("tmp: ".$_FILES['uploadedfile']['tmp_name']);
  printdebug("error: ".$_FILES['uploadedfile']['error']);

  $lat = $_POST['lat'];
  $lon = $_POST['lon'];
  $author = $_POST['author'];
  if (isset($_POST['ref'])) {
    $ref = $_POST['ref'];
  } else {
    $ref = "none";
  }

  $note = $_POST['note'];

  printdebug("ref: ".$ref);
  printdebug("note: ".$note);
  printdebug("before lat:lon:author - $lat:$lon:$author");

  $author = preg_replace('/[^-a-zA-Z0-9_ěščřžýáíéĚŠČŘŽÁÍÉúůÚľĽ .]/', '', $author);
  $note = preg_replace('/[^-a-zA-Z0-9_ěščřžýáíéĚŠČŘŽÁÍÉúůÚľĽ .]/', '', $note);
  $lat = preg_replace('/[^0-9.]/', '', $lat);
  $lon = preg_replace('/[^0-9.]/', '', $lon);
  $ref = preg_replace('/[^a-zA-Z0-9.]/', '', $ref);

  printdebug("after lat:lon:author - $lat:$lon:$author");

  $file = basename($filename);
  $target_path = "uploads/" . $file;
  $final_path = "img/guidepost/" . $file;

  printdebug("target: $target_path");

  $error_message = "OK";

  if ($_FILES['uploadedfile']['error'] == "1") {
    $error_message = "soubor je prilis velky";
    $result = 0;
  }

  if (file_exists($_FILES['uploadedfile']['tmp_name'])) {
    printdebug("soubor byl uspesne uploadnut do tmp\n");
    $result = 1;
  } else {
    printdebug("cannot upload file\n");
    $error_message = "nepodarilo se uploadnout soubor";
    $result = 0;
  }

  if ($author == "") {
    $error_message = "author nezadan";
    $result = 0;
  }

  if ($author === "android" or $author === "autor") {
    $error_message = "zmente vase jmeno";
    $result = 0;
  }

#sanitize filename

  if (strpos($filename, ';') !== FALSE) {
    $error_message = "spatny soubor strednik";
    $result = 0;
  }

  if (strpos($filename, '&') !== FALSE) {
    $error_message = "spatny soubor divnaosmicka";
    $result = 0;
  }

  $file_parts = pathinfo($filename);
  $ext = $file_parts['extension'];
  if ($ext !== "jpg" && $ext !== "JPG") {
    $error_message = "spatny soubor, pouzijte jpeg " . $file_parts['extension'];
    $result = 0;
  }

  if (file_exists("img/guidepost/$file")) {
    $error_message = "file already exists ($file), please rename your copy";
    $result = 0;
  }

  if ($result) {
    if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $target_path)) {
      printdebug("File '$file' has been moved from tmp to $target_path");
      if (!$lat && !$lon) {
        printdebug("soubor byl poslan se souradnicemi 0,0 -> exifme");
        $command = "/var/www/mapy/exifme.pl '$target_path' '$author' img/guidepost/ '$ref' '$note'";
        $out = system ($command, $errlvl);
        printdebug("command:output(exit code) - $command:$out($errlvl)");
        if (!$errlvl) {
          $result = 1;
        } else {
          $result = 0;
          $error_message = "poslano latlon 0,0 a nepodarilo se zjistit souradnice z exif" . $out;
          printdebug("exifme error $error_message");
        }
      } else {
        printdebug("soubor byl poslan se souradnicemi ve formulari");
        if (!copy ("uploads/$file","img/guidepost/$file")) {
          $error_message = "failed to copy $file to destination ... ";
          $result = 0;
        } else {
          $ret_db = insert_to_db($lat, $lon, $final_path, $file, $author, $ref, $note);
          if ($ret_db) {
            if (!unlink ("uploads/$file")) {
              printdebug("$file cannot be deleted from upload, inserted successfuly");
            }
          } else {
            $error_message = "failed to insert to db" . $global_error_message;
            $result = 0;
          }
        }
      }
      printdebug("error message:".$error_message);
    } else {
      $error_message = "Chyba pri otevirani souboru, mozna je prilis velky";
      $result = 0;
    }
  } else {
      printdebug("Upload refused: ".$error_message);
  }

  if ($result == 0 and $error_message == "") {
    $error_message = "Divna chyba";
  }

  if (get_param("source") == "mobile") {
    print "$result-$error_message";
  } else {
    print "  </head>\n";
    print "  <body>\n";
    print "
  <div id='x'></div>
  <script language='javascript' type='text/javascript'>
    \$('#x').text('*** OK ***');
    \$('#x').hide();
    \$('#x').show('highlight',{color: 'lightgreen'},'2000');

    parent.stop_upload(".$result.",'".$error_message."', '".$filename."');
  </script>\n";
  }

  printdebug("!!! END !!!");
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
      printdebug("no bbox");
      die("No bbox provided\n");
    } else {
      printdebug("bbox: " . $bbox);
    }

    list($minlon, $minlat, $maxlon, $maxlat) = preg_split('/,/', $bbox, 4);

    $db = new SQLite3('guidepost');

    if ($db) {
      $i = 0;
      $result = array();
      $query = "select * from guidepost where lat < $maxlat and lat > $minlat and lon < $maxlon and lon > $minlon";

      printdebug("query " . $query);

      $results = $db->query($query);
      while ($row = $results->fetchArray()) {
        $result[$i++] = $row;
      }
      print json_encode($result);
    } else {
      printdebug("db open error: " + $err);
      die($err);
    }
  break;
}

?>
