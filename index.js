const fs = require('fs');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const reporte = path.join(__dirname + '/public/reporteCorreos.html');
const whatsappHsm = path.join(__dirname + '/public/reporteWhatsappHSM.html');
const whatsappMsj = path.join(__dirname + '/public/reporteWhatsappMSJ.html');

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
