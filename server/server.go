package main

import (
	"context"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	// Temporary
	currentSessions = make(map[string]session)

	// Verify presence of docker socket
	conn, err := net.Dial("unix", "/var/run/docker.sock")
	if err != nil {
		log.Fatalln("Could not connect to docker socket. Please map it using -v /var/run/docker.sock:/var/run/docker.sock")
	}
	conn.Close()

	socketURL, _ := url.Parse("http://unix/v1.27")

	// Set up reverse proxy for docker api, using httputl.Reverproxy
	// combined with a unix socket transport
	revProxy := httputil.NewSingleHostReverseProxy(socketURL)
	(*revProxy).Transport = &http.Transport{
		DialContext: func(_ context.Context, _, _ string) (net.Conn, error) {
			return net.Dial("unix", "/var/run/docker.sock")
		}}

	// Set up reverse proxy for docker api websockets, using code adapted from
	// https://groups.google.com/forum/#!topic/golang-nuts/KBx9pDlvFOc
	// Second post, by bradfitz. Many thanks.
	revWSProxy := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		d, err := net.Dial("unix", "/var/run/docker.sock")
		if err != nil {
			http.Error(w, "Error contacting backend server.", 500)
			log.Printf("WebSocket Proxy: Error dialing docker socket: %v", err)
			return
		}

		hj, ok := w.(http.Hijacker)
		if !ok {
			http.Error(w, "Not a hijacker?", 500)
			return
		}

		nc, _, err := hj.Hijack()
		if err != nil {
			log.Printf("WebSocket Proxy: Hijack error: %v", err)
			return
		}

		defer nc.Close()
		defer d.Close()

		err = r.Write(d)
		if err != nil {
			log.Printf("WebSocket Proxy: Error copying request to target: %v", err)
			return
		}

		errc := make(chan error, 2)
		cp := func(dst io.Writer, src io.Reader) {
			_, err := io.Copy(dst, src)
			errc <- err
		}
		go cp(d, nc)
		go cp(nc, d)
		<-errc
	})

	// Hook the patch /api to the docker api
	http.Handle("/api/", authorize(http.StripPrefix("/api/", revProxy)))

	// Hook the path /websocket to the docker api websockets
	// Keeping websockets separate simplifies the proxying
	http.Handle("/websocket/", http.StripPrefix("/websocket", revWSProxy))

	// Sign In route
	http.Handle("/signin", signin())

	// Log out
	http.Handle("/signout", signout())

	http.Handle("/", http.FileServer(http.Dir("../public")))

	// Set up a custom server object
	var srv http.Server

	// Temporary
	srv.Addr = ":8080"

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
			log.Printf("Error during HTTP server Shutdown: %v", err)
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
