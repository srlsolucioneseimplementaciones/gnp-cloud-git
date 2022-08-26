app.service('ApiService', function ($http) {
    this.getUrlVars = (n) =>  {
        var vars = "";
        var parts = window.location.href.replace(/[#&]+([^=&]+)=([^&]*)/gi,
            function (m, key, value) {
                if (key === n) {
                    vars = value;
                }
            });

        return vars;
    }

    this.sendMessage = (data) =>  {
        return $http.post('https://e5c3-54-208-78-74.ngrok.io/api/messages/outbound', data, { timeout: 20000 })
			.then(function (response) {
				return response;
			})
			.catch(function (error) {
                return error;
            })
    }

    this.obtenerTelefonos = () => {
        return $http.get('https://e5c3-54-208-78-74.ngrok.io/api/configuraciones/telefonos')
            .then((response) => {
                return response.data;
            })
            .catch((error) => {
                return error;
            })
    }

    this.cloudLogin = (clientId) =>  {
        var queryStringData = {
            response_type: "token",
            client_id: clientId,
            redirect_uri: "https://ma2tskinym.us-east-1.awsapprunner.com/whatsapp/msj"
        }

        window.location.replace("https://login.mypurecloud.com/oauth/authorize?" + jQuery.param(queryStringData));
    }

    this.getClientId = (data) =>  {
        return $http.post('https://e5c3-54-208-78-74.ngrok.io/api/cloud/get/clientid').then(function (response) {
            return response.data;
        })
            .catch((error) => {
                console.log(error);
                return null;
            })
    }

    this.obtenerMSJ = (q) => {
        return $http.post('https://e5c3-54-208-78-74.ngrok.io/api/cloud/get/whatsapp/msj', { query: q}).then((response) => {
            return response.data;
        })
            .catch((error) => {
                return null;
            })
    }

    this.obtenerMSJFiltro = (q) => {
        return $http.post('https://e5c3-54-208-78-74.ngrok.io/api/cloud/get/whatsapp/msj/filtro', { query: q }).then((response) => {
            return response.data;
        })
        .catch((error) => {
            return null;
        })
    }

    this.obtenerConteoMSJ = (userId) => {
        return $http.get('https://e5c3-54-208-78-74.ngrok.io/api/cloud/get/whatsapp/msj/conteo').then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log(error);
            return null;
        })
    }

    this.obtenerConteoMSJFilter = (q, field) => {
        return $http.get('https://e5c3-54-208-78-74.ngrok.io/api/cloud/get/whatsapp/msj/conteo/filtro?q=' + q + '&field=' + field).then((response) => {
            return response;
        })
        .catch((error) => {
            console.log(error);
        })
    }

    this.obtenerUserId = (user) => {
        return $http.get('https://e5c3-54-208-78-74.ngrok.io/api/cloud/get/whatsapp/userid?user=' + user).then((response) => {
            return response.data;
        })
            .catch((error) => {
                console.log(error);
            })
    }


    this.obtenerQueueId = (queue) => {
        return $http.get('https://e5c3-54-208-78-74.ngrok.io/api/cloud/get/whatsapp/queueId?queue=' + queue).then((response) => {
            return response.data;
        })
            .catch((error) => {
                console.log(error);
            })
    }

    this.downloadReportMSJ = (ids) => {
        return $http.post('https://e5c3-54-208-78-74.ngrok.io/api/cloud/get/whatsapp/msj/download', { "ids": ids }).then((response) => {
            return response.data;
        })
            .catch((error) => {
                console.log(error);
            })
    }
})
