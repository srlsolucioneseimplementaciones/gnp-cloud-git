app.directive('templatePreview', function () {
    return {
        templateUrl: '/App/Templates/templatePreview.html',
        link: function (scope, elem, attrs) {
            scope.$watch('template', function (newV, oldV) {
                if (newV) {
                    scope.templateFinal = newV.template;
                } else {
                    scope.templateFinal = '';
                }
            })
        }
    }
})

app.directive('updateTemplate', function ($timeout) {
    return {
        link: function (scope, elem, attrs) {
            elem.on('click', function (e) {
                $timeout(function () {
                    try {
                        var template = scope.templateFinal;

                        scope.template.variables.forEach(function (arr, index) {
                            template = template.replace('{{' + arr.name + '}}', arr.valor);
                        });

                        scope.templateFinal = template;

                        scope.template.variables.forEach(function (arr, index) {
                            if (arr.name != "nombre_agente") {
                                ///arr.valor = '';
                            }
                        });

						$('#variablesModal').modal('hide');
                    } catch (err) {
                        console.log(err);
                    }
                }, 1);
            })
        }
    }
})

app.directive('submitForm', function (ApiService, $timeout) {
    return {
        link: function (scope, elem, attrs) {
            elem.on('submit', function (e) {
                var msj = scope.mensaje;

                msj.template = scope.templateFinal;
                msj.cloudUser = scope.cloudUser.id;
                msj.variables = scope.template.variables;
                msj.nombre = scope.template.nombre;

                var enviar = true;

                for (var i = 0; i < msj.variables.length; i++) {
                    if (msj.variables[i].valor == "") {
                        alert("La variable " + msj.variables[i].name + " no tiene un valor asignado.");
                        enviar = false;
                        break;
                    }
                }

                if (!enviar) {
                    return;
                }

                scope.mensaje = {};
                scope.templateFinal = '';
                scope.template = '';
                scope.mensajeEstatus = 'Enviando';
                scope.mensajeDescripcion = 'Se esta enviando el mensaje, espera un momento...';
                $('#confirmationModal').modal('show');

                var request = ApiService.sendMessage(msj);
                request.then(function (response) {
                    if (response.data.response == "OK") {
                        $timeout(function () {
                            scope.mensajeEstatus = 'Enviado';
                            scope.mensajeDescripcion = 'El mensaje se envio correctamente';
                            $timeout(function () {
                                $('#confirmationModal').modal('hide');
                                $timeout(function () {
                                    scope.mensajeEstatus = 'Enviando';
                                    scope.mensajeDescripcion = 'Se esta enviando el mensaje, espera un momento...';
                                }, 1000)
                            }, 1000)
                        }, 1000)
                    }
                })
                .catch(function (error) {
                    $timeout(function () {
                        scope.mensajeEstatus = 'Error';
                        scope.mensajeDescripcion = 'Ocurrio un error, vuelve a intentarlo';
                        $timeout(function () {
                            $('#confirmationModal').modal('hide');
                                $timeout(function () {
                                    scope.mensajeEstatus = 'Enviando';
                                    scope.mensajeDescripcion = 'Se esta enviando el mensaje, espera un momento...';
                                }, 1000)
                            }, 1000)
                        }, 1000)
                })
            })
        }
    }
})

app.directive('obtenerTelefonos', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            var request = ApiService.obtenerTelefonos();
            request.then((response) => {
                scope.telefonos = response;
            })
        }
    }
})