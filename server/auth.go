package main

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"sync"
	"time"
)

const timeOUT = 120
const sessionCOOKIENAME = "vdc.sid"

type session struct {
	SessionID    string
	lastActionAt time.Time
}

var currentSessions map[string]session
var sessionsLock sync.RWMutex

func generateRandomString(n int) (string, error) {
	b := make([]byte, n)
	_, err := rand.Read(b)

	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func authorize(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// log.Printf("Sessions:\n%v\n", currentSessions)

		sessioncookie, _ := r.Cookie(sessionCOOKIENAME)
		if sessioncookie == nil {
			http.Error(w, "Not logged in at all.", http.StatusUnauthorized)
			return
		}

		sessionid := sessioncookie.Value

		// Check if session exists
		sessionsLock.RLock()
		currentsession := currentSessions[sessionid]
		sessionsLock.RUnlock()

		if currentsession == (session{}) {
			http.Error(w, "Seemingly logged in, but not.", http.StatusUnauthorized)
			return
		}

		// Expire session on extra idle time
		if time.Since(currentsession.lastActionAt).Seconds() > timeOUT {

			// Expire cookie
			sessioncookie.Expires = time.Now().AddDate(-1, 0, 0)
			http.SetCookie(w, sessioncookie)

			// Remove session
			sessionsLock.Lock()
			delete(currentSessions, sessionid)
			sessionsLock.Unlock()

			http.Error(w, "Logged out due to idleness.", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)

		// Renew session last access time
		currentsession.lastActionAt = time.Now()
	})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		if err := r.ParseForm(); err == nil {
			// Retrieve form data
			username := r.PostFormValue("username")
			password := r.PostFormValue("password")

			// Validate user
			//if username == "admin" && password == "Pass@word1" {
			if validateUser(username, password) {

				sessionid, _ := generateRandomString(12)

				sessioncookie := http.Cookie{Name: sessionCOOKIENAME, Value: sessionid, Path: "/", HttpOnly: true}
				http.SetCookie(w, &sessioncookie)

				sessionsLock.Lock()
				currentSessions[sessionid] = session{SessionID: sessionid, lastActionAt: time.Now()}
				sessionsLock.Unlock()

				http.ServeFile(w, r, "../public/loggedindialog.html")

				return
			}

		}
	}

	http.ServeFile(w, r, "../public/logindialog.html")
}

func handleSignUp(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		if err := r.ParseForm(); err == nil {
			// Retrieve form data
			password := r.PostFormValue("password")

			if saveUser("admin", password) {
				http.Redirect(w, r, "/signin", http.StatusSeeOther)

				return
			}
		}
	}

	http.ServeFile(w, r, "../public/signupdialog.html")
}

func signin() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isUserInit {
			handleLogin(w, r)
		} else {
			handleSignUp(w, r)
		}
	})
}

func signout() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessioncookie, _ := r.Cookie(sessionCOOKIENAME)
		if sessioncookie != nil {
			sessionid := sessioncookie.Value

			sessionsLock.Lock()
			delete(currentSessions, sessionid)
			sessionsLock.Unlock()
		}

		sessioncookie = &http.Cookie{Name: sessionCOOKIENAME, Path: "/", MaxAge: -1}
		http.SetCookie(w, sessioncookie)
	})
}

func cleanupSessions() {
	var sessionsToClean []string

	sessionsLock.Lock()

	for key, value := range currentSessions {
		if time.Since(value.lastActionAt) > (time.Second * timeOUT) {
			sessionsToClean = append(sessionsToClean, key)
		}
	}

	for _, value := range sessionsToClean {
		delete(currentSessions, value)
	}

	sessionsLock.Unlock()
}

func initAuth(mux *http.ServeMux) {
	currentSessions = make(map[string]session)

	// Sign In route
	mux.Handle("/signin", signin())

	// Log out
	mux.Handle("/signout", signout())
}
