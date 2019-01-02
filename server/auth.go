package main

import (
	"net/http"
	"time"
)

const timeOUT = 15
const sessionCOOKIENAME = "vdc.sid"

type session struct {
	SessionID    string
	lastActionAt time.Time
}

var currentSessions map[string]session

func authorize(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		sessioncookie, _ := r.Cookie(sessionCOOKIENAME)
		if sessioncookie == nil {
			http.Error(w, "Not logged in at all.", http.StatusUnauthorized)
			return
		}

		sessionid := sessioncookie.Value

		// Check if session exists
		currentsession := currentSessions[sessionid]
		if currentsession == (session{}) {
			http.Error(w, "Seemingly logged in, but not.", http.StatusUnauthorized)
			return
		}

		// Expire session on extra idle time
		if time.Now().Sub(currentsession.lastActionAt).Seconds() > timeOUT {

			// Expire cookie
			sessioncookie.Expires = time.Now().AddDate(-1, 0, 0)
			http.SetCookie(w, sessioncookie)

			// Remove session
			delete(currentSessions, sessionid)

			http.Error(w, "Logged out due to idleness.", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)

		// Renew session last access time
		currentsession.lastActionAt = time.Now()
	})
}

func authenticate() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessioncookie := http.Cookie{Name: sessionCOOKIENAME, Value: "crimemastergogo", Path: "/", HttpOnly: true}
		http.SetCookie(w, &sessioncookie)

		currentSessions["crimemastergogo"] = session{SessionID: "crimemastergogo", lastActionAt: time.Now()}
	})
}

func signout() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessioncookie := http.Cookie{Name: "vdc.sid", Path: "/", MaxAge: -1}
		http.SetCookie(w, &sessioncookie)
	})
}
