// var url = 'http://www.slowfoodyouthh.de:8080/drives';
var url = 'http://localhost:8080/drives';
var drives = [];
var map = null;

var origin_place_id = null;
var destination_place_id = null;
var waypoints = [];
var travel_mode = 'DRIVING';
var directionsService = null;
var directionsDisplay = null;

jQuery(function($) {
  getDrives();
  $("#search-button").click(function() {
    triggerSearch();
  });
});

function initMap() {
  // Init map.
  map = new google.maps.Map(document.getElementById('map--canvas'), {
    center: {lat: 54.1657, lng: 10.4515},
    zoom: 6,
    mapTypeId: 'roadmap'
  });
  google.maps.event.addListenerOnce(map, 'idle', function() {
   google.maps.event.trigger(map, 'resize');
  });

  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer;
  directionsDisplay.setMap(map);
  // The three input fields.
  var origin_input = document.getElementById('origin-input');
  var destination_input = document.getElementById('destination-input');
  var via_input = document.getElementById('destination-via');

  function expandViewportToFitPlace(map, place) {
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
  }
  // Set up autocomplete.
  var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
  origin_autocomplete.bindTo('bounds', map);
  var destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
  destination_autocomplete.bindTo('bounds', map);
  var via_autocomplete = new google.maps.places.Autocomplete(via_input);
  via_autocomplete.bindTo('bounds', map);

  // Add listeners to the fields so that the route is displayed if enough info was entered.
  origin_autocomplete.addListener('place_changed', function() {
    var place = origin_autocomplete.getPlace();
    if (!place.geometry) {
      showSnackbarMsg("Ort nicht gefunden: " + place.name);
      return;
    }
    expandViewportToFitPlace(map, place);
    origin_place_id = place.place_id;
    triggerSearch();
  });

  destination_autocomplete.addListener('place_changed', function() {
    var place = destination_autocomplete.getPlace();
    if (!place.geometry) {
      showSnackbarMsg("Ort nicht gefunden: " + place.name);
      return;
    }
    expandViewportToFitPlace(map, place);
    destination_place_id = place.place_id;
    triggerSearch();
  });

  function addViaFieldListener(autocomplete) {
    autocomplete.addListener('place_changed', function() {
      var place = autocomplete.getPlace();
      if (!place.geometry) {
        showSnackbarMsg("Ort nicht gefunden: " + place.name);
        return;
      }
      expandViewportToFitPlace(map, place);
      waypoints.push({
        location: place.formatted_address,
        stopover: true
      });
      // Add another via field.
      if (getNumberOfEmptyViaFields() === 0) {
        let container = $(".destination-via-container").first();
        let downArrowIcon = $('<i class="arrow material-icons">arrow_downward</i>');
        container.append(downArrowIcon);
        let surroundingDiv = $('<div></div>');
        var via_input_new = $('<input class="destination-via controls" type="text" placeholder="Über"/>');
        let removeIcon = $('<button class="mdl-button mdl-js-button mdl-button--icon"><i class="material-icons">highlight_off</i></button>');
        surroundingDiv.append(via_input_new);
        surroundingDiv.append(removeIcon);
        container.append(surroundingDiv);

        removeIcon.click(function () {
          // Last one?
          if ($('.destination-via-container').first().find('input').length == 2) {
            // And empty?
            if (via_input_new.val() == '') {
              // Then don't remove it.
              return;
            // Not empty?
            } else {
              // Then empty it and re-search.
              via_input_new.val('');
              collectWaypoints();
              triggerSearch();
              return;
            }
          }
          // If we get here then there's at least one more via field.
          // So remove this one and re-search.
          surroundingDiv.remove();
          downArrowIcon.remove();
          collectWaypoints();
          triggerSearch();
        });
        // Enable autocomplete.
        let new_via_autocomplete = new google.maps.places.Autocomplete(via_input_new[0]);
        new_via_autocomplete.bindTo('bounds', map);
        addViaFieldListener(new_via_autocomplete);
        triggerSearch();
      }
    });
    selectFirstOnEnter(getLastViaSearchField()[0]);
  }

  addViaFieldListener(via_autocomplete);
  // Force search fields to select first option when no option is selected.
  selectFirstOnEnter(origin_input);
  // selectFirstOnEnter(via_input);
  selectFirstOnEnter(destination_input);
} // END initMap

function collectWaypoints() {
  waypoints = [];
  $('.destination-via-container').first().find('input').each(function(i, obj) {
    let value = $(obj).val();
    if (value !== '') {
      waypoints.push({
        location: value,
        stopover: true
      });
    }
  });
  origin_place_id = getFromSearchField().val();
  destination_place_id = getToSearchField().val();
}

function getNumberOfEmptyViaFields() {
  var number = 0;
  $('.destination-via-container').first().find('input').each(function(i, obj) {
    if ($(obj).val() === '') {
      number++
    }
  });
  return number;
}

function triggerSearch() {
  // console.log(origin_place_id + " " + waypoints[0].location + " " + destination_place_id);
  route(origin_place_id, waypoints, destination_place_id, travel_mode,
        directionsService, directionsDisplay);
}

var selectFirstOnEnter = function(input){      // store the original event binding function
    var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;
    function addEventListenerWrapper(type, listener) { // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected, and then trigger the original listener.
    if (type == "keydown") {
      var orig_listener = listener;
      listener = function (event) {
      var suggestion_selected = $(".pac-item-selected").length > 0;
        if (event.which == 13 && !suggestion_selected) { var simulated_downarrow = $.Event("keydown", {keyCode:40, which:40}); orig_listener.apply(input, [simulated_downarrow]); }
        orig_listener.apply(input, [event]);
      };
    }
    _addEventListener.apply(input, [type, listener]); // add the modified listener
  }
  if (input.addEventListener) { input.addEventListener = addEventListenerWrapper; } else if (input.attachEvent) { input.attachEvent = addEventListenerWrapper; }
}

function makeSearchFieldSelectFirstOption(input) {
  // Store the original event binding function.
  var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;
  function addEventListenerWrapper(type, listener) {
    // Simulate a 'down arrow' keypress on hitting 'return' when no pac suggestion is selected,
    // and then trigger the original listener.
    if (type == "keydown") {
      var orig_listener = listener;
      listener = function (event) {
        var suggestion_selected = $(".pac-item-selected").length > 0;
        if (event.which == 13 && !suggestion_selected) {
          var simulated_downarrow = $.Event("keydown", {keyCode:40, which:40})
          orig_listener.apply(input, [simulated_downarrow]);
        }
        orig_listener.apply(input, [event]);
      };
    }
    // Add the modified listener.
    _addEventListener.apply(input, [type, listener]);
  }
  if (input.addEventListener)
    input.addEventListener = addEventListenerWrapper;
}

function route(origin_place_id, waypoints, destination_place_id, travel_mode, directionsService, directionsDisplay) {
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
      console.log(status);
      console.debug(response);
    }
  });
}
function getFromSearchField() {
  return $('#origin-input');
}

function getLastViaSearchField() {
  return $('.destination-via-container').first().find('input').last();
}

function getToSearchField() {
  return $('#destination-input');
}

function clearSearchFields() {
  getFromSearchField().val('');
  getToSearchField().val('');
  $('.destination-via-container').first().find('div').each(function(i, obj) {
    $(obj).prev().remove();
    obj.remove();
  });
  getLastViaSearchField().val('');
  origin_place_id = '';
  destination_place_id = '';
  waypoints = [];
}

function populate(drive) {
  origin_place_id = drive['from']['placeId'];
  destination_place_id = drive['to']['placeId'];
  waypoints = [];
  for (let i = 0; i < drive['stops'].length; i++) {
    if (drive['stops'][i]['name'] !== "") {
      waypoints.push({
        location: {placeId: drive['stops'][i]['placeId']},
        stopover: true
      });
    }
  }
  triggerSearch();
}

function getDrives() {
  $.getJSON(url, function(answer) {
    if (drives != null) {
      drives = answer;
      // console.debug(drives);
    } else {
      drives = [];
    }
    display();
  });
}

function display() {
  var drivesContainer = $("#drives");
  drivesContainer.empty();
  // For each drive.
  if (drives != null) {
    for (let i = 0; i < drives.length; i++) {
      // Gather stops into string.
      let stops = [];
      for (let j = 0; j < drives[i]['stops'].length; j++) {
        let name = drives[i]['stops'][j]['name'];
        if (name !== "")
          stops.push(name);
      }
      let stopsHtml = "<div>";
      for (let j = 0; j < stops.length; j++) {
        stopsHtml += '&rarr; ' + stops[j] + '<br>';
      }
      stopsHtml += "</div>";
      let from = drives[i]['from']['name'];
      let to = drives[i]['to']['name'];
      let title = from + ' &rarr; ' + to;

      // Create an HTML entry.
      var entry = $("\
      <div class='mdl-cell mdl-cell--4-col'>\
        <div class='drive mdl-card mdl-shadow--6dp'>\
          <div class='mdl-card__title mdl-card--expand'>\
            <div class='mdl-card__title-text'><div>" + title + "</div></div>\
          </div>\
          <div class='mdl-card__supporting-text'>\
            <div class='drive__route'><i class='material-icons'>directions</i>\
              " + from + "\
              " + stopsHtml + "\
              &rarr; " + to + "\
            </div>\
            <br>\
            <div class='drive__date--departure'><i class='material-icons'>date_range</i> " + moment(drives[i]['dateDue']).format('DD.MM.YYYY') + "</div>\
            <br>\
            <div class='drive__date--departure-time'><i class='material-icons'>access_time</i> 16:00</div>\
            <br>\
            <div class='drive__author'><i class='material-icons'>person</i><input size='12' type='text' name='from' value='" + drives[i]['contact']['name'] + "' disabled='disabled'></div>\
            \
            <br>\
            <div class='drive__mail'><i class='material-icons'>email</i> <a href='" + drives[i]['contact']['mail'] + "'>" + drives[i]['contact']['mail'] + "</a></div>\
            <br>\
            <div class='drive__phone'><i class='material-icons'>phone</i> " + drives[i]['contact']['phone'] + "</div>\
            <hr>\
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.\
            Aenan convallis.\
            <br>\
          </div>\
          <div class='mdl-card__actions mdl-card--border'>\
          </div>\
        </div>\
      </div>\
      ");
      let buttonMap = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>\
        Auf Karte zeigen\
      </a>");
      buttonMap.click(function() {
        $(".mdl-layout__content").animate({scrollTop:0}, 350, "swing");
        onDriveClick(drives[i]);
      });
      let actions = entry.find(".mdl-card__actions").first();
      actions.append(buttonMap);

      let buttonEdit = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>\
        Bearbeiten\
        </a>");
      actions.append(buttonEdit);

      let buttonDelete = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>\
        Löschen\
      </a>");
      actions.append(buttonDelete);

      drivesContainer.append(entry);
      // var entry = $("\
      // <tr class='drive'>\
      //   <td class='drives-table--author mdl-data-table__cell--non-numeric'><input size='12' type='text' name='author' value='" + drives[i]['contact']['name'] + "' disabled='disabled'></td>\
      //   <td class='drives-table--from mdl-data-table__cell--non-numeric'><input size='12' type='text' name='from' value='" + drives[i]['from']['name'] + "' disabled='disabled'></td>\
      //   <td class='drives-table--stops mdl-data-table__cell--non-numeric'><input size='25' type='text' name='stops' value='" + stops + "' disabled='disabled'></td>\
      //   <td class='drives-table--to mdl-data-table__cell--non-numeric'><input size='12' type='text' name='to' value='" + drives[i]['to']['name'] + "' disabled='disabled'></td>\
      //   <td class='drives-table--seatsleft'><input size='2' type='text' name='seatsleft' value='" + drives[i]['seatsleft'] + "' disabled='disabled'></td>\
      //   <td class='drives-table--contact mdl-data-table__cell--non-numeric'><input size='25' type='text' name='contact' value='" + drives[i]['contact']['mail'] + "' disabled='disabled'></td>\
      //   <td class='drives-table--dateDue mdl-data-table__cell--non-numeric'><input size='8' type='date' name='dateCreated' value='" + moment(drives[i]['dateDue']).format("YYYY-MM-DD") + "' disabled='disabled'></td>\
      //   <td class='drives-table--dateModified mdl-data-table__cell--non-numeric'><input size='8' type='date' name='dateModified' value='" + moment(drives[i]['dateModified']).format("YYYY-MM-DD") + "' disabled='disabled'></td>\
      //   <td class='drives-table--id hide'><input size='0' type='text' name='id' value='" + drives[i]['id'] + "' disabled='disabled'></td>\
      //   ");
      // entry.click(function() {
      //   onDriveClick(this);
      // });
      // // And an edit button.
      // var editButton = $("<td><button class='editButton mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>mode_edit</i></button></td>");
      // editButton.click(function() {
      //   onEditButton(this, i);
      // });
      // entry.append(editButton);
      // // And a delete button.
      // var deleteButton = $("<td><button class='deleteButton red mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>delete</i></button></td>");
      // deleteButton.click(function() {
      //   onDeleteButton(this, i);
      // });
      // entry.append(deleteButton);
      // entry.append("</tr>");
      // table.append(entry);
    }
  }

  // Also add the last row that lets the user add new drives.
  // var newEntry = $("\
  //   <tr>\
  //     <td class='drives-table--author mdl-data-table__cell--non-numeric'><input size='12' type='text' name='author' placeholder='Name' disabled='disabled'></td>\
  //     <td class='drives-table--from mdl-data-table__cell--non-numeric'><input size='12' type='text' name='from' placeholder='Abfahrtsort' disabled='disabled'></td>\
  //     <td class='drives-table--stops mdl-data-table__cell--non-numeric'><input size='25' type='text' name='stops' placeholder='Zwischenstops' disabled='disabled'></td>\
  //     <td class='drives-table--to mdl-data-table__cell--non-numeric'><input size='12' type='text' name='to' placeholder='Zielort' disabled='disabled'></td>\
  //     <td class='drives-table--seatsleft'><input size='2' type='text' name='seatsleft' placeholder='' disabled='disabled'></td>\
  //     <td class='drives-table--contact mdl-data-table__cell--non-numeric'><input size='25' type='text' name='contact' placeholder='Email/Tel' disabled='disabled'></td>\
  //     <td class='drives-table--dateDue mdl-data-table__cell--non-numeric'><input size='8' type='date' name='dateCreated' placeholder='Abfahrtstag' disabled='disabled'></td>\
  //     <td></td>\
  //     ");
  // var addButton = $("<td><button class='addButton mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>add</i></button></td>");
  // addButton.click(function() {
  //   onAddButton(this);
  // });
  // newEntry.append(addButton);
  // var cancelButton = $("<td><button class='cancelButton disabled mdl-button mdl-js-button mdl-button--raised' type='button' disabled><i class='material-icons'>clear</i></button></td>");
  // cancelButton.click(function() {
  //   fillTable();
  // });
  // newEntry.append(cancelButton);
  // table.append(newEntry);
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
    var drive = gatherInputFromIndex(index);
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
    var drive = gatherInputFromIndex(position);
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
    var drive = gatherInputFromIndex(index);
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

function gatherInputFromRow(row) {
  return drives[$(row).index()];
}

/** Gathers all drive info on ith row and returns it as an object. */
function gatherInputFromIndex(index) {
  return gatherInputFromRow(getRow(index));
}

/** Checks a row for sane input. */
function checkInput(index) {
  var drive = gatherInputFromIndex(index);
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

function onDriveClick(drive) {  
  populate(drive);
}
