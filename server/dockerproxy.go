package main

import (
	"context"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
)

func initDockerProxy(mux *http.ServeMux) {
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
	// Authorize it
	mux.Handle("/api/", authorize(http.StripPrefix("/api/", revProxy)))

	// Hook the path /websocket to the docker api websockets
	// Keeping websockets separate simplifies the proxying
	mux.Handle("/websocket/", http.StripPrefix("/websocket", revWSProxy))
}
