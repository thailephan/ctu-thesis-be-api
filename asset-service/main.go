//	Example for upload file
//
// https://github.com/gin-gonic/examples/tree/master/upload-file
package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/thailephan/lv/asset-service/routes"
	"time"
)

func main() {
	router := gin.Default()
	//srcImage, err := imaging.Open("dao.jpg")
	//if err != nil {
	//	log.Fatalf("failed to open image: %v", err)
	//}
	//dstImageFill := imaging.Fill(srcImage, 256, 256, imaging.Center, imaging.Linear)
	//
	//err = imaging.Save(dstImageFill, "dao-fill.jpg")
	//if err != nil {
	//	log.Fatalf("failed to save image: %v", err)
	//}

	// Crop the original image to 300x300px size using the center anchor.

	//baseSize := int(math.Min(float64(srcImage.Bounds().Size().X), float64(srcImage.Bounds().Size().Y)))
	//srcImage = imaging.CropAnchor(srcImage, baseSize, baseSize, imaging.Center)
	//srcImage = imaging.Fit(srcImage, 256, 256, imaging.Lanczos)
	//
	//err = imaging.Save(srcImage, "dao-crop-fit.jpg")
	//if err != nil {
	//	log.Fatalf("failed to save image: %v", err)
	//}

	//buffer, err := bimg.Read("dao.jpg")
	//if err != nil {
	//	fmt.Fprintln(os.Stderr, err)
	//}
	//
	//newImage, err := bimg.NewImage(buffer).Resize(80, 200)
	//if err != nil {
	//	fmt.Fprintln(os.Stderr, err)
	//}
	//
	//size, err := bimg.NewImage(newImage).Size()
	//if size.Width == 800 && size.Height == 600 {
	//	fmt.Println("The image size is valid")
	//}
	//
	//bimg.Write("new.jpg", newImage)

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
