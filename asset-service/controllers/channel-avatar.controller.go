package controllers

import (
	"encoding/json"
	"fmt"
	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
	"github.com/thailephan/lv/asset-service/pkg"
	"io"
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

func ChannelAvatarUpload(c *gin.Context) {
	/* 1: Validate token */
	var authKey = c.GetHeader("authorization")
	if authKey == "" {
		c.JSON(http.StatusUnauthorized, IResponse{
			Success: false,
			Message: "Không tìm thấy access token",
			Data:    nil,
		})
		return
	}
	fmt.Println(os.Getenv("API_SERVICE_URL"))
	req, err := http.NewRequest("POST", os.Getenv("API_SERVICE_URL")+"/auth/verifyToken", nil)
	if err != nil {
		fmt.Printf("client: could not create request: %s\n", err)
		os.Exit(1)
	}
	// add authorization header to the req
	req.Header.Add("Authorization", c.GetHeader("authorization"))
	// Send req using http Client
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("Error on response.\n[ERROR] -", err)
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"data":    nil,
			"message": "Not Auth with token",
		})
		return
	}

	var data IResponse
	resBody, _ := io.ReadAll(resp.Body)
	err = json.Unmarshal(resBody, &data)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"data":    nil,
			"message": "Cannot parse json from api",
		})
		return
	}
	fmt.Println(data, req.Header)
	if data.Success != true {
		c.JSON(resp.StatusCode, data)
		return
	}
	defer resp.Body.Close()

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

	/* 2: Get file from request and usave*/
	file, err := c.FormFile("file")
	if err != nil {
		c.String(http.StatusBadRequest, "get form err: %s", err.Error())
		return
	}

	fmt.Printf("Uploaded File: %+v\n", file.Filename)
	fmt.Printf("File Size: %+v\n", file.Size)
	fmt.Printf("MIME Header: %+v\n", file.Header)
	var fileExt = filepath.Ext(path.Base(file.Filename))[1:]
	if fileExt != "jpg" && fileExt != "jpeg" && fileExt != "png" {
		c.JSON(http.StatusBadRequest, IResponse{
			Success: false,
			Message: "Chỉ cho phép tải lên ảnh có đuôi 'jpg', 'jpeg', hoặc 'png'",
			Data:    nil,
		})
		return
	}
	// Allow file ext is pptx, xlsx, docx, pdf, txt, png, jpeg, jpg, wav, mp3
	//var allowFileExtension []string = [];
	//fileExt := filepath.Ext(lowerCase)[1:]
	//if (allowFileExtension) {
	//
	//}

	now := time.Now()
	// fileAccessUrl is remove "public" cause we mapping public folder as base of access path
	dest := path.Join("public", "avatar", "channel")
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

		fileAccessDest := path.Join("avatar", "channel")
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
				"success": false,
				"message": err.Error(),
				"data":    fileAccessUrl,
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
			"data":    "/" + fileAccessUrl,
			"message": nil,
		})
	}
}
