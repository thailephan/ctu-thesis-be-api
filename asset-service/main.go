//	Example for upload file
//
// https://github.com/gin-gonic/examples/tree/master/upload-file
package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/thailephan/lv/asset-service/routes"
	"log"
	"time"
)

func main() {
	err := godotenv.Load(".env.development.local")
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	router := gin.Default()
	// Set a lower memory limit for multipart forms (default is 32 MiB)
	//router.MaxMultipartMemory = 8 << 20 // 8 MiB
	router.Static("/", "./public")

	// Recovery middleware recovers from any panics and writes a 500 if there was one.
	router.Use(gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "OPTIONS", "PATCH", "DELETE"},
		AllowHeaders: []string{"*"},
		//AllowHeaders:     []string{"Accept", "Content-Type", "Content-Length", "Accept-Encoding", "Authorization", "X-CSRF-Token"},
		ExposeHeaders:    []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		//AllowOriginFunc: func(origin string) bool {
		//	return origin == "localhost:8080"
		//},
		MaxAge: 12 * time.Hour,
	}))

	routes.SetupRoutes(router)
	router.Run(":8080")
}
