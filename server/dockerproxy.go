package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
)

type LogProgressWriter struct{ where string }

func (pw LogProgressWriter) Write(data []byte) (int, error) {
	// implement progress here
	log.Printf("..[%v]: wrote %d bytes: %v\n", pw.where, len(data), string(data))
	return len(data), nil
}

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
	// revWSProxy := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	// 	log.Printf("Headers: %+v\nReferrer: %v\nRemoteUrl: %v", r.Header, r.Referer(), r.RemoteAddr)
	// 	// This should be required
	// 	r.Header.Del("Origin")

	// 	d, err := net.Dial("unix", "/var/run/docker.sock")
	// 	if err != nil {
	// 		http.Error(w, "Error contacting backend server.", 500)
	// 		log.Printf("WebSocket Proxy: Error dialing docker socket: %v", err)
	// 		return
	// 	}

	// 	if tcpConn, ok := d.(*net.TCPConn); ok {
	// 		log.Println("This is a TCP connection. Setting keepalive")
	// 		tcpConn.SetKeepAlive(true)
	// 		tcpConn.SetKeepAlivePeriod(30 * time.Second)
	// 	} else {
	// 		log.Println("This is NOT a TCP connection.")
	// 	}

	// 	log.Println("--------------------")
	// 	log.Printf("Websocket Proxy: Request Url: %v\n", r.URL)

	// 	hj, ok := w.(http.Hijacker)
	// 	if !ok {
	// 		http.Error(w, "Not a hijacker?", 500)
	// 		return
	// 	}

	// 	log.Println("Websocket Proxy: Is a hijacker.")

	// 	nc, _, err := hj.Hijack()
	// 	if err != nil {
	// 		log.Printf("WebSocket Proxy: Hijack error: %v", err)
	// 		return
	// 	}

	// 	defer nc.Close()
	// 	defer d.Close()

	// 	log.Println("Websocket Proxy: Hijacked.")

	// 	err = r.Write(d)
	// 	if err != nil {
	// 		log.Printf("WebSocket Proxy: Error copying request to target: %v", err)
	// 		return
	// 	}

	// 	log.Println("Websocket Proxy: First write succeded.")

	// 	errc := make(chan error, 2)
	// 	cp := func(dst io.Writer, src io.Reader, tag string) {
	// 		logrdr := io.TeeReader(src, LogProgressWriter{where: tag})
	// 		log.Printf("Websocket Proxy: %v", tag)
	// 		_, err := io.Copy(dst, logrdr)
	// 		errc <- err
	// 	}
	// 	go cp(d, nc, "Upar")
	// 	go cp(nc, d, "Neeche")
	// 	errlag := <-errc
	// 	if errlag != nil {
	// 		log.Printf("Websocket Proxy: Error:%v\n", errlag)
	// 	} else {
	// 		log.Println("Error nahi, pan goroutine zala")
	// 	}
	// })

	dockerSockHost, _ := url.Parse("http://unix/v1.27")

	revWSProxy := httputil.NewSingleHostReverseProxy(dockerSockHost)
	(*revWSProxy).Transport = &http.Transport{
		DialContext: func(_ context.Context, _, _ string) (net.Conn, error) {
			return net.Dial("unix", "/var/run/docker.sock")
		}}

	// Hook the path /api to the docker api
	// Authorize it
	mux.Handle("/api/", authorize(http.StripPrefix("/api/", revProxy)))

	// Hook the path /websocket to the docker api websockets
	// Keeping websockets separate simplifies the proxying
	mux.Handle("/websocket/", http.StripPrefix("/websocket", revWSProxy))
}
