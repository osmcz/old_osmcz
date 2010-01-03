/******************************************************************************/
function getHTTPObject()
/******************************************************************************/
{
    if (typeof XMLHttpRequest != 'undefined') {
      return new XMLHttpRequest();
  }

    try {
      return new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {
      try {
        return new ActiveXObject('Microsoft.XMLHTTP');
      } catch (e) {}
    } return false;
  }

/******************************************************************************/
function startUpload()
/******************************************************************************/
{
  document.getElementById('f1_upload_process').style.visibility = 'visible';
  document.getElementById('f1_upload_form').style.visibility = 'hidden';
  return true;
}

/******************************************************************************/
function stopUpload(success, filename)
/******************************************************************************/
{
  var result = ''; 
  var response = '';
  var out_line = '';

  if (success == 1){
    result = '<span class="msg">The file was uploaded successfully!<\/span><br/><br/>';
  } else {
    result = '<span class="emsg">There was an error during file upload!<\/span><br/><br/>';
  }
  document.getElementById('f1_upload_process').style.visibility = 'hidden';
  document.getElementById('f1_upload_form').innerHTML = result ;
  document.getElementById('f1_upload_form').style.visibility = 'visible';
  var http = getHTTPObject();
  http.open('GET', 'http://localhost/~walley/php/index.php?action=upload&name='+filename, true);
  http.send(null)
  http.onreadystatechange = function()
  {
    if (http.readyState == 4) {
      response = http.responseText;
      alert(response);
    }
  }
  return true;
}
