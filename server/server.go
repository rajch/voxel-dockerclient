package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	// Verify presence of docker socket
	conn, err := net.Dial("unix", "/var/run/docker.sock")
	if err != nil {

		log.Println("***************************************************")
		log.Println("* Could not connect to docker socket.             *")
		log.Println("* Please create a new container and map it using: *")
		log.Println("* -v /var/run/docker.sock:/var/run/docker.sock    *")
		log.Println("***************************************************")

		log.Fatalln("Server exited.")
	}
	conn.Close()

	initUser()

	serverMux := http.NewServeMux()

	// Set up auth, routes /signin and /signout
	initAuth(serverMux)

	// Set up docker proxy, routes /api (authorized) and /websocket
	initDockerProxy(serverMux)

	serverMux.Handle("/", http.FileServer(http.Dir("../public")))

	// Set up a custom server object
	srv := http.Server{Addr: ":8080", Handler: serverMux}

	// Use a channel to signal server closure
	serverClosed := make(chan struct{})

	// Start a goroutine to listen for SIGTERM and SIGINT signals,
	//   and close the server if received
	go func() {
		signalReceived := make(chan os.Signal, 1)

		// Handle SIGINT
		signal.Notify(signalReceived, os.Interrupt)
		// Handle SIGTERM
		signal.Notify(signalReceived, syscall.SIGTERM)

		// Wait for signal
		<-signalReceived

		log.Println("Server shutting down...")
		if err := srv.Shutdown(context.Background()); err != nil {
			// Error from closing listeners, or context timeout:
			log.Fatalf("Error during HTTP server Shutdown: %v", err)
		}

		close(serverClosed)
	}()

	// Start listening using the server
	log.Println("Server starting...")
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatalf("The server failed with the following error:%v\n", err)
	}

	<-serverClosed

	log.Println("Server shut down.")
}
