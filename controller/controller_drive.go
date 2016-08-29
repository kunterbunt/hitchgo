package controller

import (
    "net/http"
    "encoding/json"
    "github.com/kunterbunt/hitchgo/model"
    "time"
    "log"
    "os"
)

/**
* Drive Controller.
*/
type DriveController struct {
    ControllerBase
    logger *log.Logger
    loggerErr *log.Logger
}

func NewDriveController(model model.Model) *DriveController {
    return &DriveController{ControllerBase{model}, log.New(os.Stdout, "REST: ", log.Ldate|log.Ltime|log.Lshortfile), log.New(os.Stderr, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile)}
}

func (this *DriveController) errorMsg(writer http.ResponseWriter, message string, code int) {
  http.Error(writer, message, code)
  this.loggerErr.Println(message)
}

func setHeaders(writer http.ResponseWriter) {
  writer.Header().Set("Access-Control-Allow-Origin", "*")
  writer.Header().Set("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE")
}

/**
* HTTP request parameters.
*/
type httpParameters struct {
    Id, Author, Contact, From, To, Password string
    Stops []string
    SeatsLeft int
    DateCreated, DateModified, DateDue time.Time
}
func (this *DriveController) parseHttpParameters(request *http.Request) (parameters httpParameters, err error) {
  // Decode JSON parameters from HTTP body.
  decoder := json.NewDecoder(request.Body)
	err = decoder.Decode(&parameters)
	return parameters, err
}

func (this *DriveController) CheckPassword(writer http.ResponseWriter, password string, id string) *model.Drive {
  // Get currently saved drive from database.
  drive, err := this.model.GetDrive(id)
  if err != nil {
    this.errorMsg(writer, err.Error(), http.StatusInternalServerError)
  }
  if drive.Password != password {
    this.errorMsg(writer, "Invalid password.", http.StatusBadRequest)
  }
  return drive
}

func (this *DriveController) Get(writer http.ResponseWriter, request *http.Request) {
    this.logger.Println("GET Request")
    setHeaders(writer)
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
            this.errorMsg(writer, "Invalid request - 'id' field missing.", http.StatusBadRequest)
        }
    }
    // Finally send out the result.
    if err != nil {
        this.errorMsg(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Header().Set("Content-Type", "application/json")
        writer.Write(jsonResult)
    }
}

func (this *DriveController) Post(writer http.ResponseWriter, request *http.Request) {
    this.logger.Println("POST Request")
    setHeaders(writer)
    parameters, err := this.parseHttpParameters(request)
    if err != nil {
        this.errorMsg(writer, "Error parsing HTTP request body: " + err.Error(), http.StatusBadRequest)
        return
    }
    // Check if all needed parameters are present and sane.
    // Author provided?
    if len(parameters.Author) == 0 {
        this.errorMsg(writer, "Invalid request: 'author' missing.", http.StatusBadRequest)
        return
    }
    // Contact provided?
    if len(parameters.Contact) == 0 {
        this.errorMsg(writer, "Invalid request: 'contact' missing.", http.StatusBadRequest)
        return
    }
    // From provided?
    if len(parameters.From) == 0 {
        this.errorMsg(writer, "Invalid request: 'from' missing.", http.StatusBadRequest)
        return
    }
    // To provided?
    if len(parameters.To) == 0 {
        this.errorMsg(writer, "Invalid request: 'to' missing.", http.StatusBadRequest)
        return
    }
    // Stops provided?
    if len(parameters.Stops) == 0 {
        this.errorMsg(writer, "Invalid request: 'stops missing.", http.StatusBadRequest)
        return
    }
    // Password provided?
    if len(parameters.Password) == 0 {
        this.errorMsg(writer, "Invalid request: 'password missing.", http.StatusBadRequest)
        return
    }

    // DateDue provided?
    zeroTime := time.Time{}
    if parameters.DateDue == zeroTime {
        this.errorMsg(writer, "Invalid request: 'dateDue' missing.", http.StatusBadRequest)
        return
    }

    drive := model.Drive{"", parameters.Author, parameters.Contact, parameters.From, parameters.Stops, parameters.To,
                          parameters.SeatsLeft, parameters.Password, time.Now(), time.Now(), parameters.DateDue}

    // Send to model.
    err = this.model.AddDrive(&drive)
    if err != nil {
        this.errorMsg(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Write([]byte("Drive successfully saved."))
    }
}

func (this *DriveController) Put(writer http.ResponseWriter, request *http.Request) {
    this.logger.Println("PUT Request")
    setHeaders(writer)
    parameters, err := this.parseHttpParameters(request)
    if err != nil {
        this.errorMsg(writer, "Error parsing HTTP request body: " + err.Error(), http.StatusBadRequest)
        return
    }
    // Check if Id is provided.
    if len(parameters.Id) == 0 {
        this.errorMsg(writer, "Invalid request: 'id' missing.", http.StatusBadRequest)
        return
    }
    // Author provided?
    if len(parameters.Author) == 0 {
        this.errorMsg(writer, "Invalid request: 'author' missing.", http.StatusBadRequest)
        return
    }
    // Contact provided?
    if len(parameters.Contact) == 0 {
        this.errorMsg(writer, "Invalid request: 'contact' missing.", http.StatusBadRequest)
        return
    }
    // From provided?
    if len(parameters.From) == 0 {
        this.errorMsg(writer, "Invalid request: 'from' missing.", http.StatusBadRequest)
        return
    }
    // To provided?
    if len(parameters.To) == 0 {
        this.errorMsg(writer, "Invalid request: 'to' missing.", http.StatusBadRequest)
        return
    }
    // Stops provided?
    if len(parameters.Stops) == 0 {
        this.errorMsg(writer, "Invalid request: 'stops missing.", http.StatusBadRequest)
        return
    }
    // Password provided?
    if len(parameters.Password) == 0 {
        this.errorMsg(writer, "Invalid request: 'password missing.", http.StatusBadRequest)
        return
    }
    // DateDue provided?
    zeroTime := time.Time{}
    if parameters.DateDue == zeroTime {
        this.errorMsg(writer, "Invalid request: 'dateDue' missing.", http.StatusBadRequest)
        return
    }

    drive := this.CheckPassword(writer, parameters.Password, parameters.Id)

    // Update values.
    drive.Author = parameters.Author
    drive.Contact = parameters.Contact
    drive.From = parameters.From
    drive.Stops = parameters.Stops
    drive.To = parameters.To
    drive.SeatsLeft = parameters.SeatsLeft
    drive.DateModified = time.Now()
    drive.DateDue = parameters.DateDue

    // Send to model.
    err = this.model.UpdateDrive(drive)
    if err != nil {
        this.errorMsg(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Write([]byte("Successfully updated."))
    }
}

func (this *DriveController) Delete(writer http.ResponseWriter, request *http.Request) {
    this.logger.Println("DELETE Request")
    setHeaders(writer)
    parameters, err := this.parseHttpParameters(request)
    if err != nil {
        this.errorMsg(writer, "Error parsing HTTP request body: " + err.Error(), http.StatusBadRequest)
        return
    }
    // Check for ID field.
    if len(parameters.Id) == 0 {
        this.errorMsg(writer, "Invalid request: 'id' missing.", http.StatusBadRequest)
        return
    }
    // Check password.
    drive, err := this.model.GetDrive(parameters.Id)
    if err != nil {
        this.errorMsg(writer, err.Error(), http.StatusInternalServerError)
        return
    }
    if drive.Password != parameters.Password {
      this.errorMsg(writer, "Invalid password.", http.StatusBadRequest)
      return
    }
    // Tell model to remove drive.
    err = this.model.RemoveDrive(parameters.Id)
    if err != nil {
        this.errorMsg(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Write([]byte("Drive successfully removed."))
    }
}

func (this *DriveController) Options(writer http.ResponseWriter, request *http.Request) {
    this.logger.Println("OPTIONS Request")
    setHeaders(writer)
    writer.Write([]byte("Hi there."))
}
