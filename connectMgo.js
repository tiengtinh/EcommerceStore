const MongoClient = require('mongodb').MongoClient

let _db
module.exports = function connectDB () {
  return new Promise((resolve, reject) => {
    if (_db) {
      return resolve(_db)
    }

    MongoClient.connect('mongodb://localhost:27017', (err, client) => {
      if (err) {
        return reject(err)
      }

      const db = client.db('coderschool_ecommerce_store')

      _db = db
      resolve(db)
    })
  })
}