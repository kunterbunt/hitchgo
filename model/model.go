package model

import (
  "time"
)

type Model interface {
    AddDrive(*Drive) error
    UpdateDrive(*Drive) error
    GetDrive(id string) (*Drive, error)
    GetDrives() ([]*Drive, error)
    RemoveDrive(id string) error
}

type Drive struct {
    Id string `json:"id" bson:"_id"`
    Author string `json:"author"`
    Contact string `json:"contact"`
    From string `json:"from"`
    Stops []string `json:"stops"`
    To string `json:"to"`
    SeatsLeft int `json:"seatsleft"`
    Password string `json:"password"`
    DateCreated time.Time `json:"dateCreated"`
    DateModified time.Time `json:"dateModified"`
}
