const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();



// Middlewares
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g0tttxr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    
    const userCollection = client.db('opinionLoom').collection('users');
    const tagCollection = client.db('opinionLoom').collection('tags');
    const postCollection = client.db('opinionLoom').collection('posts');
    const reportCollection = client.db('opinionLoom').collection('report');
    const announceCollection = client.db('opinionLoom').collection('announce');

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already has signed up before', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.post('/report',async(req,res)=>{
      const report=req.body;
       const result=await reportCollection.insertOne(report);
       res.send(result);
    })

    app.get('/report',async(req,res)=>{
      const result= await reportCollection.find().toArray();
      res.send(result);
    })

    app.post('/announce',async(req,res)=>{
      const announce=req.body;
      const result=await announceCollection.insertOne(announce);
      res.send(result);
    })

    app.get('/announce',async(req,res)=>{
      const result=await announceCollection.find().toArray();
      res.send(result);
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role === 'admin') {
        return res.status(403).send({ error: true, message: 'Forbidden access' });
      }
      next();
    };

    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    });

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin',
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          badge: 'gold'
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result); // This line ensures the response is sent back to the client
    });
    

    // Tags
    app.post('/tags', async (req, res) => {
      const tags = req.body;
      const result = await tagCollection.insertOne(tags);
      res.send(result);
    });

    app.get('/tags', async (req, res) => {
      const result = await tagCollection.find().toArray();
      res.send(result);
    });

    // Posts
    app.get('/posts', async (req, res) => {
      const searchQuery = req.query.searches || '';
      const query = {
        'tags.tag': { $regex: searchQuery, $options: 'i' }
      };
      const result = await postCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.findOne(query);
      res.send(result);
    });

    app.delete('/posts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.deleteOne(query);
      res.send(result);
    });

    app.post('/posts', async (req, res) => {
      const posts = req.body;
      const result = await postCollection.insertOne(posts);
      res.send(result);
    });

    // Upvote a post
app.put('/posts/upvote/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const update = { $inc: { upVote: 1 } }; 
  const options = { returnOriginal: false };
  const result = await postCollection.findOneAndUpdate(query, update, options);
  res.send(result.value); 
});

// Downvote a post
app.put('/posts/downvote/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const update = { $inc: { downVote: 1 } }; 
  const options = { returnOriginal: false };
  const result = await postCollection.findOneAndUpdate(query, update, options);
  res.send(result.value); 
});

// Add a comment to a post
app.post('/posts/comment/:id', async (req, res) => {
  const id = req.params.id;
  const comment = req.body;
  const query = { _id: new ObjectId(id) };

  // Check if comments object exists, if not, create it
  const existingPost = await postCollection.findOne(query);
  if (!existingPost.comments) {
    existingPost.comments = [];
  }
  
  // Add comment to comments array
  existingPost.comments.push(comment);

  // Update the post with the new comments
  const update = { $set: { comments: existingPost.comments } };
  const options = { returnOriginal: false };
  const result = await postCollection.findOneAndUpdate(query, update, options);
  res.send(result.value);
});


    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Opinion Loom is running');
});
app.listen(port, (req, res) => {
  console.log(`Opinion Loom is running on ${port}`);
});
