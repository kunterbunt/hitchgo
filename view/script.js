// var url = 'http://www.slowfoodyouthh.de:8080/drives';
var url = 'http://localhost:8080/drives';
var loadedDrives = [];
var map = null;

var placeOrigin = {"name":"", "id":"", "error":true};
var placeDestination = {"name":"", "id":"", "error":true};
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
}

function expandViewportToFitPlace(map, place) {
  if (place.geometry.viewport) {
    map.fitBounds(place.geometry.viewport);
  } else {
    map.setCenter(place.geometry.location);
    map.setZoom(17);
  }
}

function setupAutocomplete(inputElement, functionToCall) {
  let autocomplete = new google.maps.places.Autocomplete(inputElement);
  autocomplete.bindTo('bounds', map);
  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      showSnackbarMsg("Ort nicht gefunden: " + place.name);
      return;
    }
    expandViewportToFitPlace(map, place);
    functionToCall(place.name, place.place_id);
    triggerSearch();
  });
}

function triggerSearch() {
  // console.log(placeOrigin["name"] + " " + placeDestination["name"]);
  route(placeOrigin, waypoints, placeDestination, travel_mode, directionsService, directionsDisplay);
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
  let addNewStopButton = isEditing ? "<div class='addButtonContainer'><button class='addStopButton mdl-button mdl-js-button mdl-button--icon'><i class='material-icons'>add_circle</i></button></div><br>" : "";

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
    });

    // Make the add-stop-button work.
    card.find(".addStopButton").first().click(function () {
      let newField = $("<div class='drive__route--via mdl-textfield mdl-js-textfield'>\
         <i class='material-icons'>&rarr;</i> <input size='28' class='mdl-textfield__input' type='text' name='via" + j + "' id='drive__route--via" + j + "'--input' value=''>\
      </div>");
      card.find(".drive--route__stops").first().append(newField);
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
      });
    });
  }

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
        actions.append(button);
      });
      drivesContainer.append(card);
    }
  }
  componentHandler.upgradeDom(); // Tell MDL to update DOM and apply nice styling to all newly added elements.
}

function inputToDrive(data) {
  return {
    "id":data["id"],
    "contact":{"name":data["name"],"mail":data["mail"],"phone":data["phone"]},
    "dateCreated":moment().format("YYYY-MM-DDTHH:mm:ssZ"),
    "dateDue":data["dateDue"],
    "dateModified":moment().format("YYYY-MM-DDTHH:mm:ssZ"),
    "from":data['from'],
    "to":data['to'],
    "password":"",
    "seatsleft":data["seatsleft"],
    stops:data['stops']
  };
}

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
        console.debug("Error: " + JSON.stringify(result, null, 4));
        showSnackbarMsg("Ein Fehler ist aufgetreten.")
      }
    });
  }
}

/** Asks for user password and sends out an HTTP PUT request. */
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
        console.debug("Error: " + JSON.stringify(result, null, 4));
        showSnackbarMsg("Ein Fehler ist aufgetreten. Haben Sie vielleicht ein falsches Passwort eingegeben?")
      }
    });
  }
}

function gatherInput(drive) {
  let card = $("#" + drive.id);
  let form = card.find("form").first();
  let data = form.serializeArray().reduce(function(obj, item) {
    obj[item.name] = item.value;
    return obj;
  }, {});
  data['dateDue'] = moment(data['dateDue']).format("YYYY-MM-DDTHH:mm:ssZ");
  data['id'] = drive.id;
  data['from'] = {"name":placeOrigin["name"], "placeId":placeOrigin["id"]};
  data['to'] = {"name":placeDestination["name"], "placeId":placeDestination["id"]};
  data['stops'] = waypoints;
  data['seatsleft'] = parseInt(data['seatsleft']);
  console.debug(data);
  return data;
}

function validEmail(mail) {
    var regex = new RegExp("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?");
    return (mail.match(regex) == null) ? false : true;
}

function validPhone(number) {
  var regex = new RegExp("[0-9\-\(\)\s]+.");
  return (number.match(regex) == null) ? false : true;
}

/** Checks for sane input. */
function checkInput(input) {
  // Check all those that are expected to contain strings.
  var compulsory = ['name', 'from', 'to'];
  var description = ['Name des Fahrers', 'Abfahrtsort', 'Zielort'];
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

  // Check if there's a number as seats left.
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
