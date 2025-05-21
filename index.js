const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
  res.send("Hello, I am your Server!");
});

// MongoDB URI
const uri = process.env.MONGODB_URI || 
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_USERPASS}@cluster0.a3y11iq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

// MongoDB connection inside run()
async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB");

    // Assign the collection so it's available globally
    recipeCollection = client.db("recipebook").collection("recipes");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}
run().catch(console.dir);

// Now route is defined outside run(), but can use recipeCollection
app.get("/recipes", async (req, res) => {
  try {
    if (!recipeCollection) {
      return res.status(503).send({ message: "Database not connected yet" });
    }
    const recipes = await recipeCollection.find().toArray();
    res.send(recipes);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch recipes", error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
