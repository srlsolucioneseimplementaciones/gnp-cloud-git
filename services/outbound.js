const request = require('request');
const dbServices = require('../services/database');
const logger = require('./logger');

var sendMessage = (req, res) => {
  return new Promise((resolve, reject) => {
    var params = {};
    var phone = "+52" + req.body.destino.substr(3, 10);

    req.body.variables.forEach((val, index) => {
      params[val.name] = val.valor;
    })

    var options = {
      'method': 'POST',
      'url': process.env.HSM_URL,
      'headers': {
        'Content-Type': 'application/json',
        'Authorization': process.env.TOKEN_HSM_YALO
      },
      body: JSON.stringify({
        "type": req.body.nombre,
          "users": [{
            "phone": phone,
            "params": params
          }]
        })
      };
		
      request(options, function (error, response) {
        if (error) {
          res.status(500).json({ response: "Error" });
				  logger.Error(error);
          reject();
        } else {
          var datos = {
            'phone': req.body.destino,
            'conversationid': null,
            'memberId': null,
            'jwt': null,
            'agentId': req.body.cloudUser,
            'queueId': req.body.cola.id,
            'uri': null,
            'state': 2,
            'callback': req.body.callback
        }

        dbServices.createOutboundConversation(datos)
          .then((response) => {
						
					  var hsm = {
						  nombre: req.body.nombre,
							telefono: req.body.destino,
							usuario: req.body.cloudUser,
							template:req.body.template
						}
						
						logger.Info(hsm);
						
						dbServices.newHSM(hsm)
							.then((response)=>{
								res.status(200).json({ response: "OK" });
								resolve();
							})
							.catch((error)=>{
								res.status(500).json({ response: "Error" });
							})
            })
            .catch((error) => {
              res.status(500).json({ response: "Error" });
            })
          }
        });
    })
}

var storeOutboundConversation = (req, res) => {
    var datos = {
        'phone': req.body.destino,
        'conversationid': null,
        'memberId': null,
        'jwt': null,
        'agentId': null,
        'queueId': req.body.cola,
        'uri': null,
        'state': 2,
        'callback': req.body.callback
    }

    dbServices.createOutboundConversation(datos)
        .then((response) => {
            res.status(200).json({ response: "OK" });
        })
        .catch((error) => {
            res.status(500).json({ response: "Error" });
        })
}

var getHSM = (req, res) => {
	var telefono = req.body.telefono;
	return new Promise((resolve, reject)=>{
		dbServices.getHSMScript(telefono)
		.then((response)=>{
			console.log('respuesta de la bd');
			console.log(response);
			
			var mensaje = "";
			
			var resp = response.recordsets[0];
			
			resp.forEach((value, index)=>{
				mensaje = mensaje + value.template + '\r\n';
			});
			
			mensaje = mensaje.replaceAll('jump_remove','\r\n');
			
			console.log('mensaje listo para irse');
			console.log('mensaje');
			
			res.status(200).json({'mensaje':mensaje});
		})
		.catch((error)=>{
			console.log('error en regresar');
			console.log(error);
			res.status(500);
		})
	});
}

module.exports = {
  sendMessage: sendMessage,
  storeOutboundConversation: storeOutboundConversation,
	getHSM: getHSM
}
