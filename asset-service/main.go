//	Example for upload file
//
// https://github.com/gin-gonic/examples/tree/master/upload-file
package main

import (
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/thailephan/lv/asset-service/pkg"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func main() {
	router := gin.Default()
	router.Static("/", "./public")

	// Set a lower memory limit for multipart forms (default is 32 MiB)
	//router.MaxMultipartMemory = 8 << 20 // 8 MiB

	router.POST("/upload", func(c *gin.Context) {
		// Call api for validate auth token
		print("Key", c.GetHeader("authorization"))
		channelId := c.PostForm("channelId")

		// Source
		file, err := c.FormFile("file")
		if err != nil {
			c.String(http.StatusBadRequest, "get form err: %s", err.Error())
			return
		}

		fmt.Printf("Uploaded File: %+v\n", file.Filename)
		fmt.Printf("File Size: %+v\n", file.Size)
		fmt.Printf("MIME Header: %+v\n", file.Header)

		now := time.Now()
		// fileAccessUrl is remove "public" cause we mapping public folder as base of access path
		dest := path.Join("public", "channels", channelId, strconv.Itoa(now.Year()), now.Month().String()[0:3])
		err = os.MkdirAll(dest, os.ModePerm)
		if err != nil {
			log.Println(err)
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
				"data":    nil,
			})
		} else {
			fileAccessDest := path.Join("channels", channelId, strconv.Itoa(now.Year()), now.Month().String()[0:3])
			baseFileName := path.Base(file.Filename)

			// Normalize steps: replace "  " to " ", " " to "-", lowercase, remove text accent
			doubleSpace := strings.Replace(baseFileName, "  ", " ", -1)
			spaceToHyphen := strings.Replace(doubleSpace, " ", "-", -1)
			lowerCase := strings.ToLower(spaceToHyphen)
			fileNameWithoutExt := strings.TrimSuffix(lowerCase, filepath.Ext(lowerCase))
			rand.Seed(time.Now().UnixNano())
			normalizeFileName := pkg.RemoveAccents(fileNameWithoutExt) + "-" + pkg.GetMD5Hash(strconv.Itoa(rand.Int()))[0:10] + filepath.Ext(lowerCase)

			fileAccessUrl := path.Join(fileAccessDest, normalizeFileName)
			filePath := path.Join(dest, normalizeFileName)

			if err = c.SaveUploadedFile(file, filePath); err != nil {
				c.String(http.StatusBadRequest, "upload file err: %s", err.Error())
				return
			}

			fileMetadata := struct {
				Url      string `json:"fileUrl"`
				FileName string `json:"fileName"`
				Ext      string `json:"fileExt"`
				Size     int64  `json:"fileSize"`
			}{FileName: baseFileName, Ext: filepath.Ext(lowerCase)[1:], Size: file.Size, Url: fileAccessUrl}

			data, _ := json.Marshal(&fileMetadata)
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": nil,
				"data":    string(data),
			})
		}
	})
	router.Run(":8080")
}
