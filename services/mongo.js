const logger = require('../services/logger');
const mongo = require('mongodb');
const moment = require('moment');

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://" + process.env.MONGO_USER + ":" + process.env.MONGO_PASSWORD + "@" + process.env.MONGO_SERVER + ":27017/" + process.env.MONGO_DB;

var InsertMessageToHistory = (message) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err){
				console.log(err);
				throw reject();
			}
			
            message.date = moment().format('DD-MM-yyyy HH:mm:ss');
            var dbo = db.db("historial");
            dbo.collection("conversaciones").insertOne(message, (err, res) => {
                if (err) throw reject();
                db.close();
		
                resolve();
            })
        })
    });
}

var GetHistory = (telefono, tipo) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
			if (err) {
				throw reject(err)
			};
			
            var dbo = db.db("historial");
            var query = {};

            switch (tipo) {
                case "images":
                    query = {
                        $or: [
                            {
                                "from": "521" + telefono
                            },
                            {
                                "to": "521" + telefono
                            }
                        ],
                        $and: [
                            {
                                "type": "image"
                            }
                        ]
                    }

                    break;
                case "documents":
                    query = {
                        $or: [
                            {
                                "from": "521" + telefono
                            },
                            {
                                "to": "521" + telefono
                            }
                        ],
                        $and: [
                            {
                                "type": "document"
                            }
                        ]
                    }

                    break;
				case "voice":
                    query = {
                        $or: [
                            {
                                "from": "521" + telefono
                            },
                            {
                                "to": "521" + telefono
                            }
                        ],
                        $and: [
                            {
                                "type": "voice"
                            }
                        ]
                    }

                    break;
                default:
                    query = {
                        $or: [
                            {
                                "from": "521" + telefono
                            },
                            {
                                "to": "521" + telefono
                            },
							{
                                "from": "52" + telefono
                            },
                            {
                                "to": "52" + telefono
                            }
                        ]
                    }
                    break;
            }

            dbo.collection("conversaciones").find(query).limit(300).sort({"timestamp": -1}).toArray((err, res) => {
                if (err) throw reject(err);
                db.close();
                resolve(res);
            })
        })
    });
}

module.exports = {
    InsertMessageToHistory: InsertMessageToHistory,
    GetHistory: GetHistory
}
