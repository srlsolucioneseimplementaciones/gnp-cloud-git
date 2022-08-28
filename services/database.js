const log = require('../services/logger');
const mssql = require('mssql');

var config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        trustServerCertificate: true
    }
}

mssql.on('error', (err) => {
    log.Error(err);
})

var searchMessage = (data) => {
    return new Promise((resolve, reject) => {
		
		if(data.phone.length == 12) {
			data.phone = "521" + data.phone.substr(2,10);
		}
		
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('phone', data.phone)
                .execute('SP_GET_MESSAGE_INFO')
        })
        .then(result => {
            resolve(result.recordset[0]);
        })
        .catch(err => {
            log.Error(err);
            reject(err);
        })
    })
}

var updateDisconnectedInteraction = (id, agentId) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('conversationId', id)
                .input('agentId', agentId)
                .execute('SP_UPDATE_DISCONNECTED_INTERACTION')
        })
            .then(result => {
                resolve("OK");
            })
            .catch(err => {
                reject(err);
            })
    });
}

var createOutboundConversation = (interaction) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            
            return pool.request()
                .input('phone', interaction.phone)
                .input('conversationid', interaction.conversationId)
                .input('memberId', interaction.memberId)
                .input('jwt', interaction.jwt)
                .input('agentId', interaction.agentId)
                .input('queueId', interaction.queueId)
                .input('uri', interaction.uri)
                .input('state', interaction.state)
                .input('callback', interaction.callback)
                .execute('SP_CREATE_OUTBOUND_CONVERSATION')
        })
            .then(result => {
                resolve({ 'response': 'OK' });
            })
            .catch(err => {
                reject(err);
            });
    })
}

var updateOutboundConversation = (interaction) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('id', interaction.dbid)
                .input('conversationid', interaction.conversationId)
                .input('memberId', interaction.memberId)
                .input('jwt', interaction.jwt)
                .input('uri', interaction.uri)
                .input('state', interaction.state)
                .execute('SP_UPDATE_OUTBOUND_CONVERSATION')
        })
            .then(result => {
                resolve({ 'response': 'OK' });
            })
            .catch(err => {
                reject(err);
            });
    })
}

var getMessageByConversationId = (data) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('conversationId', data)
                .execute('SP_GET_MESSAGE_BY_CONVERSATION_ID')
        })
            .then(result => {
                resolve(result.recordset[0]);
            })
            .catch(err => {
                reject(err);
            });
    });
}

var updateDisconnection = (data) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('conversationId', data)
                .execute('SP_UPDATE_DISCONNECTION')
        })
            .then(result => {
                resolve(result.recordset[0].respuesta);
            })
            .catch(err => {
                reject(err);
            });
    });
}

var getActiveConversations = () => {
	return new Promise((resolve, reject)=>{
		mssql.connect(config).then(pool =>{
			return pool.request()
				.execute('SP_GET_ACTIVE_CONVERSATIONS')
		})
		.then(result => {
			resolve(result.recordset);
		})
		.catch(err => {
			reject(err);
		});
	});
}

var disconnectOrphanInteraction = (conversationId) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('conversationid', conversationId)
                .execute('SP_DISCONNECT_ORPHAN_INTERACTION')
        })
            .then(result => {
                resolve({ 'response': 'OK' });
            })
            .catch(err => {
                reject(err);
            });
    })
}

function getUris() {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .execute('SP_GET_URIS')
        })
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                reject(err);
            });
    });
}

var searchConversationWebhook = (telefono) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('telefono', telefono)
                .execute('GET_INTERACTION_WEBHOOK')
        })
        .then(result => {
            resolve(result.recordset[0].respuesta);
        })
        .catch(err => {
            log.Error(err);
            reject(err);
        })
    })
}

var newHSM = (interaction) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('nombre', interaction.nombre)
                .input('telefono', interaction.telefono)
                .input('usuario', interaction.usuario)
				.input('template', interaction.template)
                .execute('SP_INSERT_HSM')
        })
            .then(result => {
                resolve({ 'response': 'OK' });
            })
            .catch(err => {
                reject(err);
            });
    })
}

var getHSMScript = (telefono) => {
	console.log(telefono)
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('telefono', telefono)
                .execute('SP_OBTENER_HSM')
        })
            .then(result => {
		console.log('result');
		console.log(result);
                resolve(result);
            })
            .catch(err => {
		console.log('error db');
		console.log(err);
                reject(err);
            });
    })
}

var insertEmail = (conversation) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('conversationId', conversation.conversationId)
                .input('participantId', conversation.participantId)
                .input('startTime', conversation.startTime)
                .input('endTime', conversation.endTime)
                .input('userId', conversation.userId)
                .input('queueId', conversation.queueId)
                .input('remote', conversation.remote)
                .input('subject', conversation.subject)
                .execute('SP_INSERT_EMAIL')
        })
            .then(result => {
                resolve({ 'response': result });
            })
            .catch(err => {
                reject({ 'Error': err });
            })
    });
}

var getEmails = (userId, query) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('userId', userId)
                .input('query', query)
                .execute('SP_GET_EMAILS')
        })
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                reject(err);
            })
    });
}

var getPreferredAgentEmail = (correo) => {
	return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('correo', correo)
                .execute('SP_GET_LAST_EMAIL_CONVERSATION')
        })
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                reject(err);
            })
    });
}

var getConteoEmails = (user) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('user', user)
                .execute('SP_GET_EMAIL_COUNT')
        })
            .then(result => {
                var ids = [];
                result.recordset.forEach((v, i) => {
                    ids.push(v.id);
                })

                resolve(ids);
            })
            .catch(err => {
                reject({ 'Error': err });
            })
    })
}

var getConteoEmailsFiltro = (q, field) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', q)
                .input('field', field)
                .execute('SP_GET_EMAIL_COUNT_FILTER')
        })
            .then(result => {
                var ids = [];

                result.recordset.forEach((v, i) => {
                    ids.push(v.id);
                })

                resolve(ids);
            })
            .catch(err => {

                console.log(err);

                reject({ 'Error': err });
            })
    })
}

var getEmailsAll = (query) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', query)
                .execute('SP_GET_EMAILS_ALL')
        })
            .then(result => {
                resolve(result);
            })
            .catch(err => {
                reject(err);
            })
    });
}

//////////////////////REPORTEO WHATSAPP

var getConteoHSM = (req, res) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .execute('SP_GET_CONTEO_HSM')
        })
            .then(result => {
                var ids = [];
                result.recordset.forEach((v, i) => {
                    ids.push(v.Id);
                })
       
                res.status(200).json(ids);
            })
            .catch(err => {
                reject({ 'Error': err });
                res.status(500).json(err);
            })
    })
}

var getConteoHSMFiltro = (req, res) => {
    var query = req.query;

    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', query.q)
                .input('field', query.field)
                .execute('SP_GET_CONTEO_HSM_FILTRO')
        })
            .then(result => {
                var ids = [];
                console.log(result);

                result.recordset.forEach((v, i) => {
                    ids.push(v.Id);
                })

                res.status(200).json(ids);
            })
            .catch(err => {
                reject({ 'Error': err });
                res.status(500).json(err);
            })
    })
}

var getHSM = (req, res) => {
    var query = req.body.query;
	
	console.log(query);

    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', query)
                .execute('SP_GET_HSM')
        })
            .then(result => {
				console.log(result);
                res.status(200).json(result.recordset);
            })
            .catch(err => {
                res.status(500).json(err);
            })
    });
}

var getHSMFiltro = (req, res) => {
    var query = req.body.query;
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', query)
                .execute('SP_GET_HSM_FILTRO')
        })
            .then(result => {
                res.status(200).json(result.recordset);
            })
            .catch(err => {
                res.status(500).json(err);
            })
    });
}

var getUserId = (req, res) => {
    var query = req.query.user;
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('user', query)
            .execute('SP_GET_USERID')
        })
            .then(result => {
                res.status(200).json(result)
            })
            .catch((error) => {
                res.status(500).json(error);
            })
    })
}

var getQueueId = (req, res) => {
    var query = req.query.queue;
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('queue', query)
                .execute('SP_GET_QUEUEID')
        })
            .then(result => {
                res.status(200).json(result)
            })
            .catch((error) => {
                res.status(500).json(error);
            })
    })
}

var downloadHSMReport = (ids) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', ids)
                .execute('SP_GET_HSM')
        })
            .then(result => {
                resolve(result.recordset);
            })
            .catch(err => {
                reject(err);
            })
    });
}

var getConteoMSJ = (req, res) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .execute('SP_GET_CONTEO_MSJ')
        })
            .then(result => {
                var ids = [];
                result.recordset.forEach((v, i) => {
                    ids.push(v.Id);
                })

                res.status(200).json(ids);
            })
            .catch(err => {
                reject({ 'Error': err });
                res.status(500).json(err);
            })
    })
}

var getConteoMSJFiltro = (req, res) => {
    var query = req.query;

    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', query.q)
                .input('field', query.field)
                .execute('SP_GET_CONTEO_MSJ_FILTRO')
        })
            .then(result => {
                var ids = [];
                console.log(result);

                result.recordset.forEach((v, i) => {
                    ids.push(v.Id);
                })

                res.status(200).json(ids);
            })
            .catch(err => {
                reject({ 'Error': err });
                res.status(500).json(err);
            })
    })
}

var getMSJ = (req, res) => {
    var query = req.body.query;

    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', query)
                .execute('SP_GET_MSJ')
        })
            .then(result => {
                res.status(200).json(result.recordset);
            })
            .catch(err => {
                res.status(500).json(err);
            })
    });
}

var getMSJFiltro = (req, res) => {
    var query = req.body.query;
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', query)
                .execute('SP_GET_MSJ_FILTRO')
        })
            .then(result => {
                res.status(200).json(result.recordset);
            })
            .catch(err => {
                res.status(500).json(err);
            })
    });
}

var downloadMSJReport = (ids) => {
    return new Promise((resolve, reject) => {
        mssql.connect(config).then(pool => {
            return pool.request()
                .input('query', ids)
                .execute('SP_GET_MSJ')
        })
            .then(result => {
                resolve(result.recordset);
            })
            .catch(err => {
                reject(err);
            })
    });
}


module.exports = {
  searchMessage: searchMessage,
  createOutboundConversation: createOutboundConversation,
  updateDisconnectedInteraction: updateDisconnectedInteraction,
  getMessageByConversationId: getMessageByConversationId,
  updateOutboundConversation: updateOutboundConversation,
  updateDisconnection: updateDisconnection,
  getUris: getUris,
	getActiveConversations: getActiveConversations,
	disconnectOrphanInteraction: disconnectOrphanInteraction,
	searchConversationWebhook: searchConversationWebhook,
	newHSM: newHSM,
	getHSMScript: getHSMScript,
	insertEmail: insertEmail,
  getEmails: getEmails,
	getPreferredAgentEmail: getPreferredAgentEmail,
	getConteoEmails: getConteoEmails,
  getConteoEmailsFiltro: getConteoEmailsFiltro,
  getEmailsAll: getEmailsAll,
	////////////////////////////REPORTEO WHATSAPP
	getConteoHSM: getConteoHSM,
  getHSM: getHSM,
  getConteoHSMFiltro: getConteoHSMFiltro,
  getHSMFiltro: getHSMFiltro,
  getUserId: getUserId,
  getQueueId: getQueueId,
  downloadHSMReport: downloadHSMReport,
  getConteoMSJ: getConteoMSJ,
  getConteoMSJFiltro: getConteoMSJFiltro,
  getMSJ: getMSJ,
  getMSJFiltro: getMSJFiltro,
  downloadMSJReport: downloadMSJReport
}
