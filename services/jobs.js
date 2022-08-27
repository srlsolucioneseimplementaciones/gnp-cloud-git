const cron = require('node-cron');
const cloud = require('../services/cloud');
const logger = require('../services/logger');

function renewNotifications() {
    cron.schedule('59 23 * * *', function () {
        logger.Info("Reconectando a notificaciones....");
        cloud.newCloudSession();
    });
}

function disconnectOrphanInteractions () {
	cron.schedule('0 */10 * * * *', function (){
		console.log("desconectando interacciones huerfanas");
		cloud.checkConversationState();
	})
};

function getEmailDetails() {
    cron.schedule('59 * * * * *', () => {
		console.log('obteniendo detalles de email');
        cloud.getEmailDetails();
    })
}

module.exports = {
    renewNotifications: renewNotifications,
	disconnectOrphanInteractions:disconnectOrphanInteractions,
	getEmailDetails: getEmailDetails
}