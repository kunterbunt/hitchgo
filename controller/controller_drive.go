package controller

import (
    "net/http"
    "encoding/json"
    "github.com/kunterbunt/hitchgo/model"
    "time"
    "log"
    "os"
    "errors"
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
    Id, Password string
    Stops []model.Place
    From, To model.Place
    SeatsLeft int
    Contact model.Contact
    DateCreated, DateModified, DateDue time.Time
    Description string
}
func (this *DriveController) parseHttpParameters(request *http.Request) (parameters httpParameters, err error) {
  // Decode JSON parameters from HTTP body.
  decoder := json.NewDecoder(request.Body)
	err = decoder.Decode(&parameters)
	return parameters, err
}

func (this *DriveController) CheckPassword(writer http.ResponseWriter, password string, id string) (*model.Drive, error) {
  // Get currently saved drive from database.
  drive, err := this.model.GetDrive(id)
  if err != nil {
    return nil, err
  }
  if drive.Password != password {    
    return nil, errors.New("Invalid password")
  }
  return drive, nil
}

func (this *DriveController) checkForMissingParameters(parameters httpParameters, required []string) error {
  for i := 0; i < len(required); i++ {
    switch(required[i]) {
    case "id":          if len(parameters.Id) == 0 {return errors.New("'" + required[i] + "' is missing.")}
    case "contact":     if len(parameters.Contact.Name) == 0 {return errors.New("'" + required[i] + "' is missing.")}
    case "from":        if len(parameters.From.Name) == 0 {return errors.New("'" + required[i] + "' is missing.")}
    case "to":          if len(parameters.From.Name) == 0 {return errors.New("'" + required[i] + "' is missing.")}
    case "stops":       if len(parameters.Stops) == 0 {return errors.New("'" + required[i] + "' is missing.")}
    case "password":    if len(parameters.Password) == 0 {return errors.New("'" + required[i] + "' is missing.")}
    case "description": if len(parameters.Description) == 0 {return errors.New("'" + required[i] + "' is missing.")}
    case "datedue":     if parameters.DateDue == *new(time.Time) {return errors.New("'" + required[i] + "' is missing.")}
    case "datecreated": if parameters.DateCreated == *new(time.Time) {return errors.New("'" + required[i] + "' is missing.")}
    case "datemodified":if parameters.DateModified == *new(time.Time) {return errors.New("'" + required[i] + "' is missing.")}
    default:            this.logger.Println("Unrecoginized required parameter: " + required[i])
                        return errors.New("Unrecoginized required parameter: " + required[i])
    }
  }
  return nil
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
        this.logger.Println("Results sent.")
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
    required := [...]string{"contact", "from", "to", "stops", "password", "datedue", "description"}
    err = this.checkForMissingParameters(parameters, required[:])
    if err != nil {
      this.errorMsg(writer, err.Error(), http.StatusBadRequest)
      return
    }

    drive := model.Drive{"", parameters.Contact, parameters.From, parameters.Stops, parameters.To,
                          parameters.SeatsLeft, parameters.Password, time.Now(), time.Now(), parameters.DateDue, parameters.Description}

    // Send to model.
    err = this.model.AddDrive(&drive)
    if err != nil {
        this.errorMsg(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Write([]byte("Drive successfully saved."))
        this.logger.Println("Drive successfully saved.")
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
    // Check if all needed parameters are present and sane.
    required := [...]string{"id", "contact", "from", "to", "stops", "password", "datedue", "description"}
    err = this.checkForMissingParameters(parameters, required[:])
    if err != nil {
      this.errorMsg(writer, err.Error(), http.StatusBadRequest)
      return
    }

    drive, err := this.CheckPassword(writer, parameters.Password, parameters.Id)
    if err != nil {
      this.errorMsg(writer, err.Error(), http.StatusBadRequest)
      return
    }

    // Update values.
    drive.Contact = parameters.Contact
    drive.From = parameters.From
    drive.Stops = parameters.Stops
    drive.To = parameters.To
    drive.SeatsLeft = parameters.SeatsLeft
    drive.DateModified = time.Now()
    drive.DateDue = parameters.DateDue
    drive.Description = parameters.Description

    // Send to model.
    err = this.model.UpdateDrive(drive)
    if err != nil {
        this.errorMsg(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Write([]byte("Successfully updated."))
        this.logger.Println("Successfully updated.")
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
    // Check if all needed parameters are present and sane.
    required := [...]string{"id", "password"}
    err = this.checkForMissingParameters(parameters, required[:])
    if err != nil {
      this.errorMsg(writer, err.Error(), http.StatusBadRequest)
      return
    }
    // Check password.
    this.CheckPassword(writer, parameters.Password, parameters.Id)
    // Tell model to remove drive.
    err = this.model.RemoveDrive(parameters.Id)
    if err != nil {
        this.errorMsg(writer, err.Error(), http.StatusInternalServerError)
    } else {
        writer.Write([]byte("Drive successfully removed."))
        this.logger.Println("Drive successfully removed.")
    }
}

func (this *DriveController) Options(writer http.ResponseWriter, request *http.Request) {
    this.logger.Println("OPTIONS Request")
    setHeaders(writer)
    writer.Write([]byte("Hi there."))
}
