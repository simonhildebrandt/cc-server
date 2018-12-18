const jwksClient = require('jwks-rsa');
const jwt = require ('jsonwebtoken');

const MongoClient = require ('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';
const dbName = 'myproject';

// MongoClient.connect(url)
//   .then((err, client) => {
//   const db = client.db(dbName);
//
//   const collection = db.collection('documents');
//
//   client.close();
// });


const client = jwksClient({
  strictSsl: true, // Default value
  jwksUri: "https://clockcamera.au.auth0.com/.well-known/jwks.json"
});

function validate(token) {
  const decoded = jwt.decode(token, {complete: true});
  const kid = decoded.header.kid;
  client.getSigningKey(kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    try {
      const result = jwt.verify(token, signingKey);
      console.log(result);
    } catch(err) {
      const error = {type: 'auth', type: 'unknown'};
      if (err.name == 'TokenExpiredError') {
        error.type = 'token_expired';
      }
      throw(error);
    }
  });
}

var sio = require('socket.io');
var server = sio.listen(1979);

console.log('listening on 1979')


const serverError = (msg, data = {}) => {
  const e = new Error(msg)
  e.data = {type: msg, ...data}
  return e
}
const serverMessage = (msg) => ({body: msg})

server.on('connection', function(socket){
  console.log('connected', socket.id);
  socket.use(([type, packet], next) => {
    try {
      console.log('packet', packet);
      const data = packet; //JSON.parse(packet);
      const auth = data.auth;
      if (!data.auth) {
        console.log('no auth!')
        return next(serverError('missing_auth'))
      } else {
        try {
          validate(data.auth);
          next()
        } catch(err) {
          console.log('dud auth!', err)
          return next(serverError('invalid_auth'))
        }
      }
    } catch (ex) {
      console.log('junk message', packet)
      next(serverError('invalid_message'))
    }
  });
  socket.on('message', function(message, callback){
    callback(serverMessage({msg: 'ack'}))
  });
  socket.on('close', function(){
    console.log('closed ', socket.id);
  });
});
