package main

import (
	"io/ioutil"
	"log"
	"os"
	"path/filepath"

	"golang.org/x/crypto/bcrypt"
)

var dataDIR = "/run/secrets/"
var dataFILE = "/run/secrets/vdcpassword"

const cryptCOST = 12

var isUserInit bool
var passwordhashstring string

func initUser() {
	dataDIR = filepath.Join(".", "../data")
	dataFILE = filepath.Join(dataDIR, "vdcpassword")

	passwordhash, err := ioutil.ReadFile(dataFILE)
	if err == nil {
		isUserInit = true
		passwordhashstring = string(passwordhash)
	}
}

func validateUser(username string, password string) bool {
	if username == "admin" {
		err := bcrypt.CompareHashAndPassword([]byte(passwordhashstring), []byte(password))
		if err == nil {
			return true
		}
	}
	return false
}

func saveUser(username string, password string) bool {
	os.MkdirAll(dataDIR, os.ModePerm)

	newhash, _ := bcrypt.GenerateFromPassword([]byte(password), cryptCOST)

	err := ioutil.WriteFile(dataFILE, newhash, os.ModePerm)

	if err == nil {
		passwordhashstring = string(newhash)
		isUserInit = true
	} else {
		log.Printf("Could not write secret password. Error was: %v\n", err)
		isUserInit = false
	}

	return isUserInit
}
