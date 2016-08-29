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
      <td class='drives-table--author mdl-data-table__cell--non-numeric'><input size='12' type='text' name='author' value='" + drives[i]['author'] + "' disabled='disabled'></td>\
      <td class='drives-table--from mdl-data-table__cell--non-numeric'><input size='12' type='text' name='from' value='" + drives[i]['from'] + "' disabled='disabled'></td>\
      <td class='drives-table--stops mdl-data-table__cell--non-numeric'><input size='25' type='text' name='stops' value='" + drives[i]['stops'] + "' disabled='disabled'></td>\
      <td class='drives-table--to mdl-data-table__cell--non-numeric'><input size='12' type='text' name='to' value='" + drives[i]['to'] + "' disabled='disabled'></td>\
      <td class='drives-table--seatsleft'><input size='2' type='text' name='seatsleft' value='" + drives[i]['seatsleft'] + "' disabled='disabled'></td>\
      <td class='drives-table--contact mdl-data-table__cell--non-numeric'><input size='25' type='text' name='contact' value='" + drives[i]['contact'] + "' disabled='disabled'></td>\
      <td class='drives-table--dateCreated mdl-data-table__cell--non-numeric'><input size='8' type='text' name='dateCreated' value='" + new Date(drives[i]['dateCreated']).toLocaleDateString() + "' disabled='disabled'></td>\
      <td class='drives-table--dateModified mdl-data-table__cell--non-numeric'><input size='8' type='text' name='dateModified' value='" + new Date(drives[i]['dateModified']).toLocaleDateString() + "' disabled='disabled'></td>\
      <td class='drives-table--id hide'><input size='0' type='text' name='seatsleft' value='" + drives[i]['id'] + "' disabled='disabled'></td>\
      ");
    var editButton = $("<td><button class='editButton mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>mode_edit</i></button></td>");
    editButton.click(function() {
      toggleEditButton(this, i);
    });
    entry.append(editButton);
    var deleteButton = $("<td><button class='deleteButton red mdl-button mdl-js-button mdl-button--raised' type='button'><i class='material-icons'>delete</i></button></td>");
    deleteButton.click(function() {
      deleteDrive(i);
    });
    entry.append(deleteButton);
    entry.append("</tr>");
    table.append(entry);
  }
}

function getEditButton(index) {
  var row = getRow(index);
  return $(row).children("td").children(".editButton, .doneButton").first().parent();
}

function getDeleteButton(index) {
  var row = getRow(index);
  return $(row).children("td").children(".deleteButton, .cancelButton").first().parent();
}

/** Edit/Done button click events. */
function toggleEditButton(editButton, index) {
  var isCheckIcon = $(editButton).children().first().html() == '<i class="material-icons">check</i>';
  // Click on 'done' button.
  if (isCheckIcon) {
    // Disable input fields, change to edit button.
    setTextFields(index, true);
    setButton(editButton, "<i class='material-icons'>mode_edit</i>", "editButton", "doneButton");
    // Set its click action to calling this function.
    $(editButton).unbind().click(function() {
      toggleEditButton(editButton, index);
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

function onCancelButton(cancelButton, index) {  
  setButton(cancelButton, "<i class='material-icons'>delete</i>", "deleteButton", "cancelButton");
  $(cancelButton).unbind().click(function() {
    onDeleteButton(cancelButton);
  });
  toggleEditButton(getEditButton(index), index);
}

function onDeleteButton(deleteButton) {

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

/** Enable or disable the input fields on the ith row. */
function setTextFields(index, disabled) {
  var rows = $("#drives-table--body").children();
  var currentRow = rows.first();
  for (let i = 0; i < rows.length; i++) {
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

/** Returns ith row's <tr> element. */
function getRow(index) {
  return $("#drives-table--body").children().eq(index);
}

/** Gathers all drive info on ith row and returns it as an object. */
function gatherInput(index) {
  var row = getRow(index);
  var drive = {
    id: row.children(".drives-table--id").first().children().first().val(),
    author: row.children(".drives-table--author").first().children().first().val(),
    from: row.children(".drives-table--from").first().children().first().val(),
    stops: row.children(".drives-table--stops").first().children().first().val(),
    to: row.children(".drives-table--to").first().children().first().val(),
    seatsleft: row.children(".drives-table--seatsleft").first().children().first().val(),
    contact: row.children(".drives-table--contact").first().children().first().val(),
    dateCreated: row.children(".drives-table--dateCreated").first().children().first().val(),
    dateModified: row.children(".drives-table--dateModified").first().children().first().val(),
  }
  return drive;
}

/** Asks for user password and sends out an HTTP PUT request. */
function attemptEdit(editButton, index) {
  console.log("edit drive");
  var password = prompt("Bitte geben Sie Ihr Passwort ein:", "");
  if (password != null) {
    var drive = gatherInput(index);
    $.ajax({
      url: url,
      type: 'PUT',
      data: '{\
      "id":' + drive['id'] + ',\
      "author":' + drive['author'] + ',\
      "contact":' + drive['contact'] + ',\
      "from":' + drive['from'] + ',\
      "stops":' + drive['stops'] + ',\
      "to":' + drive['to'] + ',\
      "seatsleft":' + drive['seatsleft'] + ',\
      "password":"' + password + '",\
      "dateCreated":' + drive['dateCreated'] + ',\
      "dateModified":' + drive['dateModified'] + '\
      }',
      success: function(result) {
        console.log(result);
        showSnackbarMsg("Eintrag geändert.")
        toggleEditButton(editButton, index);
      },
      error: function(result) {
        console.debug("Error: " + JSON.stringify(result, null, 4));
        showSnackbarMsg("Ein Fehler ist aufgetreten. Haben Sie vielleicht ein falsches Passwort eingegeben?")
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
