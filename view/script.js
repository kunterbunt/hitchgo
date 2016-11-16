// var url = 'http://www.slowfoodyouthh.de:8080/drives';
var url = 'http://localhost:8080/drives';
var loadedDrives = [];
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
  $("#addCardButton").click(function() {
    onAddButton();
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
  // var origin_input = document.getElementById('origin-input');
  // var destination_input = document.getElementById('destination-input');
  // var via_input = document.getElementById('destination-via');
  //
  // function expandViewportToFitPlace(map, place) {
  //   if (place.geometry.viewport) {
  //     map.fitBounds(place.geometry.viewport);
  //   } else {
  //     map.setCenter(place.geometry.location);
  //     map.setZoom(17);
  //   }
  // }
  // // Set up autocomplete.
  // var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
  // origin_autocomplete.bindTo('bounds', map);
  // var destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
  // destination_autocomplete.bindTo('bounds', map);
  // var via_autocomplete = new google.maps.places.Autocomplete(via_input);
  // via_autocomplete.bindTo('bounds', map);
  //
  // // Add listeners to the fields so that the route is displayed if enough info was entered.
  // origin_autocomplete.addListener('place_changed', function() {
  //   var place = origin_autocomplete.getPlace();
  //   if (!place.geometry) {
  //     showSnackbarMsg("Ort nicht gefunden: " + place.name);
  //     return;
  //   }
  //   expandViewportToFitPlace(map, place);
  //   origin_place_id = place.place_id;
  //   triggerSearch();
  // });
  //
  // destination_autocomplete.addListener('place_changed', function() {
  //   var place = destination_autocomplete.getPlace();
  //   if (!place.geometry) {
  //     showSnackbarMsg("Ort nicht gefunden: " + place.name);
  //     return;
  //   }
  //   expandViewportToFitPlace(map, place);
  //   destination_place_id = place.place_id;
  //   triggerSearch();
  // });
  //
  // function addViaFieldListener(autocomplete) {
  //   autocomplete.addListener('place_changed', function() {
  //     var place = autocomplete.getPlace();
  //     if (!place.geometry) {
  //       showSnackbarMsg("Ort nicht gefunden: " + place.name);
  //       return;
  //     }
  //     expandViewportToFitPlace(map, place);
  //     waypoints.push({
  //       location: place.formatted_address,
  //       stopover: true
  //     });
  //     // Add another via field.
  //     if (getNumberOfEmptyViaFields() === 0) {
  //       let container = $(".destination-via-container").first();
  //       let downArrowIcon = $('<i class="arrow material-icons">arrow_downward</i>');
  //       container.append(downArrowIcon);
  //       let surroundingDiv = $('<div></div>');
  //       var via_input_new = $('<input class="destination-via controls" type="text" placeholder="Über"/>');
  //       let removeIcon = $('<button class="mdl-button mdl-js-button mdl-button--icon"><i class="material-icons">highlight_off</i></button>');
  //       surroundingDiv.append(via_input_new);
  //       surroundingDiv.append(removeIcon);
  //       container.append(surroundingDiv);
  //
  //       removeIcon.click(function () {
  //         // Last one?
  //         if ($('.destination-via-container').first().find('input').length == 2) {
  //           // And empty?
  //           if (via_input_new.val() == '') {
  //             // Then don't remove it.
  //             return;
  //           // Not empty?
  //           } else {
  //             // Then empty it and re-search.
  //             via_input_new.val('');
  //             collectWaypoints();
  //             triggerSearch();
  //             return;
  //           }
  //         }
  //         // If we get here then there's at least one more via field.
  //         // So remove this one and re-search.
  //         surroundingDiv.remove();
  //         downArrowIcon.remove();
  //         collectWaypoints();
  //         triggerSearch();
  //       });
  //       // Enable autocomplete.
  //       let new_via_autocomplete = new google.maps.places.Autocomplete(via_input_new[0]);
  //       new_via_autocomplete.bindTo('bounds', map);
  //       addViaFieldListener(new_via_autocomplete);
  //       triggerSearch();
  //     }
  //   });
  //   selectFirstOnEnter(getLastViaSearchField()[0]);
  // }
  //
  // addViaFieldListener(via_autocomplete);
  // // Force search fields to select first option when no option is selected.
  // selectFirstOnEnter(origin_input);
  // // selectFirstOnEnter(via_input);
  // selectFirstOnEnter(destination_input);
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
  route(origin_place_id, waypoints, destination_place_id, travel_mode, directionsService, directionsDisplay);
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

function showOnMap(drive) {
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
    if (answer != null) {
      loadedDrives = answer;
      // console.debug(loadedDrives);
    } else {
      loadedDrives = [];
    }
    display(loadedDrives);
  });
}

function generateCard(drive) {
  let isEditing = drive.editing === true;
  let disabledHtml = isEditing ? "" : " disabled='disabled'";
  let editingClass = isEditing ? "editing" : "";
  // Gather stops into string.
  let stopsHtml = "<div class='drive--route__stops'>";
  for (let j = 0; j < drive['stops'].length; j++) {
    let name = drive['stops'][j]['name'];
    if (name !== "")
      stopsHtml += "<div class='drive__route--via mdl-textfield mdl-js-textfield'>\
         <i class='material-icons'>&rarr;</i> <input size='28' class='mdl-textfield__input' type='text' name='via" + j + "' id='drive__route--via" + j + "'--input' value='" + name + "' " + disabledHtml + ">\
      </div>";
  }
  stopsHtml += "</div>";
  // Set titles.
  let from = drive['from']['name'];
  let to = drive['to']['name'];
  let title = "Neue Fahrt";
  if (from != "" && to != "") {
    title = from + ' &rarr; ' + to;
  }

  // Make adding stops possible.
  let addNewStopElement = isEditing ? "<div class='addButtonContainer'><button class='addStopButton mdl-button mdl-js-button mdl-button--icon'><i class='material-icons'>add_circle</i></button></div><br>" : "";

  // Create an HTML entry.
  var card = $("\
  <div class='mdl-cell mdl-cell--4-col'>\
    <div id='" + drive['id'] + "' class='drive " + editingClass + " mdl-card mdl-shadow--6dp'>\
      <div class='mdl-card__title mdl-card--expand'>\
        <div class='mdl-card__title-text'><div>" + title + "</div></div>\
      </div>\
      <div class='mdl-card__supporting-text'>\
        <form action='#'>\
          <div class='drive__route--from mdl-textfield mdl-js-textfield'>\
            <i class='material-icons'>directions</i>\
            <input size='28' class='mdl-textfield__input' type='text' name='from' id='drive__route--from--input' value='" + from + "' " + disabledHtml + ">\
            <label class='mdl-textfield__label' for='drive__route--from--input'>Von</label>\
          </div>\
          " + stopsHtml + "\
          " + addNewStopElement + "\
          <div class='drive__route--to mdl-textfield mdl-js-textfield'>\
             <i class='material-icons'>&rarr;</i> <input size='28' class='mdl-textfield__input' type='text' name='to' id='drive__route--to--input' value='" + to + "' " + disabledHtml + ">\
            <label class='mdl-textfield__label' for='drive__route--to--input'>Nach</label>\
          </div>\
          <br>\
          <div class='drive__date--departure mdl-textfield mdl-js-textfield'>\
            <i class='material-icons'>date_range</i>\
            <input size='28' class='mdl-textfield__input' type='date' name='dateDue' id='drive__date--departure--input' value='" + moment(drive['dateDue']).format('YYYY-MM-DD') + "' " + disabledHtml + ">\
            <label class='mdl-textfield__label' for='drive__date--departure--input'>Abfahrtszeit</label>\
            <span class='mdl-textfield__error'>Das sieht nicht aus wie eine positive Zahl!</span>\
          </div>\
          <br>\
          <div class='drive__date--departure-time mdl-textfield mdl-js-textfield'>\
            <i class='material-icons'>access_time</i>\
            <input size='28' class='mdl-textfield__input' type='time' name='timeDue' id='drive__date--departure-time--input' value='" + moment(drive['dateDue']).format('HH:mm:ss') + "' " + disabledHtml + ">\
            <label class='mdl-textfield__label' for='drive__date--departure-time--input'>Abfahrtszeit</label>\
            <span class='mdl-textfield__error'>Das sieht nicht aus wie eine positive Zahl!</span>\
          </div>\
          <br>\
          <div class='drive__seatsleft mdl-textfield mdl-js-textfield'>\
            <i class='material-icons'>event_seat</i>\
            <input size='28' class='mdl-textfield__input' type='text' name='seatsleft' id='drive__seatsleft--input' pattern='[0-9]*' value='" + drive['seatsleft'] + "' " + disabledHtml + ">\
            <label class='mdl-textfield__label' for='drive__seatsleft--input'>#freie Plätze</label>\
            <span class='mdl-textfield__error'>Das sieht nicht aus wie eine positive Zahl!</span>\
          </div>\
          <br>\
          <div class='drive__author mdl-textfield mdl-js-textfield'>\
            <i class='material-icons'>person</i>\
            <input size='28' class='mdl-textfield__input' type='text' name='name' id='drive__author--input' value='" + drive['contact']['name'] + "' " + disabledHtml + ">\
            <label class='mdl-textfield__label' for='drive__author--input'>Fahrer</label>\
          </div>\
          <br>\
          <div class='drive__mail mdl-textfield mdl-js-textfield'>\
            <i class='material-icons'>email</i>\
            <input size='28' class='mdl-textfield__input' type='email' name='mail' id='drive__mail--input' value='" + drive['contact']['mail'] + "' " + disabledHtml + ">\
            <label class='mdl-textfield__label' for='drive__mail--input'>Mail</label>\
            <span class='mdl-textfield__error'>Das sieht nicht aus wie eine Emailadresse!</span>\
          </div>\
          <br>\
          <div class='drive__phone mdl-textfield mdl-js-textfield'>\
            <i class='material-icons'>phone</i>\
            <input size='28' class='mdl-textfield__input' type='tel' name='phone' id='drive__phone--input' pattern='-?[0-9]*(\.[0-9]+)?' value='" + drive['contact']['phone'] + "' " + disabledHtml + ">\
            <label class='mdl-textfield__label' for='drive__phone--input'>Telefon</label>\
            <span class='mdl-textfield__error'>Das sieht nicht aus wie eine Telefonnummer!</span>\
          </div>\
          <hr>\
          <div class='drive__description mdl-textfield mdl-js-textfield'>\
            <textarea class='mdl-textfield__input' type='text' rows='4' " + disabledHtml + ">Lorem ipsum dolor sit amet, consectetur adipiscing elit.\
              Aenan convallis.</textarea>\
          </div>\
          <br>\
        </form>\
      </div>\
      <div class='mdl-card__actions mdl-card--border'>\
      </div>\
    </div>\
  </div>\
  ");

  return card;
}

function display(drives) {
  var drivesContainer = $("#drives");
  drivesContainer.empty();
  // For each drive.
  if (drives != null) {
    for (let i = 0; i < drives.length; i++) {
      // Generate the card.
      let card = generateCard(drives[i]);
      // Add buttons.
      let actions = card.find(".mdl-card__actions").first();
      let buttons = [];
      // Editing mode.
      if (drives[i].editing == true) {
        let buttonOk = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>Hinzufügen</a>");
        buttons.push(buttonOk);
        let buttonCancel = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>Abbrechen</a>");
        buttons.push(buttonCancel);
      // Viewing mode.
      } else {
        // Append show on map button.
        let buttonMap = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>\
          Auf Karte zeigen\
        </a>");
        buttonMap.click(function() {
          $(".mdl-layout__content").animate({scrollTop:0}, 350, "swing");
          onDriveClick(drives[i]);
        });
        buttons.push(buttonMap);

        // Append edit button.
        let buttonEdit = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>\
          Bearbeiten\
          </a>");
        buttons.push(buttonEdit);

        // Append delete button.
        let buttonDelete = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>\
          Löschen\
        </a>");
        buttons.push(buttonDelete);
      }
      buttons.forEach(function(button) {
        actions.append(button);
      });
      drivesContainer.append(card);
    }
  }
  componentHandler.upgradeDom(); // Tell MDL to update DOM and apply nice styling to all newly added elements.

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

function createEmptyDrive() {
  return {
    "id":"",
    "contact":{"name":"","mail":"","phone":""},
    "dateCreated":"",
    "dateDue":"",
    "dateModified":"",
    "from":{"name":"", "placeId":""},
    "to":{"name":"", "placeId":""},
    "password":"",
    "seatsleft":0,
    stops:[]
  };
}

function onAddButton(button) {
  drives = [];
  let newDrive = createEmptyDrive();
  newDrive.editing = true;
  newDrive.id = "newDrive";
  newDrive.dateDue = moment().add(1, 'day').format('YYYY-MM-DD');
  drives.push(newDrive);
  for (let i = 0; i < loadedDrives.length; i++)
    drives.push(loadedDrives[i]);
  display(drives);
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
  let position = loadedDrives == null ? 0 : loadedDrives.length;
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
  return loadedDrives[$(row).index()];
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
  showOnMap(drive);
}
