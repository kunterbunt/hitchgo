var url = 'http://api.localhost:8080/drives';
var drives = [];
var map = null;

jQuery(function($) {
  getDrives();
});

function initMap() {
  map = new google.maps.Map(document.getElementById('map--canvas'), {
    center: {lat: 54.1657, lng: 10.4515},
    zoom: 6,
    mapTypeId: 'roadmap'
  });
  google.maps.event.addListenerOnce(map, 'idle', function() {
   google.maps.event.trigger(map, 'resize');
  });

  var origin_place_id = null;
  var destination_place_id = null;
  var waypoints = [];
  var travel_mode = 'DRIVING';
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  directionsDisplay.setMap(map);

  var origin_input = document.getElementById('origin-input');
  var destination_input = document.getElementById('destination-input');
  var via_input = document.getElementById('destination-via');
  // var via_input = $('.destination-via').first();
  console.debug(via_input);
  // map.controls[google.maps.ControlPosition.TOP_LEFT].push(origin_input);

  // map.controls[google.maps.ControlPosition.TOP_LEFT].push(destination_input);

  function expandViewportToFitPlace(map, place) {
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
  }

  var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
  origin_autocomplete.bindTo('bounds', map);
  var destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
  destination_autocomplete.bindTo('bounds', map);
  var via_autocomplete = new google.maps.places.Autocomplete(via_input);
  via_autocomplete.bindTo('bounds', map);

  origin_autocomplete.addListener('place_changed', function() {
    var place = origin_autocomplete.getPlace();
    if (!place.geometry) {
      showSnackbarMsg("Ort nicht gefunden: " + place.name);
      return;
    }
    expandViewportToFitPlace(map, place);

    // If the place has a geometry, store its place ID and route if we have
    // the other place ID
    origin_place_id = place.place_id;
    route(origin_place_id, waypoints, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
  });

  destination_autocomplete.addListener('place_changed', function() {
    var place = destination_autocomplete.getPlace();
    if (!place.geometry) {
      showSnackbarMsg("Ort nicht gefunden: " + place.name);
      return;
    }
    expandViewportToFitPlace(map, place);

    // If the place has a geometry, store its place ID and route if we have
    // the other place ID
    destination_place_id = place.place_id;
    route(origin_place_id, waypoints, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
  });

  via_autocomplete.addListener('place_changed', function() {
    var place = via_autocomplete.getPlace();
    if (!place.geometry) {
      showSnackbarMsg("Ort nicht gefunden: " + place.name);
      return;
    }
    expandViewportToFitPlace(map, place);

    console.debug(place);

    waypoints.push({
      location: place.formatted_address,
      stopover: true
    });
    route(origin_place_id, waypoints, destination_place_id, travel_mode,
          directionsService, directionsDisplay);
  });

  function route(origin_place_id, waypoints, destination_place_id, travel_mode,
                 directionsService, directionsDisplay) {
    if (!origin_place_id || !destination_place_id) {
      return;
    }
    directionsService.route({
      origin: {'placeId': origin_place_id},
      destination: {'placeId': destination_place_id},
      waypoints: waypoints,
      optimizeWaypoints: true,
      travelMode: travel_mode
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
      } else {
        showSnackbarMsg('Fehler von Google: ' + status);
      }
    });
  }

}

function getDrives() {
  $.getJSON(url, function(answer) {
    if (drives != null)
      drives = answer;
    else {
      drives = [];
    }
    fillTable();
  });
}

function fillTable() {
  var table = $("#drives-table--body");
  table.empty();
  // For each drive.
  if (drives != null) {
    for (let i = 0; i < drives.length; i++) {
      // Create an HTML entry.
      var entry = $("\
      <tr>\
        <td class='drives-table--author mdl-data-table__cell--non-numeric'><input size='12' type='text' name='author' value='" + drives[i]['author'] + "' disabled='disabled'></td>\
        <td class='drives-table--from mdl-data-table__cell--non-numeric'><input size='12' type='text' name='from' value='" + drives[i]['from'] + "' disabled='disabled'></td>\
        <td class='drives-table--stops mdl-data-table__cell--non-numeric'><input size='25' type='text' name='stops' value='" + drives[i]['stops'] + "' disabled='disabled'></td>\
        <td class='drives-table--to mdl-data-table__cell--non-numeric'><input size='12' type='text' name='to' value='" + drives[i]['to'] + "' disabled='disabled'></td>\
        <td class='drives-table--seatsleft'><input size='2' type='text' name='seatsleft' value='" + drives[i]['seatsleft'] + "' disabled='disabled'></td>\
        <td class='drives-table--contact mdl-data-table__cell--non-numeric'><input size='25' type='text' name='contact' value='" + drives[i]['contact'] + "' disabled='disabled'></td>\
        <td class='drives-table--dateDue mdl-data-table__cell--non-numeric'><input size='8' type='date' name='dateCreated' value='" + moment(drives[i]['dateDue']).format("YYYY-MM-DD") + "' disabled='disabled'></td>\
        <td class='drives-table--dateModified mdl-data-table__cell--non-numeric'><input size='8' type='date' name='dateModified' value='" + moment(drives[i]['dateModified']).format("YYYY-MM-DD") + "' disabled='disabled'></td>\
        <td class='drives-table--id hide'><input size='0' type='text' name='id' value='" + drives[i]['id'] + "' disabled='disabled'></td>\
        ");
      // And an edit button.
      var editButton = $("<td><button class='editButton mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>mode_edit</i></button></td>");
      editButton.click(function() {
        onEditButton(this, i);
      });
      entry.append(editButton);
      // And a delete button.
      var deleteButton = $("<td><button class='deleteButton red mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>delete</i></button></td>");
      deleteButton.click(function() {
        onDeleteButton(this, i);
      });
      entry.append(deleteButton);
      entry.append("</tr>");
      table.append(entry);
    }
  }

  // Also add the last row that lets the user add new drives.
  var newEntry = $("\
    <tr>\
      <td class='drives-table--author mdl-data-table__cell--non-numeric'><input size='12' type='text' name='author' placeholder='Name' disabled='disabled'></td>\
      <td class='drives-table--from mdl-data-table__cell--non-numeric'><input size='12' type='text' name='from' placeholder='Abfahrtsort' disabled='disabled'></td>\
      <td class='drives-table--stops mdl-data-table__cell--non-numeric'><input size='25' type='text' name='stops' placeholder='Zwischenstops' disabled='disabled'></td>\
      <td class='drives-table--to mdl-data-table__cell--non-numeric'><input size='12' type='text' name='to' placeholder='Zielort' disabled='disabled'></td>\
      <td class='drives-table--seatsleft'><input size='2' type='text' name='seatsleft' placeholder='' disabled='disabled'></td>\
      <td class='drives-table--contact mdl-data-table__cell--non-numeric'><input size='25' type='text' name='contact' placeholder='Email/Tel' disabled='disabled'></td>\
      <td class='drives-table--dateDue mdl-data-table__cell--non-numeric'><input size='8' type='date' name='dateCreated' placeholder='Abfahrtstag' disabled='disabled'></td>\
      <td></td>\
      ");
  var addButton = $("<td><button class='addButton mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>add</i></button></td>");
  addButton.click(function() {
    onAddButton(this);
  });
  newEntry.append(addButton);
  var cancelButton = $("<td><button class='cancelButton disabled mdl-button mdl-js-button mdl-button--raised' type='button' disabled><i class='material-icons'>clear</i></button></td>");
  cancelButton.click(function() {
    fillTable();
  });
  newEntry.append(cancelButton);
  table.append(newEntry);
}

function onAddButton(button) {
  let position = drives == null ? 0 : drives.length;
  setTextFields(position, false);
  getDeleteButton(position).children("button").first().removeClass('disabled');
  getDeleteButton(position).children("button").first().prop('disabled', false);
  setButton(button, "<i class='material-icons'>check</i>", "doneButton", "addButton");
  $(button).unbind().click(function() {
    attemptAdd();
  });
}

function onCancelButton(cancelButton, index) {
  var isDisabled = $(cancelButton).children("button").first().prop('disabled');
  if (isDisabled) {
    return;
  }
  setButton(cancelButton, "<i class='material-icons'>delete</i>", "deleteButton", "cancelButton");
  $(cancelButton).unbind().click(function() {
    onDeleteButton(cancelButton);
  });
  onEditButton(getEditButton(index), index);
  fillTable();
}

function onDeleteButton(deleteButton, index) {
  var password = prompt("Bitte geben Sie Ihr Passwort ein:", "");
  if (password != null) {
    var drive = gatherInput(index);
    var data = {id: drive['id'], password: password};
    $.ajax({
      url: url,
      type: 'DELETE',
      data: JSON.stringify(data, null, 2),
      success: function(result) {
        console.log(result);
        showSnackbarMsg("Eintrag gelöscht.")
        getDrives();
      },
      error: function(result) {
        console.debug("Error: " + JSON.stringify(result, null, 4));
        showSnackbarMsg("Ein Fehler ist aufgetreten.")
      }
    });
  }
}

/** Edit/Done button click events. */
function onEditButton(editButton, index) {
  var isCheckIcon = $(editButton).children().first().html() == '<i class="material-icons">check</i>';
  // Click on 'done' button.
  if (isCheckIcon) {
    // Disable input fields, change to edit button.
    setTextFields(index, true);
    setButton(editButton, "<i class='material-icons'>mode_edit</i>", "editButton", "doneButton");
    // Set its click action to calling this function.
    $(editButton).unbind().click(function() {
      onEditButton(editButton, index);
    });
  // Click on 'edit' button.
  } else {
    // Enable input fields for edit, change done button.
    setTextFields(index, false);
    setButton(editButton, "<i class='material-icons'>check</i>", "doneButton", "editButton");
    // Set its click action to asking for password and eventually sending the HTTP PUT request.
    $(editButton).unbind().click(function() {
      attemptEdit(editButton, index);
    });
    // Refunction delete button to serve as cancel button.
    deleteButton = getDeleteButton(index);
    setButton(deleteButton, "<i class='material-icons'>clear</i>", "cancelButton", "deleteButton");
    $(deleteButton).unbind().click(function() {
      onCancelButton(deleteButton, index);
    });
  }
}

/** Enable or disable the input fields on the ith row. */
function setTextFields(index, disabled) {
  var rows = $("#drives-table--body").children();
  var currentRow = rows.first();
  for (let i = 0; i < rows.length; i++) {
    if (i == index) {
      var currentField = currentRow.children().first();
      for (let i = 0; i < 7; i++) {
        currentField.children().first().prop('disabled', disabled);
        currentField = currentField.next();
      }
    } else {
      currentRow.toggleClass('disabled', !disabled);
    }
    currentRow = $(currentRow).next();
  }
}

/** Returns ith row's <tr> element. */
function getRow(index) {
  return $("#drives-table--body").children().eq(index);
}

function attemptAdd(button) {
  let position = drives == null ? 0 : drives.length;
  if (!checkInput(position))
    return;
  var password = prompt("Bitte geben Sie ein Passwort ein. Nur damit kann der Eintrag geändert oder gelöscht werden.", "");
  if (password != null) {
    var drive = gatherInput(position);
    drive['password'] = password;
    $.ajax({
      url: url,
      type: 'POST',
      data: JSON.stringify(drive, null, 2),
      success: function(result) {
        console.log(result);
        showSnackbarMsg("Eintrag hinzugefügt.")
        getDrives();
      },
      error: function(result) {
        console.debug("Error: " + JSON.stringify(result, null, 4));
        showSnackbarMsg("Ein Fehler ist aufgetreten.")
      }
    });
  }
}

/** Asks for user password and sends out an HTTP PUT request. */
function attemptEdit(editButton, index) {
  if (!checkInput(index))
    return;
  var password = prompt("Bitte geben Sie Ihr Passwort ein:", "");
  if (password != null) {
    var drive = gatherInput(index);
    drive['password'] = password;
    $.ajax({
      url: url,
      type: 'PUT',
      data: JSON.stringify(drive, null, 2),
      success: function(result) {
        console.log(result);
        showSnackbarMsg("Eintrag geändert.")
        onEditButton(editButton, index);
        getDrives();
      },
      error: function(result) {
        console.debug("Error: " + JSON.stringify(result, null, 4));
        showSnackbarMsg("Ein Fehler ist aufgetreten. Haben Sie vielleicht ein falsches Passwort eingegeben?")
      }
    });
  }
}

/** Gathers all drive info on ith row and returns it as an object. */
function gatherInput(index) {
  var row = getRow(index);
  var drive = {
    id: row.children(".drives-table--id").first().children().first().val(),
    author: row.children(".drives-table--author").first().children().first().val(),
    from: row.children(".drives-table--from").first().children().first().val(),
    stops: [row.children(".drives-table--stops").first().children().first().val()],
    to: row.children(".drives-table--to").first().children().first().val(),
    seatsleft: parseInt(row.children(".drives-table--seatsleft").first().children().first().val(), 10),
    contact: row.children(".drives-table--contact").first().children().first().val(),
    dateDue: moment(row.children(".drives-table--dateDue").first().children().first().val(), "YYYY-MM-DD[T]HH:mm:ss[+02:00]")
  }
  return drive;
}

/** Checks a row for sane input. */
function checkInput(index) {
  var drive = gatherInput(index);
  var row = getRow(index);
  var errorOccurred = false;
  // Check all these that are expected to contain strings.
  var compulsory = ['author', 'from', 'to', 'contact', 'dateDue'];
  compulsory.forEach(function(field) {
    if (drive[field] == "") {
      row.children(".drives-table--" + field).first().children().first().addClass('missing');
      errorOccurred = true;
    } else {
      row.children(".drives-table--" + field).first().children().first().removeClass('missing');
    }
  });

  // Check if there's a number as seats left.
  if (isNaN(drive['seatsleft'])) {
    row.children(".drives-table--seatsleft").first().children().first().addClass('missing');
    errorOccurred = true;
  } else {
    if (drive['seatsleft'] < 0) {
      row.children(".drives-table--seatsleft").first().children().first().addClass('missing');
      errorOccurred = true;
    } else {
      row.children(".drives-table--seatsleft").first().children().first().removeClass('missing');
    }
  }

  if (!Date.parse(row.children(".drives-table--dateDue").first().children().first().val())) {
    row.children(".drives-table--dateDue").first().children().first().addClass('missing');
    errorOccurred = true;
  } else {
    var pickedDate = Date.parse(row.children(".drives-table--dateDue").first().children().first().val());
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (pickedDate < yesterday) {
      row.children(".drives-table--dateDue").first().children().first().addClass('missing');
      errorOccurred = true;
    } else {
      row.children(".drives-table--dateDue").first().children().first().removeClass('missing');
    }
  }

  if (errorOccurred) {
    showSnackbarMsg("Überprüfen Sie die rot markierten Felder!");
    return false;
  }
  return true;
}

/** Change a button's HTML and set classes for default MDL button. */
function setButton(button, html, classesToAdd, classesToRemove) {
  if (html != "")
    $(button).children().first().html(html);
  if (classesToAdd != "")
    $(button).children().first().addClass(classesToAdd);
  if (classesToRemove != "")
    $(button).children().first().removeClass(classesToRemove);
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

function getEditButton(index) {
  var row = getRow(index);
  return $(row).children("td").children(".editButton, .doneButton").first().parent();
}

function getDeleteButton(index) {
  var row = getRow(index);
  return $(row).children("td").children(".deleteButton, .cancelButton").first().parent();
}
