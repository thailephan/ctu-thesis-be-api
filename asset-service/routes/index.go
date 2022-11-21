package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/thailephan/lv/asset-service/controllers"
)

func SetupRoutes(router *gin.Engine) {
	//router.POST("/api/upload", controllers.MessageAttachmentUpload)
	router.POST("/api/messages/upload-attachments", controllers.MessageAttachmentUpload)
	router.POST("/api/users/upload-avatar", controllers.UserAvatarUpload)
	router.POST("/api/channels/upload-avatar", controllers.ChannelAvatarUpload)
}
