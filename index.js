const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const reporte = path.join(__dirname + '/public/reporteCorreos.html');

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.listen(PORT, () => {
    log.Info('Escuchando en el puerto ' + PORT);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.status(200);
});

app.get('/reporte', (req, res) => {
    res.status(200).sendFile(reporte);
})
