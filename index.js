const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
  res.send("Hello, I am your Server!");
});

// MongoDB URI
const uri = `mongodb+srv://${process.env.DBUSERNAME}:${process.env.DBUSERPASS}@cluster0.a3y11iq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Collection variable defined outside so routes can access it
let recipeCollection;
let userCollection;

// MongoDB connection inside run()
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB");

    // Assign the collection so it's available globally
    recipeCollection = client.db("recipebook").collection("recipes");
    userCollection = client.db("recipebook").collection("users");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}
run().catch(console.dir);

// RoutesAPI managing dbData
// GET ALL THE RECIPES
app.get("/recipes", async (req, res) => {
  try {
    // if (!recipeCollection) {
    //   return res.status(503).send({ message: "Database not connected yet" });
    // }
    const recipes = await recipeCollection.find().toArray();
    res.send(recipes);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch recipes", error });
  }
});
// create user to db
app.post("/users", async (req, res) => {
  const userInfo = req.body;
  try {
    const existingUser = await userCollection.findOne({
      email: userInfo.email,
    });
    if (existingUser) {
      return res.send({
        success: false,
        message: "User already exists with this email",
      });
    }
    const result = await userCollection.insertOne(userInfo);
    res.send(result);
  } catch (error) {
    res.send(error);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
