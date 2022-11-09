//	Example for upload file
//
// https://github.com/gin-gonic/examples/tree/master/upload-file
package main

import (
	"github.com/gin-gonic/gin"
	"github.com/thailephan/lv/asset-service/routes"
	"net/http"
)

func main() {
	router := gin.Default()
	router.Static("/", "./public")

	// Set a lower memory limit for multipart forms (default is 32 MiB)
	//router.MaxMultipartMemory = 8 << 20 // 8 MiB

	router.POST("/greeting", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"Oke": "abc",
		})
	})
	routes.SetupRoutes(router)
	router.Run(":8080")
}
