package controllers

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

func MessageAttachmentUpload(c *gin.Context) {
	// TODO: Call api for validate auth token
	print("Key", c.GetHeader("authorization"))
	// Source
	file, err := c.FormFile("file")
	if err != nil {
		c.String(http.StatusBadRequest, "get form err: %s", err.Error())
		return
	}

	fmt.Printf("Uploaded File: %+v\n", file.Filename)
	fmt.Printf("File Size: %+v\n", file.Size)
	fmt.Printf("MIME Header: %+v\n", file.Header)

	// Allow file ext is pptx, xlsx, docx, pdf, txt, png, jpeg, jpg, wav, mp3
	//var allowFileExtension []string = [];
	//fileExt := filepath.Ext(lowerCase)[1:]
	//if (allowFileExtension) {
	//
	//}

	now := time.Now()
	// fileAccessUrl is remove "public" cause we mapping public folder as base of access path
	dest := path.Join("public", strconv.Itoa(now.Year()), strings.ToLower(now.Month().String()[0:3]))
	existed, err := pkg.Exists(dest)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
			"data":    nil,
			"debug":   "verify path existed",
		})
		return
	} else {
		if !existed {
			err = os.MkdirAll(dest, os.ModePerm)
			if err != nil {
				log.Println(err)
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": err.Error(),
					"data":    nil,
					"debug":   "mkdir of dest: `" + dest + "`",
				})
				return
			}
		}

		fileAccessDest := path.Join(strconv.Itoa(now.Year()), strings.ToLower(now.Month().String()[0:3]))
		baseFileName := path.Base(file.Filename)

		// Normalize steps: replace "  " to " ", " " to "-", lowercase, remove text accent
		doubleSpace := strings.Replace(baseFileName, "  ", " ", -1)
		spaceToHyphen := strings.Replace(doubleSpace, " ", "-", -1)
		lowerCase := strings.ToLower(spaceToHyphen)
		fileNameWithoutExt := strings.TrimSuffix(lowerCase, filepath.Ext(lowerCase))
		rand.Seed(time.Now().UnixNano())
		normalizeFileName := pkg.RemoveAccents(fileNameWithoutExt) + "-" + time.Now().Format("150405") + "-" + pkg.GetMD5Hash(strconv.Itoa(rand.Int()))[0:10] + filepath.Ext(lowerCase)

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
		}{FileName: baseFileName, Ext: filepath.Ext(lowerCase)[1:], Size: file.Size, Url: "/" + fileAccessUrl}

		data, _ := json.Marshal(&fileMetadata)
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": nil,
			"data":    string(data),
		})
	}
}
