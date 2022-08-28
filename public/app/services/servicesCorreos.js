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
        return $http.post('https://ma2tskinym.us-east-1.awsapprunner.com/api/messages/outbound', data, { timeout: 20000 })
			.then(function (response) {
				return response;
			})
			.catch(function (error) {
                return error;
            })
    }

    this.obtenerTelefonos = () => {
        return $http.get('https://ma2tskinym.us-east-1.awsapprunner.com/api/configuraciones/telefonos')
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
            redirect_uri: "https://ma2tskinym.us-east-1.awsapprunner.com/reporte"
        }

        window.location.replace("https://login.mypurecloud.com/oauth/authorize?" + jQuery.param(queryStringData));
    }

    this.getClientId = (data) =>  {
        return $http.post('https://ma2tskinym.us-east-1.awsapprunner.com/api/cloud/get/clientid').then(function (response) {
            return response.data;
        })
            .catch((error) => {
                console.log(error);
                return null;
            })
    }

    this.obtenerEmails = (userId, q) => {
        return $http.post('https://ma2tskinym.us-east-1.awsapprunner.com/api/cloud/get/emails', { user: userId, query: q}).then((response) => {
            return response.data.conversations;
        })
            .catch((error) => {
                return null;
            })
    }

    this.obtenerEmailsAll = (q) => {
        return $http.post('https://ma2tskinym.us-east-1.awsapprunner.com/api/cloud/get/emails/all', { query: q }).then((response) => {
            return response.data.conversations;
        })
        .catch((error) => {
            return null;
        })
    }

    this.obtenerConteoEmails = (userId) => {
        return $http.get('https://ma2tskinym.us-east-1.awsapprunner.com/api/cloud/get/correos/conteo?user=' + userId).then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.log(error);
            return null;
        })
    }

    this.obtenerConteoEmailsFilter = (q, field) => {
        return $http.get('https://ma2tskinym.us-east-1.awsapprunner.com/api/cloud/get/correos/conteo/filtro?q=' + q + '&field=' + field).then((response) => {
            return response;
        })
        .catch((error) => {
            console.log(error);
        })
    }

    this.obtenerMensajes = (conversationId) => {
        return $http.post('https://ma2tskinym.us-east-1.awsapprunner.com/api/cloud/get/email/messages', { conversationId: conversationId }).then((response) => {
            return response.data;
        })
            .catch((error) => {
                console.log(error);
                return null;
            })
    }

    this.createEmail = (token, body) => {
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + token;
        return $http.post('https://api.mypurecloud.com/api/v2/conversations/emails', body).then((response) => {
            return response.data;
        })
            .catch((error) => {
                console.log(error);
                return null;
            })
    }
})
