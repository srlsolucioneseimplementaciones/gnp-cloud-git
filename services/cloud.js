const platformClient = require('purecloud-platform-client-v2');
const platformChatClient = require('purecloud-guest-chat-client');
const request = require('request');
const WebSocket = require('ws');
const dbServices = require('../services/database');
const mongoServices = require('../services/mongo');
const logger = require('./logger');
const moment = require('moment');

let client = platformClient.ApiClient.instance;
let webChatApi = new platformChatClient.WebChatApi();
let notificationsApi = new platformClient.NotificationsApi();
let routingApi = new platformClient.RoutingApi();
let externalContactsApi = new platformClient.ExternalContactsApi();
let analyticsApi = new platformClient.AnalyticsApi();
let usersApi = new platformClient.UsersApi();
let cloudClientId = process.env.PURECLOUD_CLIENTID;
let cloudClientSecret = process.env.PURECLOUD_CLIENTSECRET;

var ultimoMensajeEnviadoAYalo = "";

var token;
var wrapups = [];
var users = [];
var usersReporteo = [];
var queueInfo = [];

var Notifications = () => {
    var queues = [];
    var topics = [];
    getQueues()
        .then((data) => {
            data.entities.forEach((val, indx) => {
                queues.push(val.id);
				
		queueInfo.push({id: val.id, name: val.name});
                topics.push("v2.routing.queues." + val.id + ".conversations.chats");
            });
			
            reOpenSockets();

            notificationsApi.postNotificationsChannels()
                .then((data) => {
                    var wsn = new WebSocket(data.connectUri);

                    wsn.onopen = (o) => {
                        var body = [];

                        queues.forEach((val, index) => {
                            body.push({ "id": "v2.routing.queues." + val + ".conversations.chats" });
							///body.push({ "id": "v2.routing.queues." + val + ".conversations.emails" });
                        })

                        notificationsApi.postNotificationsChannelSubscriptions(data.id, body)
                            .then((resp) => {
                               
                            })
                            .catch((err) => {
								console.log("ERROR AL ABRIR LAS NOTIFICACIONES");
                                logger.Error(err);
                            })
                    }

                    wsn.onmessage = (e) => {
                        var topic = JSON.parse(e.data);
						
						
                        if (topic.eventBody.message == "WebSocket Heartbeat") {
                            logger.Debug("Heartbeat");
                        }

                        if (topics.includes(topic.topicName)) {
                            try {
								
                                if (topic.eventBody.participants) {
                                    if (topic.eventBody.participants[0].purpose == "customer" && topic.eventBody.participants[0].state == "disconnected") {
										
                                        if (topic.eventBody.participants[0].disconnectType == "peer" || topic.eventBody.participants[0].disconnectType == "client" || topic.eventBody.participants[0].disconnectType == "timeout") {	
											var agentId = "";

                                            topic.eventBody.participants.forEach((val, index) => {
                                                if (val.purpose == "agent") {
                                                    agentId = val.user.id;
                                                }
                                            });
											
                                            dbServices.updateDisconnectedInteraction(topic.eventBody.id, agentId)
                                                .then((resp) => {
                                                    setTimeout(() => {
                                                        dbServices.getMessageByConversationId(topic.eventBody.id)
                                                            .then((response) => {
                                                                var mensaje = {
                                                                    telefono: response.telefono,
                                                                    texto: process.env.MENSAJE_DESPEDIDA,
                                                                    estado: 'desconectado'
                                                                }

                                                                disconnectInteraccionYalo(mensaje, topic.eventBody.id)
                                                                    .then((response) => {

                                                                    })
                                                                    .catch((error) => {
                                                                        logger.Error(error);
                                                                    })
                                                            })
                                                            .catch((error) => {
                                                                logger.Error(error);
                                                            })
                                                    }, 2000)
                                                })
                                                .catch((err) => {
                                                    logger.Error(err);
                                                })
                                        }
                                    }
                                }
                            } catch (err) {
								console.log("ERROR EN NOTIFICACIONES ONMESSAGE");
                                logger.Error(err);
                            }
                        }
                    }

                    wsn.onerror = (s) => {
						console.log("error notificaciones");
                        logger.Error(s);
                    }
                })
                .catch((err) => {
					console.log("error POST notificaciones");
                    logger.Error(err);
                });
        })
        .catch((err) => {
			console.log("error notificaciones GET QUEUES");
            logger.Error(err);
        })
}

var getQueues = () => {
    return new Promise((resolve, reject) => {
        
        var options = {
            'pageSize': 100,
            'sortOrder': "asc",
        }

        routingApi.getRoutingQueues(options)
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
				console.log("error GET QUEUES");
                reject(err);
            })
    })
}

var getWrapups = () => {
    return new Promise((resolve, reject) => {
        routingApi.getRoutingWrapupcodes()
            .then((response) => {
                response.entities.forEach((val, index) => {
                    wrapups.push({ id: val.id, name: val.name });

                    resolve();
                })
            })
            .catch((error) => {
				logger.Error(error);
                reject();
            })
    })
};

var getUsers = () => {
    return new Promise((resolve, reject) => {
        let opts = {
            "pageSize": 100,
            "pageNumber": 1
        };

        usersApi.getUsers(opts)
            .then((response) => {
                users = response.entities;
            })
            .catch((error) => {
                logger.Error(error);
            })
    })
}

var getUsersReporteo = () => {
    return new Promise((resolve, reject) => {
        let opts = {
            "pageSize": 100,
            "pageNumber": 1,
            "state": "active"
        };

        usersApi.getUsers(opts)
            .then((response) => {
                response.entities.forEach((entity) => {
                    usersReporteo.push({"id": entity.id, "name": entity.name});
                })
            })
            .catch((error) => {
                console.log(error);
            })
    })
}

var getQueueName = (queue) => {
    return new Promise((resolve, reject) => {
        routingApi.getRoutingQueue(queue)
            .then((response) => {
                resolve(response.name);
            })
            .catch((error) => {
				console.log("error GET QUEUE NAME");
                reject();
            })
    })
}

var newCloudSession = () => {
	console.log('abrimos una nueva sesion en cloud');
    return new Promise((resolve, reject) => {
        client.loginClientCredentialsGrant(cloudClientId, cloudClientSecret)
            .then((response) => {
                notificationsApi = new platformClient.NotificationsApi();
                routingApi = new platformClient.RoutingApi();
                conversationsApi = new platformClient.ConversationsApi();
				analyticsApi = new platformClient.AnalyticsApi();
				usersApi = new platformClient.UsersApi();
                externalContactsApi = new platformClient.ExternalContactsApi();
                Notifications();
				token = response.accessToken;
				getWrapups().then((resp) => {
					getUsers().then((resp) => {}).catch((err) => {});
					getUsersReporteo().then((response) => {console.log(response);}).catch((error) => {console.log(error);});
				}).catch((err) => {});
				console.log('Sesion creada');
                resolve();
            })
            .catch((error) => {
				console.log("error NEW CLOUD SESSION");
                logger.Error(error);
                reject();
            })
    })
};

var inboundMessage = (req, res) => {
	console.log('nuevo mensaje entrante');
	console.log(req.body);
	logger.Info(req.body);
	
    if (token == '' || token == undefined) {
        newCloudSession()
            .then((response) => {
                getMessages(req.body)
                    .then((response) => {
                        res.status(200).json({ 'response': 'ok' });
                    })
                    .catch((error) => {
                        res.status(500).json({ 'response': 'error' });
                    })
            })
            .catch((error) => {
                logger.Error(error);
            })
    } else {
        getMessages(req.body)
            .then((response) => {
                res.status(200).json({ 'response': 'ok' });
            })
            .catch((error) => {
                res.status(500).json({ 'response': 'error' });
            })
    }
}

var inboundMessageLocal = (mensaje) => {
	return new Promise ((resolve, reject) => {
		if (token == '' || token == undefined) {
			newCloudSession()
				.then((response) => {
					getMessages(mensaje)
						.then((response) => {
							resolve();
						})
						.catch((error) => {
							reject();
						})
				})
				.catch((error) => {
					logger.Error(error);
					rejet();
				})
		} else {
			getMessages(req.body)
				.then((response) => {
					resolve();
				})
				.catch((error) => {
					reject();
				})
		}		
	})
}

var getMessages = (body) => {
	console.log('obteniendo mensajes');
    return new Promise((resolve, reject) => {
        dbServices.searchMessage(body)
            .then((response) => {
				
				console.log('se obtuvieron estos mensajes');
				console.log(response);
				
                if (response) {
                    switch (response.state) {
                        case 1:
							console.log('1. Conversacion activa');
                            var data = {
                                conversationId: response.conversationId,
                                memberId: response.memberid,
                                message: body.mensaje,
                                jwt: response.jwt
                            }
							
							console.log('enviando mensaje a cloud');
							console.log(data);

                            sendMessageToCloud(data).then((response) => { resolve(response); }).catch((error) => { logger.Error(error); reject();})
                            break;
                        case 2:
							console.log('2. Conversacion agendada');
                            body.state = response.state;
                            body.dbId = response.id;
                            body.agent = response.agentId;
                            body.queue = response.queueId;
							
							console.log('Creando nueva conversacion en cloud');
							console.log(body);
							
                            createWebchatConversation(body)
                                .then((response) => {
                                    resolve();
                                })
                                .catch((error) => {
                                    logger.Error(error);
                                    reject();
                                })
                            break;
                        default:
							console.log('Default No se detecto ningun mensaje en la bd');
                            body.agent = response.agentId;
                            body.queue = response.queueId;
							
							console.log('Creando nueva conversacion en cloud');
							console.log(body);

                            createWebchatConversation(body)
                                .then((response) => {
                                    resolve(response);
                                })
                                .catch((error) => {
                                    logger.Error(error);
                                    reject();
                                })
                            break;
                    }
                } else {
                    body.queue = process.env.DEFAULT_QUEUE_ID;
                    body.telefono = "5215580141974";
                    body.agent = null;

                    createWebchatConversation(body)
                        .then((response) => {
                            resolve(response);
                        })
                        .catch((error) => {
                            logger.Error(error);
                            reject();
                        })
                }
            })
            .catch((error) => {
                logger.Error(error);
                reject();
            })
    })
}

var createWebchatConversation = (data) => {
    return new Promise((resolve, reject) => {
        getQueueName(data.queue)
            .then((response) => {
                getExternalContacts(data.phone)
                    .then((resp) => {
						
						var tel = data.phone;
						
						if(tel.length == 13) {
							tel = data.phone.substr(3,10);
							console.log('telefono con 13 digitos es ' + tel);
						}
						
						if(tel.length == 12) {
							tel = data.phone.substr(2,10);
							console.log('telefono con 12 digitos es ' + tel);
						}
						
                        var datos = {
                            "organizationId": process.env.ORGANIZATION_ID,
                            "deploymentId": process.env.DEPLOYMENT_ID,
                            "routingTarget": {
                                "targetType": "queue",
                                "targetAddress": process.env.DEFAULT_QUEUE_NAME
                            },
                            "memberInfo": {
                                "displayName": resp,
                                "phoneNumber": data.phone.replace("521", ""),
                                "avatarImageUrl": "https://es.logodownload.org/wp-content/uploads/2018/10/whatsapp-logo-11.png",
                                "customFields": {
                                    "agent": data.agent == null ? 'NA': data.agent,
                                    "queue": response,
                                    "telefono": tel///data.phone.replace("521", "")
                                }
                            }
                        }
						
						logger.Info(datos);
						
                        webChatApi.postWebchatGuestConversations(datos)
                            .then((response) => {
                                var interaction = {
                                    conversationId: response.id,
                                    jwt: response.jwt,
                                    uri: response.eventStreamUri,
                                    memberId: response.member.id,
                                    phone: data.phone,
                                    agentId: data.agent == 'NA' ? null : data.agent,
                                    queueId: data.queue,
                                    state: 1,
                                    callback: 0,
                                    dbid: data.dbId,
                                    message: data.mensaje
                                }
								
								logger.Info('Se envia el primer mensaje');
								logger.Info(interaction);

                                if (data.state == 2) {
                                    dbServices.updateOutboundConversation(interaction)
                                        .then((response) => {
                                            openSocket(interaction);
                                            resolve(response);
                                        })
                                        .catch((error) => {
                                            logger.Error(error);
                                            reject();
                                        })
                                } else {
                                    dbServices.createOutboundConversation(interaction)
                                        .then((response) => {
                                            openSocket(interaction);
                                            resolve(response);
                                        })
                                        .catch((error) => {
                                            logger.Error(error);
                                            reject();
                                        })
                                }
                            })
                            .catch((error) => {
                                logger.Error(error);
                                reject();
                            });
                    })
                    .catch((error) => {
                        logger.Error(error);
                        reject();
                    })


                })
                .catch((error) => {
                    console.log(error);
                })
    })
}

var sendMessageToCloud = (data) => {
    return new Promise((resolve, reject) => {
        platformChatClient.ApiClient.instance.setJwt(data.jwt);
        let apiInstance = new platformChatClient.WebChatApi();
		
		console.log("data");
		console.log(data);
		logger.Info(data);

        var regex = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/g;
        var validateRegex = regex.exec(data.message);

        if (validateRegex != null) {
            data.message = "Archivo adjunto";
        }
		
		var regexNumerico = /^[0-9]{15,}$/g;
		var validateRegexNumerico = regexNumerico.exec(data.message);
		
		if (validateRegexNumerico != null) {
            data.message = "Archivo adjunto";
        }

        let msg = {
            body: data.message
        };
		
		console.log(msg);

        apiInstance.postWebchatGuestConversationMemberMessages(data.conversationId, data.memberId, msg)
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

var openSocket = (interaction) => {
    var ws = new WebSocket(interaction.uri);

    ws.on('open', (e) => {
        sendMessageToCloud(interaction)
            .then((response) => {
                
            })
            .catch((error) => {
                
            })
    })

    ws.on('message', (e) => {
        let t = JSON.parse(e);
		
        var tName = t.topicName;
        tName = tName.split('.');
        tName = tName[0] + '.' + tName[1] + '.' + tName[2] + '.' + tName[4];

        if (tName == 'v2.conversations.chats.messages' && t.eventBody.bodyType == 'standard') {
			
            conversationData = t;
            var conversationId = conversationData.eventBody.conversation.id;
            dbServices.getMessageByConversationId(conversationId)
                .then((data) => {
                    var sender = conversationData.eventBody.sender.id;
                    var client = data.memberid;

                    if (t.metadata.type) {
                        if (client != sender) {
                            if (t.eventBody.body != undefined || t.eventBody.body != '') {
                                var mensaje = {
                                    texto: conversationData.eventBody.body,
                                    telefono: data.telefono,
                                    estado: 'conectado'
                                }
								
								console.log("------------OpenSocket--------------------");
								console.log("preparando mensaje");
								console.log(ultimoMensajeEnviadoAYalo);
								console.log("--------------------");
								console.log("mensaje que se va a enviar");
								console.log(mensaje.texto);
								console.log("--------------------");
								
								
									sendMessage(mensaje)
                                    .then((data) => {
										ultimoMensajeEnviadoAYalo = mensaje.texto;
										console.log("--------------------");
										console.log("MENSAJE ENVIADO OPENSOCKET");
										console.log("--------------------");
                                    })
                                    .catch((err) => {
                                        logger.Error(err);
                                    })
								
                            }
                        }
                    }
                })
                .catch((err) => {
                    logger.Error(err);
                })
        }

        if (tName.includes('v2.conversations.chats') && t.eventBody.bodyType == 'notice') {
            conversationData = t;

            var conversationId = conversationData.eventBody.conversation.id;
            dbServices.getMessageByConversationId(conversationId)
                .then((data) => {
                    var sender = conversationData.eventBody.sender.id;
                    var client = data.memberid;

                    if (t.metadata.type) {
                        if (client != sender) {
                            if (t.eventBody.body != undefined || t.eventBody.body != '') {
                                var mensaje = {};

                                if (conversationData.eventBody.body == "cerrado") {
                                    mensaje = {
                                        texto: process.env.MENSAJE_FUERA_DE_HORARIO,
                                        telefono: data.telefono,
                                        estado: 'desconectado',
                                        motivo: 'horario'
                                    }
                                }
								
								if (conversationData.eventBody.body == "feriado") {
                                    mensaje = {
                                        texto: process.env.MENSAJE_FESTIVO,
                                        telefono: data.telefono,
                                        estado: 'desconectado',
                                        motivo: 'horario'
                                    }
                                }
								
								if (conversationData.eventBody.body == "emergencia") {
                                    mensaje = {
                                        texto: process.env.MENSAJE_EMERGENCIA,
                                        telefono: data.telefono,
                                        estado: 'desconectado',
                                        motivo: 'horario'
                                    }
                                }
                                
                                sendMessage(mensaje)
                                    .then((data) => {})
                                    .catch((err) => {
                                        logger.Error(err);
                                    })
                            }
                        }
                    }
                })
                .catch((err) => {
                    logger.Error(err);
                })
        }
    })

    ws.on('error', (error) => {
		console.log("error opensocket");
        logger.Error(error);
    })
}

var sendMessage = (mensaje) => {
    return new Promise((resolve, reject) => {
        
            var options = {
                'method': 'POST',
                'url': process.env.WEBHOOK_YALO,
                'headers': {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "userId": mensaje.telefono,
                    "data": {
                        "mensaje": mensaje.texto,
                        "estado": mensaje.estado,
                        "motivo": mensaje.motivo
                    }
                })
            };
			
			request(options, function (error, response) {
					if (error) {
						console.log("ERROR EN ENVIO MENSAJE A YALO");
						logger.Error(error);
						reject();
					} else {
						ultimoMensajeEnviadoAYalo = mensaje.texto;
						resolve();
					}
				});
        
    })
}

var sendMessageWebhook = (telefono) => {
    return new Promise((resolve, reject) => {
        var options = {
                'method': 'POST',
                'url': process.env.WEBHOOK_YALO,
                'headers': {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "userId": telefono,
                    "data": {
                        "estado": "webhook"
                    }
                })
            };
            request(options, function (error, response) {
                if (error) {
                    reject();
                } else {
                    resolve();
                }
            });
    })
}

var getExternalContacts = (telefono) => {
    return new Promise((resolve, reject) => {
        let opts = {
            'pageSize': 1,
            'pageNumber': 1,
            'q': "+52" + telefono.replace("521", "")
        };

        externalContactsApi.getExternalcontactsContacts(opts)
            .then((data) => {
                resolve(data.entities[0].firstName + " " + data.entities[0].lastName);
            })
            .catch((err) => {
                resolve(telefono.replace("521", "+52"));
            });
    })
}

var disconnectInteraccionYalo = (mensaje, conversationId) => {
    return new Promise((resolve, reject) => {
        dbServices.updateDisconnection(conversationId)
            .then((response) => {
                if (response == "ok") {
                    sendMessage(mensaje);
                    resolve();
                }
            })
            .catch((error) => {
                logger.Error(error);
                reject();
            })
    })
}

var webhookYalo = (req, res) => {
	var datos = req.body;
    /*try {
		if(datos.from) {
		dbServices.searchConversationWebhook(datos.from)
			.then((response)=>{
				if(response == 0) {
					var m = {};
					
					switch (datos.type) {
						case "text":
							m = {
								phone: datos.from,
								mensaje: datos.text.body
							}
							
							break;
						case "image":
							if(datos.image.mimeType != "") {
							m = {
								phone: datos.from,
								mensaje: "**: [" + datos.id + "](" + datos.image.url + ")\n"
							}
							}

							break;
						case "document":
							if (datos.document.mimeType != "") {
								m = {
									phone: datos.from,
									mensaje: "**: [" + datos.document.caption + "](" + datos.document.url + ")\n"
								}
							}
							break;
						case "voice":
							if (datos.voice.mimeType != "") {
								m = {
									phone: datos.from,
									mensaje: "**: [" + datos.id + "](" + datos.voice.url + ")\n"
								}
							}
							
							break;
						default:
							break;
					}
					
					inboundMessageLocal(m)
						.then((response)=>{
							sendMessageWebhook(datos.from)
								.then((response)=>{
									
								})
								.catch((error)=>{
									logger.Error(error);
								});
						})
						.catch((error)=>{
							logger.Error(error);
						});
				}
			})	
		}
	
	} catch(exception) {
		logger.Error(exception);
	}*/
	
    mongoServices.InsertMessageToHistory(datos).then((response) => {
        res.status(200).json({ "response": "OK" });
    }).catch((error) => {
		logger.Error(error);
		res.status(500).json({"response": "ERROR"});
    })
}

var getAllHistory = (req, res) => {
    mongoServices.GetHistory(req.query.telefono, "all")
        .then((response) => {
            var historial = "";
            response.forEach((val, index) => {
                switch (val.type) {
                    case "text":
                        if (val.from) {
                            historial += "**" + val.from.substr(3,10) + "**: " + val.text.body + '\n';
                        }

                        if (val.to) {
                            historial += "**GNP**: " + val.text.body + '\n';
                        }
                        
                        break;
                    case "image":
                        if (val.image.mimeType == "image/jpeg") {
                            if (val.from) {
                                historial += "**" + val.from.substr(3, 10) + "**: [" + val.id + "](" + val.image.url + ')\n';
                            }

                            if (val.to) {
                                historial += "**GNP**: [" + val.image.caption + "](" + val.image.url + ")\n";
                            }
                        }

                        break;
                    case "document":
                        if (val.document.mimeType == "application/pdf") {
                            if (val.from) {
                                historial += "**" + val.from.substr(3, 10) + "**: [" + val.document.caption + "](" + val.document.url + ")\n";
                            }

                            if (val.to) {
                                historial += "**GNP**: [" + val.document.caption + "](" + val.document.url + ")\n";
                            }
                        }
                        break;
					case "voice":
                        if (val.voice.mimeType == "audio/ogg; codec=opus") {
                            if (val.from) {
                                historial += "**" + val.from.substr(3, 10) + "**: [" + val.id + "](" + val.voice.url + ")\n";
                            }

                            if (val.to) {
                                historial += "**GNP**: [" + val.id + "](" + val.voice.url + ")\n";
                            }
                        }
                        break;
                    default:
                        break;
                }
            });

            res.status(200).json({ "resultado": historial });
        })
        .catch((error) => {
            console.log(error);
        })
}

var getImagesHistory = (req, res) => {
    mongoServices.GetHistory(req.query.telefono, "images")
        .then((response) => {
            var historial = "";
            response.forEach((val, index) => {
                switch (val.type) {
                    case "image":
                        if (val.image.mimeType == "image/jpeg") {
                            if (val.from) {
                                historial += "**" + val.from.substr(3, 10) + "**: [" + val.id + "](" + val.image.url + ") *" + val.date + "*\n";
                            }

                            if (val.to) {
                                historial += "**GNP**: [" + val.image.caption + "](" + val.image.url + ") *" + val.date + "*\n";
                            }
                        }

                        break;
                    default:
                        break;
                }
            });
            
            res.status(200).json({ "resultado": historial });
        })
        .catch((error) => {
            console.log(error);
        })
}

var getDocumentsHistory = (req, res) => {
    mongoServices.GetHistory(req.query.telefono, "documents")
        .then((response) => {
            var historial = "";
            response.forEach((val, index) => {
                switch (val.type) {
                    case "document":
                        if (val.document.mimeType == "application/pdf") {
                            if (val.from) {
                                historial += "**" + val.from.substr(3, 10) + "**: [" + val.document.caption + "](" + val.document.url + ") *" + val.date + "* \n";
                            }

                            if (val.to) {
                                historial += "**GNP**: [" + val.document.caption + "](" + val.document.url + ") *" + val.date + "*\n";
                            }
                        }
                        break;
                    default:
                        break;
                }
            });

            res.status(200).json({ "resultado": historial });
        })
        .catch((error) => {
            console.log(error);
        })
}

var getVoiceHistory = (req, res) => {
    mongoServices.GetHistory(req.query.telefono, "voice")
        .then((response) => {
            var historial = "";
            response.forEach((val, index) => {
                switch (val.type) {
                    case "voice":
                        if (val.voice.mimeType == "audio/ogg; codec=opus") {
                            if (val.from) {
                                historial += "**" + val.from.substr(3, 10) + "**: [" + val.id + "](" + val.voice.url + ") *" + val.date + "* \n";
                            }

                            if (val.to) {
                                historial += "**GNP**: [" + val.id + "](" + val.voice.url + ") *" + val.date + "*\n";
                            }
                        }
                        break;
                    default:
                        break;
                }
            });

            res.status(200).json({ "resultado": historial });
        })
        .catch((error) => {
            console.log(error);
        })
}

var reOpen = (uri) => {
    var ws = new WebSocket(uri);
    ws.on('open', (data) => {
        
    })

    ws.on('message', (f) => {
        var t = JSON.parse(f);

        var tName = t.topicName;
        tName = tName.split('.');
        tName = tName[0] + '.' + tName[1] + '.' + tName[2] + '.' + tName[4];
		
        if (tName.includes('v2.conversations.chats') && t.eventBody.bodyType == 'standard') {
            conversationData = t;
			
            var conversationId = conversationData.eventBody.conversation.id;
            dbServices.getMessageByConversationId(conversationId)
                .then((data) => {
					
                    var sender = conversationData.eventBody.sender.id;
                    var client = data.memberid;

                    if (t.metadata.type) {
                        if (client != sender) {
                            if (t.eventBody.body != undefined || t.eventBody.body != '') {
								
                                var mensaje = {
                                    telefono: data.telefono,
                                    texto: conversationData.eventBody.body,
                                    estado: 'Conectado',
                                    motivo: ''
                                }
								
								console.log("------------ReOpen--------------------");
								console.log("preparando mensaje");
								console.log(ultimoMensajeEnviadoAYalo);
								console.log("--------------------");
								console.log("mensaje que se va a enviar");
								console.log(mensaje.texto);
								console.log("--------------------");
								
								console.log("evento");
								console.log(t);
								console.log("--------------------");
								
								sendMessage(mensaje)
                                    .then((data) => {
										ultimoMensajeEnviadoAYalo = mensaje.texto;
										console.log("--------------------");
										console.log("MENSAJE ENVIADO REOPEN");
										console.log("--------------------");
                                    })
                                    .catch((err) => {
										console.log(err);
                                        logger.Error(err);
                                    })	
                            }
                        }
                    }
                })
                .catch((err) => {
                    logger.Error(err);
                })
        }
    })
    ws.on('error', (err) => {
		console.log("Error reopen");
        logger.Error(err);
    });
}

var reOpenSockets = () => {
    dbServices.getUris()
        .then((resp) => {
            resp.recordsets[0].forEach((val, index) => {
                reOpen(val.uri);
            })
        })
        .catch((err) => {
            logger.Error(err);
        })
}

var checkConversationState = () => {
	dbServices.getActiveConversations()
		.then((resp) => {
			var opts = {
				id: []
			}
			
			resp.forEach((val, index)=>{
				opts.id.push(val.conversationId);
			});
			
			analyticsApi.getAnalyticsConversationsDetails(opts)
				.then((response) => {
					response.conversations.forEach((val, index) => {
						if(val.conversationEnd) {
							dbServices.disconnectOrphanInteraction(val.conversationId)
								.then((response) => {})
								.catch((error) => {logger.Error(error);})
						}
					})
				})
				.catch((error)=>{
					console.log(error);
				})
		})
		.catch((err)=>{
			logger.Error(err);
		});
}

var getEmails = (req, res) => {
    return new Promise((resolve, reject) => {
        var user = req.body.user;
		var query = req.body.query;

        dbServices.getEmails(user, query)
            .then((response) => {
                var ids = [];
				
                response.recordset.forEach((val, index) => {
                    ids.push(val.conversationId);
                })
				
                getConversationsByIds(ids)
                    .then((resp) => {
                        resp.conversations.forEach((val, index) => {
							response.recordset.forEach((conv, cInd) => {
                                if (conv.conversationId == val.conversationId) {
                                    val.remoteEmail = conv.remote;
                                }
                            });
							
                            val.participants.forEach((participant, pIndex) => {
								
								if (participant.purpose == "agent") {
                                    for (var i = 0; i < users.length; i++) {
                                        if (users[i].id == participant.userId) {
                                            participant.user = users[i].name
                                        }
                                    }
                                }
								
                                participant.sessions.forEach((session, sIndex) => {
                                    session.segments.forEach((v, i) => {
                                        if (v.segmentType == "wrapup") {
                                            for (var i = 0; i < wrapups.length; i++) {
                                                if (v.wrapUpCode == wrapups[i].id) {
                                                    v.wrapUpName = wrapups[i].name;
                                                }
                                            }
                                        }
                                    })
                                })
                            })
                        })
						
                        res.status(200).json(resp);
                    })
                    .catch((error) => {
						console.log(error);
                        res.status(500).json({ 'error': 'Error' });
                    })
            })
            .catch((error) => {
                res.status(500);
            })
    })
}

var getEmailDetails = () => {
    return new Promise((resolve, reject) => {
        var start = moment().format('YYYY-MM-DDT00:00:00.000Z');;
        var end = moment().format('YYYY-MM-DDT23:59:59.000Z');

        var options = {
            "interval": start + "/" + end,
			///"interval": "2022-06-01T00:00:00.000Z/2022-06-10T23:59:59.000Z",
            "order": "asc",
            "orderBy": "conversationStart",
            "paging": {
                "pageSize": "100",
                "pageNumber": 1
            },
            "segmentFilters": [
                {
                    "type": "or",
                    "clauses": [
                        {
                            "type": "or",
                            "predicates": [
                                {
                                    "type": "dimension",
                                    "dimension": "mediaType",
                                    "operator": "matches",
                                    "value": "email"
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        analyticsApi.postAnalyticsConversationsDetailsQuery(options)
            .then((response) => {
                if (response.totalHits) {
                    response.conversations.forEach((val, index) => {
                        val.participants.forEach((v, i) => {
                            if (v.purpose == "agent") {
                                var conversation = {
                                    conversationId: val.conversationId,
                                    userId: v.userId,
                                    participantId: v.participantId,
                                    startTime: moment(val.conversationStart).format('YYYY-MM-DD HH:mm:ss.SSS'),
                                    endTime: moment(val.conversationEnd).format('YYYY-MM-DD HH:mm:ss.SSS')
                                }
								
								 v.sessions.forEach((session, d) => {
                                    conversation.remote = session.addressOther;

                                    session.segments.forEach((segment, x) => {
                                        if (segment.segmentType == "wrapup") {
                                            conversation.subject = segment.subject == undefined ? "" : segment.subject;
                                            conversation.queueId = segment.queueId == undefined ? "" : segment.queueId;
                                        } else {
                                            conversation.subject = "";
                                            conversation.queueId = "";
                                        }
                                    })
                                })

                                dbServices.insertEmail(conversation)
                                    .then((response) => {
                                       
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                    })
                            }
                        })
                    })
                }
            })
            .catch((error) => {
                console.log(error);
            })
    })
}

var getConversationsByIds = (ids) => {
    return new Promise((resolve, reject) => {
        var opts = {
            'id': ids
        }

        analyticsApi.getAnalyticsConversationsDetails(opts)
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                reject(error);
            })
    })
}

var getEmailMessages = (req, res) => {
    conversationsApi.getConversationsEmailMessages(req.body.conversationId)
        .then((response) => {
            var textArr = [];
            response.entities.forEach((val, index) => {
                getContent(req.body.conversationId, val.id)
                    .then((resp) => {
                        textArr.push(resp);
                    })
            })

            setTimeout(() => {
                res.status(200).json(textArr);
            }, 1000);
        })
        .catch((error) => {
            console.log(error);
            res.status(500);
        })
}

var getContent = (conversationId, messageId) => {
    return new Promise((resolve, reject) => {
        conversationsApi.getConversationsEmailMessage(conversationId, messageId)
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                reject();
            })
    })
}

var getPreferredAgentEmail = (req, res) => {
	
	var correo = req.query.correo;
	
	console.log(correo);
	
	dbServices.getPreferredAgentEmail(correo)
		.then((response)=> {
			if(response.recordset.length > 0) {
				var queueName = '';
				
				for(var i = 0; i < queueInfo.length; i++) {
					if(queueInfo[i].id == response.recordset[0].queueId) {
						queueName = queueInfo[i].name;
					}
				}
				
				res.status(200).json({"queueId": queueName});
			} else {
				res.status(500).json({'response': 'error'});
			}
		})
		.catch((error)=>{
			res.status(500).json({'response': 'error'});
		});
}

var getConversations = (req, res) => {
	
	var conversationId = req.query.conversationId;
	conversationsApi.getConversation(conversationId)
		.then((response)=>{
			var participant = response.participants[0];
			
			var d = {
				'queueName': participant.queueName ? participant.queueName : 'default',
				'queueId': participant.queueId,
				'userId': participant.userId ? participant.userId : 'default'
			}
					
			res.status(200).json(d);
		})
		.catch((error)=>{
			res.status(500).json({"response": "error"});
		})
}

var getConteoEmails = (req, res) => {
    var user = req.query.user;
	
	console.log(user);
	
    dbServices.getConteoEmails(user)
        .then((response) => {
            res.status(200).json(response);
        })
        .catch((error) => {
            res.status(500).json({ 'error': 'Error' });
        })
}

var getConteoEmailsFiltro = (req, res) => {
    var query = req.query.q;
    var field = req.query.field;
    
    dbServices.getConteoEmailsFiltro(query, field)
        .then((response) => {
            res.status(200).json(response);
        })
        .catch((error) => {
            res.status(500).json({ 'error': 'Error' });
        })
}

var getEmailsAll = (req, res) => {
    return new Promise((resolve, reject) => {
        var query = req.body.query;
		
        dbServices.getEmailsAll(query)
            .then((response) => {
                var ids = [];
				
                response.recordset.forEach((val, index) => {
                    ids.push(val.conversationId);
                })
				
                getConversationsByIds(ids)
                    .then((resp) => {
                        resp.conversations.forEach((val, index) => {
							response.recordset.forEach((conv, convId) => {
								if (conv.conversationId == val.conversationId) {
                                    val.remoteEmail = conv.remote;
                                }
							})
							
                            val.participants.forEach((participant, pIndex) => {
                                if (participant.purpose == "agent") {
                                    for (var i = 0; i < users.length; i++) {
                                        if (users[i].id == participant.userId) {
                                            participant.user = users[i].name
                                        }
                                    }
                                }

                                participant.sessions.forEach((session, sIndex) => {
                                    session.segments.forEach((v, i) => {
                                        if (v.segmentType == "wrapup") {
                                            for (var i = 0; i < wrapups.length; i++) {
                                                if (v.wrapUpCode == wrapups[i].id) {
                                                    v.wrapUpName = wrapups[i].name;
                                                }
                                            }
                                        }
                                    })
                                })
                            })
                        })

                        res.status(200).json(resp);
                    })
                    .catch((error) => {
                        res.status(500).json({ 'error': 'Error' });
                    })
            })
            .catch((error) => {
                res.status(500);
            })
    })
}

var getHistorialWebchat = (req, res) => {
    var conversations = [];
    var datosSql = [];

    var resp = Promise.resolve(getChatConversations(req.params.remote));
    resp.then((response) => {
        conversations = response;

        let datos = [];
        var telefono = req.params.remote.replace("+52", "521");

        dbServices.getMSJReport(telefono)
        .then((sqlResponse) => {
            datosSql = sqlResponse.recordset;

            datosSql.forEach((dd) => {
                let t = {
                    name: users[users.findIndex((user) => user.id == dd.usuario)] != undefined ? users[users.findIndex((user) => user.id == dd.usuario)].name + " (GNP)": "-",
                    class: "agente",
                    body: dd.body,
                    timestamp: dd.timestamp
                }
                
                datos.push(t);
            })

            if(response.conversations) {
                response.conversations.forEach((conversation) => {
                    getChatMessages(conversation.conversationId).then((r) => {
                        r.forEach((dato) => {
                            datos.push(dato);
                        })
                    }).catch((err) => {
                        console.log(err);
                    })
                })
            }
        })
        .catch((error) => {
            console.log(error);
        })
   
        setTimeout(() => {
            var participants = [];

            if(conversations && conversations.conversations) {
                conversations.conversations.forEach((conv) => {
                    conv.participants.forEach((participant) => {
                        if(participant.purpose == "customer") {
                            part = {
                                "participantId": participant.participantId,
                                "participantName": participant.participantName,
                                "sessionId": participant.sessions[0].sessionId,
                                "purpose": participant.purpose
                            }
                        } else if(participant.purpose == "agent") {
                            part = {
                                "participantName": users[users.findIndex((user) => user.id == participant.userId)].name,
                                "participantId": participant.userId,
                                "sessionId": participant.sessions[0].sessionId,
                                "purpose": participant.purpose
                            }
                        }
    
                        participants.push(part);
                    })
                });
            }

            datos.forEach((dato) => {
                var d = participants.find((p) => p.sessionId == dato.sender);
                if(d) {
                    if(d.purpose == "customer") {
                        dato.name = d.participantName;
                        dato.class = "customer";
                    } else {
                        dato.name = d.participantName + " (GNP)";
                        dato.class = "agente";
                    } 
                }
            })

            datos.sort((a, b) => {
                return moment(b.timestamp) - moment(a.timestamp);
            })

            var historial = "";
            
            datos.forEach((val, index) => {
                val.timestamp = moment(val.timestamp).format("DD/MM/YYYY HH:mm:ss");

                if(req.params.type == "markdown") {
                    historial += "**" + val.name + "**: " + val.body + "  \n*" + val.timestamp + "*\n \n";
                } else if(req.params.type == "text") {
                    historial += val.name + ": " + val.body + " \r\n" + val.timestamp + "\r\n";
                } else {
                    historial += "<div class='message "+ val.class +"'><div class='first-row'><div class='name'>" + val.name + ": </div><div class='text'>" + val.body + "</div></div><div class='date'>" + val.timestamp + "</div></div>";
                }
            })
            
            res.status(200).json({"conversacion": historial});
        }, 2000)
    })
    .catch((error) => {
        console.log(error);
        res.status(500).json({"conversacion": ""});
    })
}

var getChatConversations = async (remote) => {
    return new Promise((resolve, reject) => {
        var endDate = moment().format("YYYY-MM-DDTHH:mm:ss.SSS");
        var startDate = moment(endDate).subtract(30, 'days').format("YYYY-MM-DDTHH:mm:ss.SSS");

        var query = {
            "interval": startDate + "Z/" + endDate + "Z",
            "order": "asc",
            "orderBy": "conversationStart",
            "paging": {
                "pageSize": 100,
                "pageNumber": 1
            },
            "segmentFilters": [{
                "type": "or",
                "clauses": [{
                    "type": "or",
                    "predicates": [{
                        "type": "dimension",
                        "dimension": "remote",
                        "operator": "matches",
                        "value": remote
                    }]
                }]
            }]
        };

        conversationsApi.postAnalyticsConversationsDetailsQuery(query)
            .then((response) => {
                resolve(response);
            })
            .catch((error) => {
                console.log(error);
                reject(error);
            })
    })
}

var getChatMessages = async (conversationId) => {
    return new Promise((resolve, reject) => {
        conversationsApi.getConversationsChatMessages(conversationId)
        .then((response) => {
            var entities = [];
            response.entities.forEach((entity) => {
                if(entity.bodyType == "standard") {
                    var conv = {
                        conversationId: conversationId,
                        messageId: entity.id,
                        body: entity.body,
                        timestamp: entity.timestamp,
                        sender: entity.sender.id
                    }
                    entities.push(conv);
                }
            })

            resolve(entities);
        })
        .catch((error) => {
            reject(error);
        })
    })
}

newCloudSession();

module.exports =  {
    inboundMessage: inboundMessage,
    sendMessage: sendMessage,
    newCloudSession: newCloudSession,
    webhookYalo: webhookYalo,
    getAllHistory: getAllHistory,
    getImagesHistory: getImagesHistory,
    getDocumentsHistory: getDocumentsHistory,
	getVoiceHistory: getVoiceHistory,
	checkConversationState: checkConversationState,
	getEmails: getEmails,
    getEmailMessages: getEmailMessages,
	getEmailDetails:getEmailDetails,
	getPreferredAgentEmail:getPreferredAgentEmail,
	getConversations:getConversations,
	getConteoEmails: getConteoEmails,
    getConteoEmailsFiltro: getConteoEmailsFiltro,
    getEmailsAll: getEmailsAll,
    getHistorialWebchat: getHistorialWebchat
}
