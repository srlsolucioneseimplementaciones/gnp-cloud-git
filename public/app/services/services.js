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
            redirect_uri: "https://ma2tskinym.us-east-1.awsapprunner.com"
        }

        window.location.replace("https://login.mypurecloud.com/oauth/authorize?" + jQuery.param(queryStringData));
    }

    this.getClientId = (data) =>  {
        return $http.post('https://ma2tskinym.us-east-1.awsapprunner.com/api/cloud/get/clientid').then(function (response) {
            return response.data;
        })
    }

    this.getTemplates = () =>  {
        return $http.get('https://ma2tskinym.us-east-1.awsapprunner.com/api/templates/get').then(function (response) {
            return response.data;
        })
    }
})
