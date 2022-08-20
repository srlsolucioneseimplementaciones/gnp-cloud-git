const dotenv = require('dotenv');

loadConfigs = () => {
    dotenv.config();
}

module.exports = {
    load: loadConfigs
}
