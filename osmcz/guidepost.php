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
  print "  <title>alfresco upload</title>\n";
  print "  <link href='style/style.css' rel='stylesheet' type='text/css'/>\n";
  print "  <script language='javascript' type='text/javascript' src='upload.js'>\n";
  print "  </script>\n";
  print "  </head>\n";
  print "  <body>\n";
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

  print "
<form action='".$PHP_SELF."' method='post' enctype='multipart/form-data' target='upload_target' onsubmit='startUpload();'>
   <input type='hidden' name='action' value='file' />
   <input type='hidden' name='MAX_FILE_SIZE' value='500000' />
   <p id='f1_upload_form' align='center'><br/>
   <label>File:<input name='uploadedfile' type='file' size='25' /></label>
   <label><input type='submit' name='submitBtn' class='sbtn' value='Nahrat soubor' /></label>
   </p>
   <iframe id='upload_target' name='upload_target' src='#' xstyle='width:0;height:0;border:0px solid #fff;'></iframe>
 </form>
";

}

################################################################################
function process_file()
################################################################################
{
  print "<hr>name:";
  $filename= $_FILES['uploadedfile']['name'];
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

  $target_path = "uploads/";
  $target_path = $target_path . basename( $_FILES['uploadedfile']['name']);

  print "<br>target:$target_path";
  print "<hr>";
  
  if (file_exists($_FILES['uploadedfile']['tmp_name'])) {print "existuje\n";} else {print "neeee\n";}

  if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $target_path)) {
    echo "Soubor ".basename($_FILES['uploadedfile']['name'])." byl uspesne nahran na server do $target_path";
    $out = system ("/var/www/exifme.pl $target_path autor");
    print "<br>vystup: $out";
    $result = 1;
  } else {
    echo "Chyba pri otevirani souboru, mozna je prilis velky";
    $result = 0;
  }
  print "<script language='javascript' type='text/javascript'>
  window.top.window.stopUpload(".$result.", '".$filename."');
  </script>
  \n";
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
    $bbox = $_GET['bbox'];
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
