package main

import (
	"fmt"
	"log"

	"github.com/CyaniAgent/Asagity/core/database"
)

func main() {
	fmt.Println("Starting Asagity Core... 39!")
	log.Println("Initializing Database and Models...")
	
	database.InitDB()

	fmt.Println("Initialization complete! Ready to start the server! (≧▽≦)")
}
