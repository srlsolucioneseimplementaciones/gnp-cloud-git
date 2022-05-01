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
        return $http.post('https://941b-54-208-78-74.ngrok.io/api/messages/outbound', data, { timeout: 20000 })
			.then(function (response) {
				return response;
			})
			.catch(function (error) {
                return error;
            })
    }

    this.obtenerTelefonos = () => {
        return $http.get('https://941b-54-208-78-74.ngrok.io/api/configuraciones/telefonos')
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
            redirect_uri: "https://ec2-54-208-78-74.compute-1.amazonaws.com/reporte"
        }

        window.location.replace("https://login.mypurecloud.com/oauth/authorize?" + jQuery.param(queryStringData));
    }

    this.getClientId = (data) =>  {
        return $http.post('https://941b-54-208-78-74.ngrok.io/api/cloud/get/clientid').then(function (response) {
            return response.data;
        })
            .catch((error) => {
                console.log(error);
                return null;
            })
    }

    this.obtenerEmails = (userId) => {
        return $http.post('https://941b-54-208-78-74.ngrok.io/api/cloud/get/emails', { user: userId }).then((response) => {
            return response.data.conversations;
        })
            .catch((error) => {
                console.log(error);
                return null;
            })
    }

    this.obtenerMensajes = (conversationId) => {
        return $http.post('https://941b-54-208-78-74.ngrok.io/api/cloud/get/email/messages', { conversationId: conversationId }).then((response) => {
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
