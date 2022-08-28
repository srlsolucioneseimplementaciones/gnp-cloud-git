app.controller('mainController', ['$scope', 'ApiService', '$timeout', function ($scope, ApiService, $timeout) {
    const platformClient = require('platformClient');


    $scope.Token = {};
    $scope.cloudUser =  {
        id: '',
        name: '',
        username: '',
        queues: []
    }

    $scope.itemsPerPage = 50;
    $scope.currentPage = 1;
    $scope.pages = [];
    $scope.ids = [];
    $scope.filter = false;

    $scope.regex = '/^[0-9]*$/';

    $scope.CheckSession = function () {
        var n = 'access_token';
        $scope.Token = ApiService.getUrlVars(n);

        if (!$scope.Token) {
            var req = ApiService.getClientId();
            req.then(function (response) {
                clientId = response.clientId;
                ApiService.cloudLogin(clientId);
            });
        }
    };

    $scope.getUser = function () {
        platformClient.ApiClient.instance.authentications['PureCloud Auth'].accessToken = $scope.Token;
        var users = new platformClient.UsersApi();

        users.getUsersMe().then(function (userObject) {
            $scope.cloudUser.id = userObject.id;
            $scope.cloudUser.name = userObject.name;
            $scope.cloudUser.username = userObject.username;
            $scope.getQueues($scope.cloudUser.id);
            $scope.conteoPaginas = $scope.obtenerConteoHSM();
        });
    }

    $scope.getQueues = (userId) =>  {
        var queues = new platformClient.UsersApi();
        var opts = {
            'pageSize': 100,
            'pageNumber': 1
        }

        queues.getUserQueues(userId, opts).then(function (data) {
            data.entities.forEach(function (arr, index) {
                $scope.cloudUser.queues.push({ 'id': arr.id, 'name': arr.name });
            })
        })
    }

    $scope.obtenerHSM = () => {
        var query = '';

        var firstId = $scope.currentPage * $scope.itemsPerPage - $scope.itemsPerPage;
        var lastId = ($scope.currentPage * $scope.itemsPerPage - 1) > $scope.ids.length ? $scope.ids.length - 1 : $scope.currentPage * $scope.itemsPerPage - 1;

        for (var i = firstId; i <= lastId; i++) {
            query = query + $scope.ids[i] + ',';
        }

        query = query.slice(0, -1);
        
        var request = ApiService.obtenerHSM(query);
        request.then((response) => {
            $scope.registros = response;
        })
    }

    $scope.obtenerHSMFilter = () => {
        var query = '';

        var firstId = $scope.currentPage * $scope.itemsPerPage - $scope.itemsPerPage;
        var lastId = ($scope.currentPage * $scope.itemsPerPage - 1) > $scope.ids.length ? $scope.ids.length - 1 : $scope.currentPage * $scope.itemsPerPage - 1;

        for (var i = firstId; i <= lastId; i++) {
            query = query + $scope.ids[i] + ',';
        }

        query = query.slice(0, -1);

        var request = ApiService.obtenerHSMFilter(query);
        request.then((response) => {
            $scope.registros = response;
        })
        .catch((error) => {
            console.log(error);
        })
    }

    $scope.obtenerConteoHSM = () => {
        $scope.filter = false;
        $scope.currentPage = 1;
        $scope.pages = [];
        $scope.ids = [];
        var request = ApiService.obtenerConteoHSM();
        request.then((response) => {
            $scope.ids = response;

            for (var i = 0; i < (Math.ceil(Number(response.length) / $scope.itemsPerPage)) ; i++) {
                try {
                    $scope.pages.push(i + 1);
                } catch (e) {

                }
            }

            $scope.obtenerHSM();
        })
    }

    $scope.obtenerConteoHSMFilter = (query, field) => {
        $scope.filter = true;
        $scope.currentPage = 1;
        $scope.pages = [];
        $scope.ids = [];
        var request = ApiService.obtenerConteoHSMFilter(query, field);
        request.then((response) => {
            $scope.ids = response.data;
            for (var i = 0; i < (Math.ceil(Number(response.data.length) / $scope.itemsPerPage)); i++) {
                try {
                    $scope.pages.push(i + 1);
                } catch (e) {
                    console.log(e);
                }
            }

            $scope.obtenerHSM();
        })
    }

    $scope.downloadReportHSM = () => {
        var request = ApiService.downloadReportHSM($scope.ids);
        request.then((response) => {
            var a = document.createElement('a');
            document.body.appendChild(a);
            a.download = "reporteHSM.csv";
            a.href = "https://ma2tskinym.us-east-1.awsapprunner.com/reporteHSM.csv";
            a.click();
        })
            .catch((error) => {
                console.log(error);
            })
    }

    $scope.CheckSession();
    $scope.getUser();
}]);
