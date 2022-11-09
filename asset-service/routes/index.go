package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/thailephan/lv/asset-service/controllers"
)

func SetupRoutes(router *gin.Engine) {
	router.POST("/api/messages/upload-attachments", controllers.MessageAttachmentUpload)

	// TODO: Implement for these below api
	router.POST("/api/channels/upload-avatar", controllers.ChannelAvatarUpload)
	router.POST("/api/users/upload-avatar", controllers.UserAvatarUpload)
}
