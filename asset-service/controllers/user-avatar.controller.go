package controllers

import (
	"fmt"
	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
	"github.com/thailephan/lv/asset-service/pkg"
	"log"
	"math/rand"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func UserAvatarUpload(c *gin.Context) {
	// TODO: Call api for validate auth token
	println("Key ", c.GetHeader("authorization"))
	//var signinForm []byte
	//signinForm, bindError := c.GetRawData()
	//
	//if bindError != nil {
	//	log.Println("err: ", bindError.Error())
	//	c.JSON(406, gin.H{"message": "Invalid signin form", "form": signinForm})
	//	return
	//}
	//fmt.Println(string(signinForm))

	// Get string value of input
	//if data, existed := c.GetPostForm("file"); existed {
	//	fmt.Println(data)
	//} else {
	//	c.String(http.StatusBadRequest, "EMpty name")
	//}

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
	dest := path.Join("public", "avatar", "user")
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

		fileAccessDest := path.Join("avatar", "user")
		baseFileName := path.Base(file.Filename)

		// Normalize steps: replace "  " to " ", " " to "-", lowercase, remove text accent
		doubleSpace := strings.Replace(baseFileName, "  ", " ", -1)
		spaceToHyphen := strings.Replace(doubleSpace, " ", "-", -1)
		lowerCase := strings.ToLower(spaceToHyphen)
		fileNameWithoutExt := strings.TrimSuffix(lowerCase, filepath.Ext(lowerCase))
		rand.Seed(time.Now().UnixNano())
		normalizeFileName := pkg.RemoveAccents(fileNameWithoutExt) + "-" + now.Format("060402150405") + "-" + pkg.GetMD5Hash(strconv.Itoa(rand.Int()))[0:10] + filepath.Ext(lowerCase)

		fileAccessUrl := path.Join(fileAccessDest, normalizeFileName)
		filePath := path.Join(dest, normalizeFileName)

		openedFile, _ := file.Open()
		srcImage, err := imaging.Decode(openedFile)
		defer func(openedFile multipart.File) {
			err := openedFile.Close()
			if err != nil {
				c.String(http.StatusInternalServerError, "Không thể đóng file")
				return
			}
		}(openedFile)
		dstImageFill := imaging.Fill(srcImage, 256, 256, imaging.Center, imaging.Linear)

		err = imaging.Save(dstImageFill, filePath)
		if err != nil {
			log.Fatalf("failed to save image: %v", err)
		}

		//if err = c.SaveUploadedFile(file, filePath); err != nil {
		//	c.String(http.StatusBadRequest, "upload file err: %s", err.Error())
		//	return
		//}

		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": nil,
				"data":    "/" + fileAccessUrl,
			})
			return
		}

		// TODO: When Oke => Push event to kafka and server will auth update information
		// TODO: Remove field avatarUrl for user token
		// TODO: id, email

		// TODO: When Oke => Push event to kafka and server will auth update information
		// TODO: Remove field avatarUrl for user token
		// TODO: id, email

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    fileAccessUrl,
			"message": nil,
		})
	}
}
