const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;




//middleware
app.use(cors({
 
  origin:[
    'http://localhost:5174',
    'http://localhost:5173',
    "https://product-queries-3f654.web.app",
    "https://product-queries-3f654.firebaseapp.com",
    "https://664864c289a77b6fa02685e4--jocular-cuchufli-934cde.netlify.app"
   
   
  ],
  credentials: true
   
}));
app.use(express.json());
app.use(cookieParser());

const logger =(req, res , next) => {
  console.log('log - info',req.method, req.url);
   next();

}


const verifyToken = (req, res, next) => {

     const token = req?.cookies?.token;
      //  console.log('token in the middleware', token);
     
     if(!token){
      return res.status(401).send({message: 'unauthorized access'})
     }
     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
          return res.status(401).send({message: 'unauthorized access'})
        }
         req.user = decoded;
         next();

     })
     
      // next();
}









const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2aarqjz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const cookieOption = {

  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",


}






async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const queryCollection = client.db('queryDB').collection('addedQuery');

    const recommendCollection = client.db('queryDB').collection('recommendations');
    
///////jwt token er kaaj shuru///////////////

  app.post('/jwt', async(req, res)=> {
         const user = req.body;
         console.log(user);
         const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
          expiresIn:'7d'
         })
         
         res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
         })
         .send({success: true});

  })

   
   app.post('/logout', async(req, res)=>{

     const user = req.body;
     console.log('logging out user in jwt');
     res
     .clearCookie('token', {...cookieOption, maxAge: 0})
     .send({success: true})

   })




/////////jwt token er kaaj shesh/////////
     app.post('/addQueries', async(req,res) => {
         const newQuery = req.body;
         console.log(newQuery);
         const result = await queryCollection.insertOne(newQuery);
         res.send(result);

     })

     app.get('/addQueries1', async(req, res) => {
        const search = req.query.searchText;
        console.log(search);
        let query = {
          productName: { $regex: search, $options: 'i' },
        };
        const cursor = await queryCollection.find(query).toArray()
      
        res.send(cursor)
     })


     app.get('/addQueries', async(req, res) => {
       
    const cursor = await queryCollection.find().toArray()
        // const result = await cursor.toArray();
        // console.log(cursor);

        res.send(cursor)
     })


     app.get('/queryDetail/:id', async(req, res) => {
       const id = req.params.id;
       const query = {_id : new ObjectId(id)};
       const result = await queryCollection.findOne(query)
       res.send(result);
     })

     app.get('/addQueries/:email',logger,verifyToken, async(req, res) => {
      const reqEmail = req.params.email;
      console.log(reqEmail);
     console.log(req.user.email);
   
      if(req.user.email !== reqEmail){
        return res.status(403).send({message: 'forbidden access'})
       }

      const query = {email : reqEmail };
      const result = await queryCollection.find(query).toArray();
      res.send(result);

     })

      app.delete('/queryDelete/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result= await queryCollection.deleteOne(query);
        res.send(result);
      })


      app.put('/updateQuery/:id', async(req,res) => {
        const id = req.params.id;
        const filter = {_id : new ObjectId(id)};
        const options = {upsert: true};
        const updatedQuery = req.body;

        const newQuery = {
        $set: {

         productName : updatedQuery.productName,
         brandName : updatedQuery.brandName,
         productImage:  updatedQuery.productImage,
         queryTitle: updatedQuery. queryTitle,
         reason : updatedQuery.reason


        }
        }
 
         const result = await queryCollection.updateOne(filter, newQuery, options);

         res.send(result);

      })

////////////////////////////////

 
  

      app.get('/recommendations2/:recommendEmail', logger, verifyToken, async(req, res) => {
        const reqEmail = req.params.recommendEmail;

         console.log('token owner info', req.user);
            console.log('Paisi',reqEmail);
   
             if(req.user.email !== reqEmail){
          return res.status(403).send({message: 'forbidden access'})
         }

        const query = {recommendEmail : reqEmail };
        const result = await recommendCollection.find(query).toArray();
        res.send(result);
  
       })

       app.post('/recommendations2', async(req, res) => {
        const newRecom = req.body;
        const result = await recommendCollection.insertOne(newRecom);
        res.send(result);
      })
 
    
       app.delete('/recommendations2/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await recommendCollection.deleteOne(query);
        res.send(result);
        console.log(id);
    })

   
      
   
       app.get('/recommendations3/:queryId', async(req, res) => {
        const reqId = req.params.queryId;
        console.log(reqId);
        const query = {queryId : reqId };
        const result = await recommendCollection.find(query).toArray();
        res.send(result);
  
       })


        app.get('/recommendationsForMe/:email', async(req, res) => {
               
          const reqEmail = req.params.email;
        console.log(reqEmail);
        const query = {email : reqEmail };
        const result = await recommendCollection.find(query).toArray();
        res.send(result);
     


        })

       

   
     
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('query is ggoing')
})

app.listen(port, () => {
    console.log(`query of product is running on port ${port}`);
})




