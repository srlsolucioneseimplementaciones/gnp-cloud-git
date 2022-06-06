app.directive('clearFilters', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();
                scope.$apply(() => {
                    scope.filtroCorreoDe = undefined;
                    scope.filtroCorreoPara = undefined;
                    scope.filtroCorreoAsunto = undefined;
                    scope.filtroCorreoWrapup = undefined;
                    scope.filtroCorreoFechaI = undefined;
                    scope.filtroCorreoFechaF = undefined;
                    scope.filtroCorreoNotas = undefined;
                });
            })
        }
    }
})

app.directive('replyEmail', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                var request = ApiService.obtenerMensajes(scope.x.conversationId);
                request
                    .then((response) => {
                        var text = "";

                        response.forEach((val, index) => {
                            val.fecha = moment(val.time).format('DD/MM/YYYY HH:mm:ss');
                            text += val.htmlBody;
                        });

                        var body = {
                            "queueId": scope.x.queueId,
                            "toAddress": scope.x.remote,
                            "subject": scope.x.asunto,
                            "direction": "OUTBOUND",
                            "htmlBody": text
                        }

                        var request = ApiService.createEmail(scope.$parent.Token, body);
                        request
                            .then((resp) => {

                            })
                            .catch((err) => {
                                console.log(error);
                            })
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            })
        }
    }
})

app.directive('showModal', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                var request = ApiService.obtenerMensajes(scope.x.conversationId);
                request
                    .then((response) => {
                        scope.$parent.curItem = scope.x;
                        scope.$parent.curEmailMessages = response;
                       
                        response.forEach((val, index) => {
                            val.fecha = moment(val.time).format('DD/MM/YYYY HH:mm:ss');

                            if (val.htmlBody) {
                                var t = jQuery.parseHTML(val.htmlBody);
                                val.convertedText = "";
                                t.forEach((v, i) => {
                                    val.convertedText = val.convertedText + v.textContent;
                                })
                            }
                        });

                        $('#contentModal').modal('show');
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            })
        }
    }
})

app.directive('changePage', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();
                scope.$apply(scope.$parent.currentPage = scope.t);

                if (!scope.filter) {
                    scope.obtenerEmails();
                } else {
                    scope.obtenerEmailsAll();
                }
            })
        }
    }
})

app.directive('addPage', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                if (scope.currentPage < scope.pages.length) {
                    scope.$apply(scope.currentPage++);
                } else {
                    scope.$apply(scope.currentPage = 1);
                }

                if (!scope.filter) {
                    scope.obtenerEmails();
                } else {
                    scope.obtenerEmailsAll();
                }
            })
        }
    }
})

app.directive('subtractPage', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();

                if (scope.currentPage >= scope.pages.length || scope.currentPage == 2) {
                    scope.$apply(scope.currentPage--);
                } else {
                    scope.$apply(scope.currentPage = scope.pages.length);
                }

                if (!scope.filter) {
                    scope.obtenerEmails();
                } else {
                    scope.obtenerEmailsAll();
                }
            })
        }
    }
})

app.directive('searchEmailsRemote', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                scope.obtenerConteoEmailsFilter(scope.filtroCorreoRemote, 'remote');
                scope.filtroCorreoRemote = null;
            })
        }
    }
})

app.directive('searchEmailsSubject', (ApiService) => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                scope.obtenerConteoEmailsFilter(scope.filtroCorreoAsunto, 'subject');
                scope.filtroCorreoAsunto = null;
            })
        }
    }
})

app.directive('getLink', () => {
    return {
        link: (scope, elem, attrs) => {
            elem.on('click', (e) => {
                e.preventDefault();
                 var link = 'https://apps.mypurecloud.com/directory/#/engage/admin/interactions/' + scope.x.conversationId;
                alert(link);
            })
        }
    }
})
