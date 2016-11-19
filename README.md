# hitchgo
The scenario is that a group of people want to share rides. They need a way of organizing this.

The backend consists of a REST API implemented in Golang. It accepts HTTP requests (GET, PUT, POST, DELETE) and connects to a mongodb database. 
Drives are saved in this database.

The frontend is a webapp using Javascript (jQuery) to display drives on a Google Maps map. 
It communicates with the backend and lets the user read, add, modify and delete drives as they see fit.
Each drive has a password associated to it so that only the creator can modify or delete the drive.
