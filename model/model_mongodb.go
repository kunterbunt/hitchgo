package model

import (
    "labix.org/v2/mgo"
    "labix.org/v2/mgo/bson"
    "fmt"
)

const (
    COLLECTION_DRIVES = "drives"
)

/**
* Provides data access to a MongoDB.
* Implements Model interface.
*/
type MongoDb struct {
    session *mgo.Session
    databaseName string
}

func NewMongoDb(databaseName string) *MongoDb {
    fmt.Print("Connecting to mongodb... ")
    var driver MongoDb
    driver.databaseName = databaseName
    session, err := mgo.Dial("127.0.0.1")
    if err != nil {
  		panic(err)
      session.Close()
  	}
    driver.session = session
    driver.session.SetMode(mgo.Monotonic, true)
    fmt.Println("done.")
    return &driver
}

func (this *MongoDb) AddDrive(drive *Drive) error {
  drive.Id = bson.NewObjectId().Hex()
  return this.session.DB(this.databaseName).C(COLLECTION_DRIVES).Insert(&drive)
}

func (this *MongoDb) UpdateDrive(drive *Drive) error {
  query := bson.M{"_id": drive.Id}
  change := bson.M{"$set": &drive}
  return this.session.DB(this.databaseName).C(COLLECTION_DRIVES).Update(query, change)
}

func (this *MongoDb) GetDrive(id string) (drive *Drive, err error) {
  err = this.session.DB(this.databaseName).C(COLLECTION_DRIVES).Find(bson.M{"_id": id}).One(&drive)
  return drive, err
}

func (this *MongoDb) GetDrives() (drives []*Drive, err error) {
  err = this.session.DB(this.databaseName).C(COLLECTION_DRIVES).Find(nil).All(&drives)
  return drives, err
}

func (this *MongoDb) RemoveDrive(id string) error {
  return this.session.DB(this.databaseName).C(COLLECTION_DRIVES).Remove(bson.M{"_id": id})
}
