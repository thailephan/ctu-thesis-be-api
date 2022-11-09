package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/thailephan/lv/asset-service/controllers"
)

func SetupRoutes(router *gin.Engine) {
	router.POST("/messages/upload-attachments", controllers.MessageAttachmentUpload)

	// TODO: Implement for these below api
	router.POST("/channels/upload-avatar", controllers.ChannelAvatarUpload)
	router.POST("/users/upload-avatar", controllers.UserAvatarUpload)
}
