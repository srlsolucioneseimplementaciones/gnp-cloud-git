const config = require('./config/config');
config.load();

const fs = require('fs');					   
							   
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment');
const log = require('./services/logger');
const cloud = require('./services/cloud');								 				  
const outbound = require('./services/outbound');
const jobs = require('./services/jobs');
const database = require('./services/database');								

const reporte = path.join(__dirname + '/public/reporteCorreos.html');
const whatsappHsm = path.join(__dirname + '/public/reporteWhatsappHSM.html');
const whatsappMsj = path.join(__dirname + '/public/reporteWhatsappMSJ.html');
const historialMensajes = path.join(__dirname + '/public/historialMensajes.html');

const app = express();
const PORT = 8443;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.listen(PORT, () => {
    console.log('Escuchando en el puerto ' + PORT);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.status(200);
});

app.get('/reporte', (req, res) => {
    res.status(200).sendFile(reporte);
})

app.get('/whatsapp/hsm', (req, res) => {
    res.status(200).sendFile(whatsappHsm);
})

app.get('/whatsapp/msj', (req, res) => {
    res.status(200).sendFile(whatsappMsj);
})

app.get('/whatsapp/historial', (req, res) => {
    res.status(200).sendFile(historialMensajes);
})

app.post('/api/messages/outbound', outbound.sendMessage);
app.post('/api/messages/inbound', cloud.inboundMessage);
app.post('/api/messages/outbound/create', outbound.storeOutboundConversation);
app.post('/api/messages/outbound/get', outbound.getHSM);

app.get('/api/horarios/get', (req, res) => {
    var horaActual = moment().format('HH');
    var response = false;

    if (horaActual >= Number(process.env.HORARIO_INICIO) && horaActual <= Number(process.env.HORARIO_FINAL)) {
        response = true;
    } else {
        response = false;
    }

    res.status(200).json({ respuesta: response });
});

app.get('/api/templates/get', (req, res) => {
    var data = fs.readFileSync('templates.json');
    var templates = JSON.parse(data);

    res.status(200).json(templates);
});   

 app.get('/api/configuraciones/telefonos', (req, res) => {
    res.status(200).json({ respuesta: JSON.parse(process.env.NUMEROS_WHATSAPP_YALO) });
});  

app.post('/api/cloud/get/clientid', (req, res) => {
    res.status(200).json({ 'clientId': process.env.PURECLOUD_FRONT_CLIENTID });
});   

app.get('/api/cloud/get/history', cloud.getAllHistory);

app.get('/api/cloud/get/history/images', cloud.getImagesHistory);

app.get('/api/cloud/get/history/documents', cloud.getDocumentsHistory);

app.get('/api/cloud/get/history/voice', cloud.getVoiceHistory);

app.post('/api/webhook', cloud.webhookYalo);

app.get('/api/status/health', (req, res) => {
	res.status(200).json({"status":"ok"});
})

app.post('/api/cloud/get/emails', cloud.getEmails);
app.post('/api/cloud/get/email/messages', cloud.getEmailMessages);

app.get('/api/cloud/get/email/agent', cloud.getPreferredAgentEmail);
app.get('/api/cloud/conversation', cloud.getConversations);

app.get('/api/cloud/get/correos/conteo', cloud.getConteoEmails);
app.get('/api/cloud/get/correos/conteo/filtro', cloud.getConteoEmailsFiltro);
app.post('/api/cloud/get/emails/all', cloud.getEmailsAll);

/////////////////REPORTEO WHATSAPP

app.get('/api/cloud/get/whatsapp/hsm/conteo', database.getConteoHSM);
app.get('/api/cloud/get/whatsapp/hsm/conteo/filtro', database.getConteoHSMFiltro);
app.get('/api/cloud/get/whatsapp/hsm/filtro', database.getHSMFiltro);
app.post('/api/cloud/get/whatsapp/hsm', database.getHSM);
app.get('/api/cloud/get/whatsapp/userid', database.getUserId);

app.get('/api/cloud/get/whatsapp/msj/conteo', database.getConteoMSJ);
app.get('/api/cloud/get/whatsapp/msj/conteo/filtro', database.getConteoMSJFiltro);
app.get('/api/cloud/get/whatsapp/msj/filtro', database.getMSJFiltro);
app.post('/api/cloud/get/whatsapp/msj', database.getMSJ);
app.get('/api/cloud/get/whatsapp/queueid', database.getQueueId);
app.get("/api/genesys/historial/:remote/:type", cloud.getHistorialWebchat);

app.post('/api/cloud/get/whatsapp/hsm/download', (req, res) => {
    var ids = '';
    var csv = '';

    req.body.ids.forEach((val, index) => {
        ids = ids + val + ',';
    })

    ids = ids.slice(0, -1);

    database.downloadHSMReport(ids)
        .then((response) => {
            var keys = 'Id,Fecha,Nombre,Telefono,Usuario\r\n';

            csv += keys;

            response.forEach((val, index) => {
                csv += val.Id + ',' + new moment(val.fecha).format('YYYY-MM-DD HH:mm:ss') + ',' + val.nombre + ',' + val.telefono + ',' + val.usuario + '\r\n';
            })

            fs.writeFileSync(__dirname + '/public/reporteHSM.csv', csv);

            res.status(200).json({ 'response': 'ok' });
        })
        .catch((error) => {
            res.status(500);
        })
});

app.post('/api/cloud/get/whatsapp/msj/download', (req, res) => {
    var ids = '';
    var csv = '';

    req.body.ids.forEach((val, index) => {
        ids = ids + val + ',';
    })

    ids = ids.slice(0, -1);

    database.downloadMSJReport(ids)
        .then((response) => {
            var keys = 'Id,Fecha,Telefono,ConversationId,Agente,Cola\r\n';

            csv += keys;

            response.forEach((val, index) => {
                csv += val.Id + ',' + new moment(val.fecha).format('YYYY-MM-DD HH:mm:ss') + ',' + val.telefono + ',' + val.conversationId + ',' + val.Agente + ',' + val.Cola + '\r\n';
            })

            fs.writeFileSync(__dirname + '/public/reporteMSJ.csv', csv);

            res.status(200).json({ 'response': 'ok' });
        })
        .catch((error) => {
            res.status(500);
        })
});

app.post('/api/cloud/case', (req, res) => {
    console.log("Caso creado");
    res.status(200).json({ "resultado": "prueba" });
})
	
jobs.renewNotifications();
jobs.disconnectOrphanInteractions();
///jobs.getEmailDetails();
