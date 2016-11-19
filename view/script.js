// var url = 'http://www.slowfoodyouthh.de:8080/drives';
var url = 'http://localhost:8080/drives';
var loadedDrives = [];
var map = null;

var placeOrigin = {"name":"", "id":""};
var placeDestination = {"name":"", "id":""};
var waypoints = [];
var travel_mode = 'DRIVING';
var directionsService = null;
var directionsDisplay = null;
var editingMode = false;

jQuery(function($) {
  // Load drives from the server and display them.
  getDrives();
  // Plus button adds a new drive.
  $("#addCardButton").click(function() {
    onAddButton();
  });
});

/** Loads drives from the server and displays them. */
function getDrives() {
  $.getJSON(url, function(answer) {
    if (answer != null) {
      loadedDrives = answer;
    } else {
      loadedDrives = [];
    }
    display(loadedDrives);
  });
}

/** Sets up the map. */
function initMap() {
  map = new google.maps.Map(document.getElementById('map--canvas'), {
    center: {lat: 50.931244, lng: 10.355650}, // Center of Germany.
    zoom: 6,
    mapTypeId: 'roadmap'
  });
  // Sometimes the map doesn't load until it has been resized.
  // This workaround attempts to trigger a resize event once the map has loaded.
  google.maps.event.addListenerOnce(map, 'idle', function() {
   google.maps.event.trigger(map, 'resize');
  });

  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer;
  directionsDisplay.setMap(map);
}

/** Focus the map on a place. */
function expandViewportToFitPlace(place) {
  if (place.geometry.viewport) {
    map.fitBounds(place.geometry.viewport);
  } else {
    map.setCenter(place.geometry.location);
    map.setZoom(17);
  }
}

/** Asks a Google server for the route and displays the result on the map. */
function route(placeOrigin, waypoints, placeDestination, travel_mode, directionsService, directionsDisplay) {
  if (placeOrigin['id'] === "" || placeDestination['id'] === "") {
    return;
  }
  let transformedWaypoints = [];
  for (let i = 0; i < waypoints.length; i++) {
    transformedWaypoints.push({location: {placeId: waypoints[i]['placeId']}, stopover: true});
  }
  directionsService.route({
    origin: {'placeId': placeOrigin['id']},
    destination: {'placeId': placeDestination['id']},
    waypoints: transformedWaypoints,
    optimizeWaypoints: false,
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

/** Given a drive object, find the route and display it. */
function showOnMap(drive) {
  placeOrigin['name'] = drive['from']['name'];
  placeOrigin['id'] = drive['from']['placeId'];
  placeDestination['name'] = drive['to']['name'];
  placeDestination['id'] = drive['to']['placeId'];
  waypoints = [];
  for (let i = 0; i < drive['stops'].length; i++) {
    if (drive['stops'][i]['name'] !== "") {
      waypoints.push({
        name: drive['stops'][i]['name'],
        placeId: drive['stops'][i]['placeId']
      });
    }
  }
  triggerSearch();
}

/** Given an HTML input element, turn it into a Google places autocomplete field.
functionToCall(name, id) is triggered when the field is changed. */
function setupAutocomplete(inputElement, functionToCall) {
  let autocomplete = new google.maps.places.Autocomplete(inputElement);
  autocomplete.bindTo('bounds', map);
  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      showSnackbarMsg("Ort nicht gefunden: " + place.name);
      return;
    }
    expandViewportToFitPlace(place);
    functionToCall(place.name, place.place_id);
    triggerSearch();
  });
}

/** Convenience method that asks a Google server for the route currently saved in placeOrigin, waypoints, placeDestination. */
function triggerSearch() {
  route(placeOrigin, waypoints, placeDestination, travel_mode, directionsService, directionsDisplay);
}

/** Hacky way of forcing an enter press on a given autocomplete field to select the first suggestion. */
function selectFirstOnEnter(input) {
  // store the original event binding function
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

/** Generates the HTML entity that describes a drive.
    Does not include buttons. */
function generateCard(drive) {
  let isEditing = drive.editing === true;
  let disabledHtml = isEditing ? "" : " disabled='disabled'";
  let editingClass = isEditing ? "editing" : "";
  // Gather stops into string.
  let stopsHtml = "<div class='drive--route__stops'>";
  for (var j = 0; j < drive['stops'].length; j++) {
    let name = drive['stops'][j]['name'];
    if (name !== "")
      stopsHtml += "<div class='drive__route--via mdl-textfield mdl-js-textfield'>\
         <i class='material-icons'>&rarr;</i> <input size='28' class='mdl-textfield__input' type='text' name='via" + j + "' id='drive__route--via" + j + "'--input' value='" + name + "' " + disabledHtml + ">\
      </div>";
  }
  // Possibly add an empty field so the user can add another stop.
  if (isEditing && drive.hasNewStopField === true) {
    stopsHtml += "<div class='drive__route--via mdl-textfield mdl-js-textfield'>\
       <i class='material-icons'>&rarr;</i> <input size='28' class='mdl-textfield__input' type='text' name='via" + j + "' id='drive__route--via" + j + "'--input' value=''>\
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
  let addNewStopButton = isEditing ? "<div class='addButtonContainer'><button type='button' class='addStopButton mdl-button mdl-js-button mdl-button--icon'><i class='material-icons'>add_circle</i></button></div><br>" : "";

  // Create an HTML entry.
  var card = $("\
  <div class='mdl-cell mdl-cell--4-col'>\
    <div id='" + drive['id'] + "' class='drive " + editingClass + " mdl-card mdl-shadow--6dp'>\
      <div class='mdl-card__title mdl-card--expand'>\
        <div class='mdl-card__title-text'><div>" + title + "</div></div>\
      </div>\
      <div class='mdl-card__supporting-text'>\
        <form action='javascript:void(0);'>\
          <div class='drive__route--from mdl-textfield mdl-js-textfield'>\
            <i class='material-icons'>directions</i>\
            <input size='28' class='mdl-textfield__input' type='text' name='from' id='drive__route--from--input' value='" + from + "' " + disabledHtml + ">\
          </div>\
          " + stopsHtml + "\
          " + addNewStopButton + "\
          <div class='drive__route--to mdl-textfield mdl-js-textfield'>\
             <i class='material-icons'>&rarr;</i> <input size='28' class='mdl-textfield__input' type='text' name='to' id='drive__route--to--input' value='" + to + "' " + disabledHtml + ">\
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
            <label class='mdl-textfield__label' for='drive__author--input'>FahrerIn</label>\
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
            <textarea class='mdl-textfield__input' type='text' rows='4' " + disabledHtml + ">" + drive['description'] + "</textarea>\
          </div>\
          <br>\
        </form>\
      </div>\
      <div class='mdl-card__actions mdl-card--border'>\
      </div>\
    </div>\
  </div>\
  ");

  // Some extra work needed to make the card editable.
  if (isEditing) {
    // Set up Google places automcomplete for route fields.
    fromElement = card.find(".drive__route--from").first().find("input").first();
    setupAutocomplete(fromElement[0], function(name, id) {
      placeOrigin['name'] = name;
      placeOrigin['id'] = id;
    });
    selectFirstOnEnter(fromElement[0]);

    toElement = card.find(".drive__route--to").first().find("input").first();
    setupAutocomplete(toElement[0], function(name, id) {
      placeDestination['name'] = name;
      placeDestination['id'] = id;
    });
    selectFirstOnEnter(toElement[0]);

    // Do the same for all intermediate stops.
    card.find(".drive__route--via").each(function(index) {
      let viaElement = $(this).find("input").first();
      setupAutocomplete(viaElement[0], function(name, id) {
        if (waypoints.length > index) {
          waypoints[index] = {
            name: name,
            placeId: id
          };
        } else {
          waypoints.push({
            name: name,
            placeId: id
          });
        }
      });
      selectFirstOnEnter(viaElement[0]);
    });

    // Make the add-stop-button work.
    card.find(".addStopButton").first().click(function () {
      let newField = $("<div class='drive__route--via mdl-textfield mdl-js-textfield'>\
         <i class='material-icons'>&rarr;</i> <input size='28' class='mdl-textfield__input' type='text' name='via" + j + "' id='drive__route--via" + j + "'--input' value=''>\
      </div>");
      card.find(".drive--route__stops").first().append(newField);
      card.find(".drive__route--via").each(function(index) {
        let viaElement = $(this).find("input").first();
        selectFirstOnEnter(viaElement[0]);
        setupAutocomplete(viaElement[0], function(name, id) {
          if (waypoints.length > index) {
            waypoints[index] = {
              name: name,
              placeId: id
            };
          } else {
            waypoints.push({
              name: name,
              placeId: id
            });
          }
        });        
      });
    });
  }

  return card;
}

/** Given an array of drives, display them as cards. */
function display(drives) {
  var drivesContainer = $("#drives");
  drivesContainer.empty();
  // For each drive.
  if (drives != null) {
    for (let i = 0; i < drives.length; i++) {
      // Generate the card.
      let card = generateCard(drives[i]);
      // Add buttons...
      let actions = card.find(".mdl-card__actions").first();
      let buttons = [];

      // ... for editing mode.
      if (drives[i].editing == true) {
        let buttonOk = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>Speichern</a>");
        buttonOk.click(function() {
          let input = gatherInput(drives[i]);
          let isInputSane = checkInput(input);
          if (!isInputSane) {
            return;
          } else {
            drives[i] = inputToDrive(input);
            if (drives[i].id === "newDrive") {
              attemptAdd(drives[i]);
            } else {
              attemptEdit(drives[i]);
            }
          }
        });
        buttons.push(buttonOk);

        let buttonCancel = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>Abbrechen</a>");
        buttonCancel.click(function() {
          drives[i].editing = false;
          editingMode = false;
          if (drives[i].id === "newDrive") {
            drives.splice(i, 1);
          }
          display(drives);
        });
        buttons.push(buttonCancel);

      // ... for viewing mode.
      } else {
        // Append show on map button.
        let buttonMap = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>\
          Auf Karte zeigen\
        </a>");
        buttonMap.click(function() {
          $(".mdl-layout__content").animate({scrollTop:0}, 350, "swing");
          showOnMap(drives[i]);
        });
        buttons.push(buttonMap);

        // Append edit button.
        let buttonEdit = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>\
          Bearbeiten\
          </a>");
        buttonEdit.click(function() {
          drives[i].editing = true;
          editingMode = true;
          showOnMap(drives[i]);
          display(drives);
        });
        buttons.push(buttonEdit);

        // Append delete button.
        let buttonDelete = $("<a class='mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect'>\
          Löschen\
        </a>");
        buttonDelete.click(function() {
          attemptDelete(drives[i]);
        });
        buttons.push(buttonDelete);
      }
      buttons.forEach(function(button) {
        // Disable the buttons if editing mode is active and this is not the drive being edited.
        if (editingMode && (!drives[i].hasOwnProperty("editing") || drives[i].editing == false)) {
          button.addClass("disabled");
        }
        actions.append(button);
      });
      drivesContainer.append(card);
    }
  }
  componentHandler.upgradeDom(); // Tell MDL to update DOM and apply nice styling to all newly added elements.
}

/** Given the data input on a card's form element, transform it into a drive object. */
function inputToDrive(data) {
  let drive = createEmptyDrive();
  drive.id = data["id"];
  drive.contact = {"name":data["name"],"mail":data["mail"],"phone":data["phone"]};
  drive.dateDue = data["dateDue"];
  drive.from = data["from"];
  drive.to = data["to"];
  drive.seatsleft = data["seatsleft"];
  drive.stops = data["stops"];
  drive.description = data["description"];
  return drive;
}

/** Creates an empty drive object. */
function createEmptyDrive() {
  return {
    "id":"",
    "contact":{"name":"","mail":"","phone":""},
    "dateCreated":moment().format("YYYY-MM-DDTHH:mm:ssZ"),
    "dateDue":moment().format("YYYY-MM-DDTHH:mm:ssZ"),
    "dateModified":moment().format("YYYY-MM-DDTHH:mm:ssZ"),
    "from":{"name":"", "placeId":""},
    "to":{"name":"", "placeId":""},
    "password":"",
    "seatsleft":1,
    "description":"",
    stops:[]
  };
}

function onAddButton() {
  // Create the new drive.
  let newDrive = createEmptyDrive();
  newDrive.id = "newDrive";
  newDrive.dateDue = moment().add(1, 'day').format('YYYY-MM-DD');
  newDrive.editing = true;
  editingMode = true;
  // Set up an array of drives to display.
  drives = [];
  // Put the new drive first.
  drives.push(newDrive);
  // Add all loaded drives.
  for (let i = 0; i < loadedDrives.length; i++)
    drives.push(loadedDrives[i]);
  // Display them.
  display(drives);
}

/** Sends HTML DELETE request for the given drive. */
function attemptDelete(drive) {
  var password = prompt("Bitte geben Sie Ihr Passwort ein:", "");
  if (password != null) {
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
        console.debug(result);
        showSnackbarMsg("Fehler: " + result.responseText);
      }
    });
  }
}

/** Sends HTML POST request for the given drive. */
function attemptAdd(drive) {
  var password = prompt("Bitte geben Sie ein Passwort ein. Nur damit kann der Eintrag geändert oder gelöscht werden.", "");
  if (password != null) {
    drive['password'] = password;
    $.ajax({
      url: url,
      type: 'POST',
      data: JSON.stringify(drive),
      success: function(result) {
        console.log(result);
        showSnackbarMsg("Eintrag hinzugefügt.")
        getDrives();
      },
      error: function(result) {
        console.debug(result);
        showSnackbarMsg("Fehler: " + result.responseText);
      }
    });
  }
}

/** Sends HTML PUT request for the given drive. */
function attemptEdit(drive) {
  var password = prompt("Bitte geben Sie Ihr Passwort ein:", "");
  if (password != null) {
    drive['password'] = password;
    $.ajax({
      url: url,
      type: 'PUT',
      data: JSON.stringify(drive, null, 2),
      success: function(result) {
        console.log(result);
        showSnackbarMsg("Eintrag geändert.")
        getDrives();
      },
      error: function(result) {
        console.debug(result);
        showSnackbarMsg("Fehler: " + result.responseText);
      }
    });
  }
}

/** Given a drive, finds the corresponding card and extracts all user input data. */
function gatherInput(drive) {
  let card = $("#" + drive.id);
  let form = card.find("form").first();
  // Use the form to gather all input.
  let data = form.serializeArray().reduce(function(obj, item) {
    obj[item.name] = item.value;
    return obj;
  }, {});
  // Concanete the two departure date and departure time fields.
  let dateDueString = card.find(".drive__date--departure").first().find("input").first().val();
  let timeDueString = card.find(".drive__date--departure-time").first().find("input").first().val();
  data['dateDue'] = moment(dateDueString + "T" + timeDueString).format("YYYY-MM-DDTHH:mm:ssZ");
  // Some things could not be collected through the form.
  data['id'] = drive.id;
  data['from'] = {"name":placeOrigin["name"], "placeId":placeOrigin["id"]};
  data['to'] = {"name":placeDestination["name"], "placeId":placeDestination["id"]};
  data['stops'] = waypoints;
  // Make sure it's an integer, not a string.
  data['seatsleft'] = parseInt(data['seatsleft']);
  // Description area is not part of the form.
  data['description'] = card.find(".drive__description").first().children("textarea").first().val();
  return data;
}

/** Checks an email address for validity. */
function validEmail(mail) {
    var regex = new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");
    return (mail.match(regex) == null) ? false : true;
}

/** Checks a phone number for validity. */
function validPhone(number) {
  var regex = new RegExp("[0-9\-\(\)\s]+.");
  return (number.match(regex) == null) ? false : true;
}

/** Checks for sane input. */
function checkInput(input) {
  // Check all those that are expected to contain strings.
  var compulsory = ['name', 'from', 'to', 'description'];
  var description = ['Name des Fahrers', 'Abfahrtsort', 'Zielort', 'Beschreibung'];
  for (let i = 0; i < compulsory.length; i++) {
    if (input[compulsory[i]] === "") {
      showSnackbarMsg("Es fehlt der Eintrag für \"" + description[i] + "\".");
      return false;
    }
  }
  if (input['from']['name'] === '') {
    showSnackbarMsg("Es fehlt der Abfahrtsort!");
    return false;
  }
  if (input['to']['name'] === '') {
    showSnackbarMsg("Es fehlt der Zielort!");
    return false;
  }

  // Check if there's a number as seatsleft.
  if (isNaN(input['seatsleft'])) {
    showSnackbarMsg("Es muss mindestens 1 Platz frei sein!");
    return false;
  } else {
    if (input['seatsleft'] <= 0) {
      showSnackbarMsg("Es muss mindestens 1 Platz frei sein!");
      return false;
    }
  }

  if (input['mail'] == "" && input['phone'] == "") {
    showSnackbarMsg("Mindestens eine Kontaktmöglichkeit muss angegeben werden!");
    return false;
  }

  if (input['mail'] != "") {
    if (!validEmail(input['mail'])) {
      showSnackbarMsg("Die Emailadresse sieht nicht gültig aus!");
      return false;
    }
  }

  if (input['phone'] != "") {
    if (!validPhone(input['phone'])) {
      showSnackbarMsg("Die Telefonnummer sieht nicht gültig aus!");
      return false;
    }
  }

  return true;
}

/** Displays a given string in the snackbar. */
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
