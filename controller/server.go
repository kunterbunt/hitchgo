package controller

import (
    "log"
    "net/http"
    "github.com/gorilla/mux"
    // "fmt"
)

type Server struct {
    router *mux.Router
    rootDirectory string
}

func NewServer(rootDirectory string) *Server {
    var server Server
    server.router = mux.NewRouter().StrictSlash(true)
    server.rootDirectory = rootDirectory
    return &server
}

func (server Server) StartListen() {
    log.Fatal(http.ListenAndServe(":1337", server.router))
}

/**
* Bind GET/POST/PUT/DELETE requests to the provided controller's methods.
*/
func (server Server) RegisterController(route string, subdomain string, controller Controller) {
    // Restrict to subdomain.
    // host := subdomain + ".{domain:[a-z.0-9]+}"
    // host := "{subdomain:[a-z]+}.slowfoodyouthh.de"
    // server.router.Host(host).Methods("GET").Path(route).HandlerFunc(controller.Get)
    server.router.Methods("GET").Path(route).HandlerFunc(controller.Get)
    server.router.Methods("POST").Path(route).HandlerFunc(controller.Post)
    server.router.Methods("PUT").Path(route).HandlerFunc(controller.Put)
    server.router.Methods("DELETE").Path(route).HandlerFunc(controller.Delete)
    server.router.Methods("OPTIONS").Path(route).HandlerFunc(controller.Options)
}

/**
* Serve files from the provided directory when visiting the provided route.
*/
func (server Server) ServeFromDirectoryWithSubdomain(route string, subdomain string, directory string) {
  host := subdomain + ".{domain:[a-z0-9]+}"
  server.router.Host(host).PathPrefix(route).Handler(http.StripPrefix(route, http.FileServer(http.Dir(server.rootDirectory + directory))))
}

func (server Server) ServeFromDirectory(route string, directory string) {
  server.router.PathPrefix(route).Handler(http.StripPrefix(route, http.FileServer(http.Dir(server.rootDirectory + directory))))
}
