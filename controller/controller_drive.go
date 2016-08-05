package controller

import (
    "net/http"
    "encoding/json"
    "github.com/kunterbunt/hitchgo/model"
    "time"
)

/**
* Drive Controller.
*/
type DriveController struct {
    ControllerBase
}

func NewDriveController(model model.Model) *DriveController {
    return &DriveController{ControllerBase{model}}
}

/**
* HTTP request parameters.
*/
type httpParameters struct {
    Id, Author, Contact, From, To, Password string
    Stops []string
    SeatsLeft int
    DateCreated, DateModified time.Time
}
func (this *DriveController) parseHttpParameters(request *http.Request) (parameters httpParameters, err error) {
  // Decode JSON parameters from HTTP body.
  decoder := json.NewDecoder(request.Body)
	err = decoder.Decode(&parameters)
	return parameters, err
}

func (this *DriveController) Get(writer http.ResponseWriter, request *http.Request) {
    // Get parameter values from URL.
    values := request.URL.Query()
    // These two variables will propagate to the end.
    var jsonResult []byte
    var err error
    // Return all drives.
    if (len(values) == 0) {
        var drives []*model.Drive
        drives, err = this.model.GetDrives()
        for _, drive := range drives {
          drive.Password = ""
        }
        jsonResult, err = json.Marshal(drives)

    // Return specific drive.
    } else {
        id := values.Get("id")
        if (len(id) != 0) {
            var drive *model.Drive
            drive, err = this.model.GetDrive(id)
            drive.Password = ""
            jsonResult, err = json.Marshal(drive)
        } else {
            http.Error(writer, "Invalid request - 'id' field missing.", http.StatusBadRequest)
        }
    }
    // Finally send out the result.
    if err != nil {
        http.Error(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Header().Set("Content-Type", "application/json")
        writer.Header().Set("Access-Control-Allow-Origin", "*")
        writer.Write(jsonResult)
    }
}

func (this *DriveController) Post(writer http.ResponseWriter, request *http.Request) {
    parameters, err := this.parseHttpParameters(request)
    if err != nil {
        http.Error(writer, "Error parsing HTTP request body: " + err.Error(), http.StatusBadRequest)
        return
    }
    // Check if all needed parameters are present and sane.
    // Author provided?
    if len(parameters.Author) == 0 {
        http.Error(writer, "Invalid request: 'author' missing.", http.StatusBadRequest)
        return
    }
    // Contact provided?
    if len(parameters.Contact) == 0 {
        http.Error(writer, "Invalid request: 'contact' missing.", http.StatusBadRequest)
        return
    }
    // From provided?
    if len(parameters.From) == 0 {
        http.Error(writer, "Invalid request: 'from' missing.", http.StatusBadRequest)
        return
    }
    // To provided?
    if len(parameters.To) == 0 {
        http.Error(writer, "Invalid request: 'to' missing.", http.StatusBadRequest)
        return
    }
    // Stops provided?
    if len(parameters.Stops) == 0 {
        http.Error(writer, "Invalid request: 'stops missing.", http.StatusBadRequest)
        return
    }
    // Password provided?
    if len(parameters.Password) == 0 {
        http.Error(writer, "Invalid request: 'password missing.", http.StatusBadRequest)
        return
    }

    // DateCreated provided?
    zeroTime := time.Time{}
    if parameters.DateCreated == zeroTime {
        http.Error(writer, "Invalid request: 'datecreated' missing.", http.StatusBadRequest)
        return
    }
    // DateModified provided?
    if parameters.DateModified == zeroTime {
        http.Error(writer, "Invalid request: 'datemodified' missing.", http.StatusBadRequest)
        return
    }

    drive := model.Drive{"", parameters.Author, parameters.Contact, parameters.From, parameters.Stops, parameters.To,
                          parameters.SeatsLeft, parameters.Password, parameters.DateCreated, parameters.DateModified}

    // Send to model.
    err = this.model.AddDrive(&drive)
    if err != nil {
        http.Error(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Header().Set("Access-Control-Allow-Origin", "*")
        writer.Write([]byte("Drive successfully saved."))
    }
}

func (this *DriveController) Put(writer http.ResponseWriter, request *http.Request) {
    parameters, err := this.parseHttpParameters(request)
    if err != nil {
        http.Error(writer, "Error parsing HTTP request body: " + err.Error(), http.StatusBadRequest)
        return
    }
    // Check if Id is provided.
    if len(parameters.Id) == 0 {
        http.Error(writer, "Invalid request: 'id' missing.", http.StatusBadRequest)
        return
    }
    // Get currently saved drive from database.
    drive, err := this.model.GetDrive(parameters.Id)
    if err != nil {
        http.Error(writer, err.Error(), http.StatusInternalServerError)
        return
    }

    if drive.Password != parameters.Password {
      http.Error(writer, "Invalid password.", http.StatusBadRequest)
      return
    }

    // Update values.
    drive.Author = parameters.Author
    drive.Contact = parameters.Contact
    drive.From = parameters.From
    drive.Stops = parameters.Stops
    drive.To = parameters.To
    drive.SeatsLeft = parameters.SeatsLeft
    drive.DateCreated = parameters.DateCreated
    drive.DateModified = parameters.DateModified

    // Send to model.
    err = this.model.UpdateDrive(drive)
    if err != nil {
        http.Error(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Header().Set("Access-Control-Allow-Origin", "*")
        writer.Write([]byte("Successfully updated."))
    }
}

func (this *DriveController) Delete(writer http.ResponseWriter, request *http.Request) {
    parameters, err := this.parseHttpParameters(request)
    if err != nil {
        http.Error(writer, "Error parsing HTTP request body: " + err.Error(), http.StatusBadRequest)
        return
    }
    // Check for ID field.
    if len(parameters.Id) == 0 {
        http.Error(writer, "Invalid request: 'id' missing.", http.StatusBadRequest)
        return
    }
    // Check password.
    drive, err := this.model.GetDrive(parameters.Id)
    if err != nil {
        http.Error(writer, err.Error(), http.StatusInternalServerError)
        return
    }
    if drive.Password != parameters.Password {
      http.Error(writer, "Invalid password.", http.StatusBadRequest)
      return
    }
    // Tell model to remove drive.
    err = this.model.RemoveDrive(parameters.Id)
    if err != nil {
        http.Error(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Header().Set("Access-Control-Allow-Origin", "*")
        writer.Write([]byte("Drive successfully removed."))
    }
}
