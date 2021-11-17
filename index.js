const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin');
const port = process.env.PORT || 5000;
const ObjectId = require('mongodb').ObjectId;

const serviceAccount = require('./ass-12-12a67-firebase-adminsdk-33fqa-7749e01215.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//middlewire
app.use(cors());
app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ugc7c.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

/* const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ugc7c.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`; */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gntw9.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

console.log(uri);

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token); // 73-9 token verify hole bhitorer data gulo return korbe
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    console.log('database connected successfully');
    const database = client.db('car_portal');
    const servicesCollection = database.collection('services');
    const ordersCollection = database.collection('ordered');
    const reviewsCollection = database.collection('reviews');
    const usersCollection = database.collection('users');

    //get api of services
    app.get('/services', async (req, res) => {
      const cursor = servicesCollection.find({});
      const users = await cursor.toArray();
      res.send(users);
    });
    //get api of reviews
    app.get('/reviews', async (req, res) => {
      const cursor = reviewsCollection.find({});
      const users = await cursor.toArray();
      res.send(users);
    });

    //post api
    app.post('/services', async (req, res) => {
      const newUser = req.body;
      const result = await servicesCollection.insertOne(newUser);
      console.log('Got new user', req.body);
      console.log('added user', result);
      // res.send(JSON.stringify(result))

      //alternative of stringify kore posting....  res.send(JSON.stringify(newUser)) & post jehetu pura  result tak json hishebe client side e pathno jabe
      res.json(result);
    });

    //sevices delete
    app.delete('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await servicesCollection.deleteOne(query);
      console.log('Deleting user with id', result);

      res.json(result);
    });

    //get api of orders
    app.get('/orders', async (req, res) => {
      console.log(req);
      const cursor = ordersCollection.find({});
      const users = await cursor.toArray();
      res.send(users);
    });
    //Booking single oreder
    app.post('/orders', async (req, res) => {
      console.log(req);
      const newUser = req.body;
      const result = await ordersCollection.insertOne(newUser);
      console.log('Got new user', req.body);
      console.log('added user', result);
      // res.send(JSON.stringify(result))

      //alternative of stringify kore posting....  res.send(JSON.stringify(newUser)) & post jehetu pura  result tak json hishebe client side e pathno jabe
      res.json(result);
    });
    //Giving single rview
    app.post('/reviews', async (req, res) => {
      console.log(req);
      const newUser = req.body;
      console.log('Got new review', req.body);
      const result = await reviewsCollection.insertOne(newUser);
      console.log('added ', result);
      // res.send(JSON.stringify(result))

      //alternative of stringify kore posting....  res.send(JSON.stringify(newUser)) & post jehetu pura  result tak json hishebe client side e pathno jabe
      res.json(result);
    });

    // Personal booking
    app.get('/orders/:uid', async (req, res) => {
      const uid = req.params.uid;
      console.log('Getting specific service', uid);
      const query = { userid: { $in: [uid] } }; //database e key value theke alada ekta object 'in' er moddhe 'keys' gulo  thakle okhane object 'in' e add hbe
      const products = await ordersCollection.find(query).toArray();
      res.send(products);
    });

    //Delete API

    app.delete('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      console.log('Deleting user with id', result);

      res.json(result);
    });

    //update api (presents here in mongodb by PUT)...url.. https://docs.mongodb.com/drivers/node/current/usage-examples/updateOne/
    app.put('/orders/:id', async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true }; //optional ...dile hobe na dileo hbe..upsert(update & insert mile upsert hoise works for update hole id dhore update hbe nahoi oi id dhore nahoi insert kore dibe)..module(64_5-2)
      const updateDoc = {
        $set: {
          orderStatus: 'Approved',
        },
      };
      const result = await ordersCollection.updateOne(filter, updateDoc, options);
      console.log('updating user', req);
      res.json(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === 'admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    //update
    app.put('/users', async (req, res) => {
      const user = req.body;
      console.log('put', user);
      const filter = { email: user.email };
      const options = { upsert: true }; //filter kore same email er kichu na pele thn insert kore dibe tai upsart :true dewa hoise
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    app.put('/users/:admin', verifyToken, async (req, res) => {
      const user = req.body;
      console.log('put', req.decodedEmail); //73-9 thik moto id verify hole verifyToken function thke decodedEmail pawa jabe console e ..makeAdmin client filetheke hit korar por url e
      const requester = req.decodedEmail;
      console.log(requester);
      if (requester) {
        const requesterAccount = await usersCollection.findOne({ email: requester });
        if (requesterAccount.role === 'admin') {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: 'admin' } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res.status(403).json({ message: 'you do not have access to make admin' });
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
