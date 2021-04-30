const express = require('express')
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nrs6y.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const port = 5000;

const app = express();
app.use(express.json());
app.use(cors());

var serviceAccount = require("./configs/burj-al-arab-by-hridi-firebase-adminsdk-68c1n-6ca0b0843f.json");

//   databaseURL: process.env.FIRE_DB;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
 

  app.post('/addBooking', (req, res)=>{
      const newBooking = req.body;
      bookings.insertOne(newBooking)
      .then(result => {
         res.send(result.insertedCount > 0);
      })
    //   console.log(newBooking); //thens means we are getting data in the server now we have to save them in mongodb
  });


  app.get('/bookings', (req, res) =>{
    //   console.log(req.query.email);
    const bearer = req.headers.authorization;

    if(bearer && bearer.startsWith('Bearer ')){
        const idToken = bearer.split(' ')[1];
        // console.log({idToken});

        admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
            const tokenEmail = decodedToken.email;
            const queryEmail = req.query.email;
            // console.log(tokenEmail, queryEmail);

            if(tokenEmail == queryEmail){
                bookings.find({email: queryEmail})
                .toArray((err, documents)=>{
                    res.status(200).send(documents);
                })
            }
            else{
                res.status(401).send('un-authorized access');
            }

            // console.log({uid});
        })
        .catch((error) => {
            res.status(401).send('un-authorized access');
        });
    }
    else{
        res.status(401).send('un-authorized access');
    }

  });



});

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.listen(port)