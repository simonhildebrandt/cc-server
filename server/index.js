const jwksClient = require('jwks-rsa');
const jwt = require ('jsonwebtoken');

const client = jwksClient({
  strictSsl: true, // Default value
  jwksUri: "https://clockcamera.au.auth0.com/.well-known/jwks.json"
});

var engine = require('engine.io');
var server = engine.listen(80);

server.on('connection', function(socket){
  socket.send('utf 8 string');
  socket.on('message', function(data){
    const token = JSON.parse(data).auth;
    decoded = jwt.decode(token, {complete: true});
    const kid = decoded.header.kid;
    client.getSigningKey(kid, (err, key) => {
      const signingKey = key.publicKey || key.rsaPublicKey;
     const result = jwt.verify(token, signingKey);
     console.log(result);
    });
  });
  socket.on('close', function(){
    console.log('closed ', socket.id);
  });
});
