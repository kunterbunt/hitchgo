package main

import (
  "fmt"
  "path"
  "runtime"
  "github.com/kunterbunt/hitchgo/model"
  "github.com/kunterbunt/hitchgo/controller"
)

func main() {
  // Connect to mongodb.
  mongoDb := model.NewMongoDb("testdb")
  // Find own package directory.
  _, hitchgoLocation, _, err := runtime.Caller(0)
  if !err {
    panic("No caller information")
  }
  // Instantiate server.
  server := controller.NewServer(path.Dir(hitchgoLocation))
  // Register REST controller.
  server.RegisterController("/drives", "api", controller.NewDriveController(mongoDb))
  fmt.Println("Hitch ready to go!")
  server.ServeFromDirectory("/", "view")
  server.StartListen()
}
