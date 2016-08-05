var url = 'http://api.localhost:8080/drives';
var drives = null;
var map = null;

jQuery(function($) {
  getDrives();
});

function initMap() {
  map = new google.maps.Map(document.getElementById('map--canvas'), {
    center: {lat: 54.1657, lng: 10.4515},
    zoom: 6
  });
  google.maps.event.addListenerOnce(map, 'idle', function() {
   google.maps.event.trigger(map, 'resize');
});
}

function getDrives() {
  $.getJSON(url, function(answer) {
    drives = answer;
    fillTable();
  });
}

function fillTable() {
  var table = $("#drives-table--body");
  table.empty();
  for (let i = 0; i < drives.length; i++) {
    var entry = $("\
    <tr>\
      <td class='mdl-data-table__cell--non-numeric'>" + drives[i]['author'] + "</td>\
      <td class='mdl-data-table__cell--non-numeric'>" + drives[i]['from'] + "</td>\
      <td class='mdl-data-table__cell--non-numeric'>" + drives[i]['stops'] + "</td>\
      <td class='mdl-data-table__cell--non-numeric'>" + drives[i]['to'] + "</td>\
      <td>" + drives[i]['seatsleft'] + "</td>\
      <td class='mdl-data-table__cell--non-numeric'>" + drives[i]['contact'] + "</td>\
      <td>" + drives[i]['dateCreated'] + "</td>\
      <td>" + drives[i]['dateModified'] + "</td>\
      ");
    var editButton = $("<td><button class='mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>mode_edit</i></button></td>");
    editButton.click(function() {
      editDrive(i);
    });
    entry.append(editButton);
    var deleteButton = $("<td><button class='mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>delete</i></button></td>");
    deleteButton.click(function() {
      deleteDrive(i);
    });
    entry.append(deleteButton);
    entry.append("</tr>");
    table.append(entry);
  }
}

function editDrive(index) {
  $.ajax({
    url: url,
    type: 'PUT',
    success: function(result) {
      console.log(result);
    },
    error: function(result) {
      console.log("Error" + result);
    }
  });
}

function deleteDrive(index) {
  console.log(index);
}
