package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/CyaniAgent/Asagity/core/database"
)

func main() {
	fmt.Println("Starting Asagity Core... 39!")
	log.Println("Initializing Database and Models...")
	
	database.InitDB()

	// Get port from environment or fallback to 2048
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "2048"
	}

	// Setup a basic health check / info endpoint
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Asagity Core is running! (≧▽≦)\nMode: Dual-Stack (IPv4+IPv6)\nPort: %s\n39!", port)
	})

	// Bind to [::] to support both IPv4 and IPv6
	addr := ":" + port
	log.Printf("Server is starting on dual-stack address %s (IPv4+IPv6 enabled) 💨", addr)
	
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
