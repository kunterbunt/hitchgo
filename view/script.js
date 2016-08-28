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
      <td class='mdl-data-table__cell--non-numeric'><input class='drives-table--author' size='12' type='text' name='author' value='" + drives[i]['author'] + "' disabled='disabled'></td>\
      <td class='mdl-data-table__cell--non-numeric'><input class='drives-table--from' size='12' type='text' name='from' value='" + drives[i]['from'] + "' disabled='disabled'></td>\
      <td class='mdl-data-table__cell--non-numeric'><input class='drives-table--stops' size='25' type='text' name='stops' value='" + drives[i]['stops'] + "' disabled='disabled'></td>\
      <td class='mdl-data-table__cell--non-numeric'><input class='drives-table--to' size='12' type='text' name='to' value='" + drives[i]['to'] + "' disabled='disabled'></td>\
      <td><input class='drives-table--seatsleft' size='2' type='text' name='seatsleft' value='" + drives[i]['seatsleft'] + "' disabled='disabled'></td>\
      <td class='mdl-data-table__cell--non-numeric'><input class='drives-table--contact' size='25' type='text' name='contact' value='" + drives[i]['contact'] + "' disabled='disabled'></td>\
      <td class='mdl-data-table__cell--non-numeric'><input class='drives-table--dateCreated' size='8' type='text' name='dateCreated' value='" + new Date(drives[i]['dateCreated']).toLocaleDateString() + "' disabled='disabled'></td>\
      <td class='mdl-data-table__cell--non-numeric'><input class='drives-table--dateModified' size='8' type='text' name='dateModified' value='" + new Date(drives[i]['dateModified']).toLocaleDateString() + "' disabled='disabled'></td>\
      ");
    var editButton = $("<td><button class='mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>mode_edit</i></button></td>");
    editButton.click(function() {
      toggleEditButton(this, i);
    });
    entry.append(editButton);
    var deleteButton = $("<td><button class='red mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>delete</i></button></td>");
    deleteButton.click(function() {
      deleteDrive(i);
    });
    entry.append(deleteButton);
    entry.append("</tr>");
    table.append(entry);
  }
}

function toggleEditButton(editButton, index) {
  if ($(editButton).children().first().html() == '<i class="material-icons">check</i>') {
    setTextFields(index, true);
    $(editButton).children().first().html("<i class='material-icons'>mode_edit</i>");
    $(editButton).children().first().removeClass("green");
  } else {
    // Enable input fields.
    setTextFields(index, false);
    // Set check mark icon and color button green.
    $(editButton).children().first().html("<i class='material-icons'>check</i>");
    $(editButton).children().first().addClass("green");
    // editDrive(i);
  }
}

function setTextFields(index, disabled) {
  // var row = $("#drives-table--body").children().eq(index);
  var rows = $("#drives-table--body").children();
  var currentRow = rows.first();
  console.log(rows.length);
  for (let i = 0; i < rows.length; i++) {
    console.log(currentRow);
    console.log(i);
    if (i == index) {
      var currentField = currentRow.children().first();
      for (let i = 0; i < 8; i++) {
        currentField.children().first().prop('disabled', disabled);
        currentField = currentField.next();
      }
    } else {
      currentRow.toggleClass('disabled', !disabled);
    }
    currentRow = $(currentRow).next();
  }
}

function editDrive(index) {
  var password = prompt("Bitte geben Sie Ihr Passwort ein:", "");
  if (password != null) {
    $.ajax({
      url: url,
      type: 'PUT',
      data: '{\
      "id":"57a4e736d6194c39b5000001",\
      "author": "Marie",\
      "contact": "marie@slowfoodyouthh.de",\
      "from": "München",\
      "stops": [\
        ""\
      ],\
      "to": "Würzburg",\
      "seatsleft": 5,\
      "password":"' + password + '",\
      "dateCreated": "2002-10-02T17:00:00+02:00",\
      "dateModified": "2002-10-02T17:00:00+02:00"\
      }',
      success: function(result) {
        showSnackbarMsg("Eintrag geändert.")
        console.log(result);
      },
      error: function(result) {
        showSnackbarMsg("Sie haben ein falsches Passwort eingegeben.")
        console.debug("Error: " + JSON.stringify(result, null, 4));
      }
    });
  }
}

function deleteDrive(index) {
  console.log(index);
}

function showSnackbarMsg(message) {
  var snackbarContainer = document.querySelector('#snackbar');
  var handler = function(event) {
    // React to button press.
  };
  var data = {
    message: message,
    timeout: 4000,
    actionHandler: handler,
    actionText: 'Okay'
  };
  snackbarContainer.MaterialSnackbar.showSnackbar(data);
}
