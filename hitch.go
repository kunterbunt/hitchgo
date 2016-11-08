package main

import (
  "fmt"
  "path"
  "runtime"
  "github.com/kunterbunt/hitchgo/model"
  "github.com/kunterbunt/hitchgo/controller"
  // "github.com/kunterbunt/fileserver/server"
)

func main() {
  // Connect to mongodb.
  mongoDb := model.NewMongoDb("testdb")
  // Find own package directory.
  _, hitchgoLocation, _, err := runtime.Caller(0)
  if !err {
    panic("No caller information")
  }
  // Instantiate REST API server.
  restApiServer := controller.NewServer(path.Dir(hitchgoLocation))  
  restApiServer.RegisterController("/drives", "api", controller.NewDriveController(mongoDb))
  // Instantiate HTML fileserver.
  // htmlServer := server.NewServer(path.Dir(hitchgoLocation), 3000)
  // htmlServer.ServeFromDirectory("/", "view")
  // go htmlServer.ListenAndServe()

  fmt.Println("Hitch ready to go!")
  restApiServer.StartListen()
}
