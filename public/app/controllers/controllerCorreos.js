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
    $scope.Ids = [];
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
            $scope.conteoPaginas = $scope.obtenerConteoEmails();
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

    $scope.obtenerEmails = () => {
        var query = '';

        var firstId = $scope.currentPage * $scope.itemsPerPage - $scope.itemsPerPage;
        var lastId = ($scope.currentPage * $scope.itemsPerPage - 1) > $scope.ids.length ? $scope.ids.length - 1 : $scope.currentPage * $scope.itemsPerPage - 1;

        for (var i = firstId; i <= lastId; i++) {
            query = query + $scope.ids[i] + ',';
        }

        query = query.slice(0, -1);
        
        var request = ApiService.obtenerEmails($scope.cloudUser.id, query);
        request.then((response) => {
            $scope.conversations = [];
            response.forEach((val, index) => {
                var conversation = {
                    conversationId: val.conversationId,
                    fechaInicial: val.conversationStart,
                    fechaFinal: val.conversationEnd,
                    direccion: val.originatingDirection,
                    remoteEmail : val.remoteEmail
                };
		    
		console.log(val);

                val.participants.forEach((participant, pIndex) => {
                    if (participant.purpose == 'agent') {
                        conversation.usuario = participant.user;

                        participant.sessions.forEach((session, sIndex) => {

                            conversation.remote = session.remote;

                            session.segments.forEach((segment, sIndex) => {
                                if (segment.segmentType == 'wrapup') {
                                    
                                    if (!conversation.calificacion) {
                                        conversation.calificacion = segment.wrapUpName;
                                    }

                                    conversation.nota = segment.wrapUpNote;
                                    conversation.asunto = segment.subject;
                                    conversation.queueId = segment.queueId;
                                }
                            })
                        })

                    }
                })

                $scope.conversations.push(conversation);
            })
        })
    }

    $scope.obtenerEmailsAll = () => {
        var query = '';

        var firstId = $scope.currentPage * $scope.itemsPerPage - $scope.itemsPerPage;
        var lastId = ($scope.currentPage * $scope.itemsPerPage - 1) > $scope.ids.length ? $scope.ids.length - 1 : $scope.currentPage * $scope.itemsPerPage - 1;

        for (var i = firstId; i <= lastId; i++) {
            query = query + $scope.ids[i] + ',';
        }

        query = query.slice(0, -1);

        var request = ApiService.obtenerEmailsAll(query);
        request.then((response) => {
            $scope.conversations = [];
            response.forEach((val, index) => {
                var conversation = {
                    conversationId: val.conversationId,
                    fechaInicial: val.conversationStart,
                    fechaFinal: val.conversationEnd,
                    direccion: val.originatingDirection,
                };

                val.participants.forEach((participant, pIndex) => {
                    if (participant.purpose == 'agent') {
                        conversation.de = participant.sessions[0].addressFrom;
                        conversation.para = participant.sessions[0].addressTo;

                        participant.sessions.forEach((session, sIndex) => {

                            conversation.remote = session.remote;

                            session.segments.forEach((segment, sIndex) => {
                                if (segment.segmentType == 'wrapup') {

                                    if (!conversation.calificacion) {
                                        conversation.calificacion = segment.wrapUpName;
                                    }

                                    conversation.nota = segment.wrapUpNote;
                                    conversation.asunto = segment.subject;
                                    conversation.queueId = segment.queueId;
                                }
                            })
                        })

                    }
                })

                $scope.conversations.push(conversation);
            })
        })
    }

    $scope.obtenerConteoEmails = () => {
        $scope.filter = false;
        $scope.currentPage = 1;
        $scope.pages = [];
        $scope.ids = [];
        var request = ApiService.obtenerConteoEmails($scope.cloudUser.id);
        request.then((response) => {
            $scope.ids = response;

            for (var i = 0; i < (Math.ceil(Number(response.length) / $scope.itemsPerPage)) ; i++) {
                try {
                    $scope.pages.push(i + 1);
                } catch (e) {

                }
            }

            $scope.obtenerEmails();
        })
    }

    $scope.obtenerConteoEmailsFilter = (query, field) => {
        $scope.filter = true;
        $scope.pages = [];
        $scope.ids = [];
        var request = ApiService.obtenerConteoEmailsFilter(query, field);
        request.then((response) => {
            $scope.ids = response.data;
            for (var i = 0; i < (Math.ceil(Number(response.data.length) / $scope.itemsPerPage)); i++) {
                try {
                    $scope.pages.push(i + 1);
                } catch (e) {

                }
            }

            $scope.obtenerEmailsAll();
        })
    }

    $scope.CheckSession();
    $scope.getUser();
}]);
