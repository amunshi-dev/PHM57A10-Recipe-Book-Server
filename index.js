const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = 3000;

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
    const recipes = await recipeCollection.find().toArray();
    res.send(recipes);
  } catch (error) {
    res.send({ message: "Failed to fetch recipes", error });
  }
});

// sorted recipes by like count
app.get("/recipes/sort-by-like", async (req, res) => {
  try {
    const recipes = await recipeCollection
      .find()
      .sort({ likeCount: -1 })
      .toArray();
    res.send(recipes);
  } catch (error) {
    res.send({ message: "Failed to fetch recipes", error });
  }
});
// get one recipe by id
app.get("/recipes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // Validate ObjectId
    const recipe = await recipeCollection.findOne({ _id: new ObjectId(id) });

    if (!recipe) {
      return res.send({ message: "Recipe not found" });
    }

    res.send(recipe);
  } catch (error) {
    res.send(error);
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

// add recipe api
app.post("/add-recipe", async (req, res) => {
  const recipeData = req.body;
  try {
    const result = await recipeCollection.insertOne(recipeData);
    res.send(result);
  } catch (error) {
    res.send(error);
  }
});

// PATCH: increment like count
app.patch("/recipes/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const recipe = await recipeCollection.findOne({ _id: new ObjectId(id) });

    if (!recipe) {
      return res.send({ message: "Recipe not found" });
    }

    const newLikeCount = (recipe.likeCount || 0) + 1;

    const result = await recipeCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { likeCount: newLikeCount } }
    );

    if (result.modifiedCount > 0) {
      res.send({ likeCount: newLikeCount });
    } else {
      res.send({ message: "Failed to update like count" });
    }
  } catch (error) {
    res.send({ message: "Error updating like count", error });
  }
});

// GET /my-recipes?email=user@example.com
app.get("/my-recipes", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }

    const userRecipes = await recipeCollection
      .find({ authorEmail: email })
      .toArray();
    res.send(userRecipes);
  } catch (error) {
    res.send({ message: "Failed to fetch user's recipes", error });
  }
});

// delete userAddedRecipe
app.delete("/recipes/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await recipeCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      res.send({ success: true, message: "Recipe deleted successfully" });
    } else {
      res.send({ success: false, message: "Recipe not found" });
    }
  } catch (error) {
    res.send(error);
  }
});

// update recipe of users
app.put("/recipes/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  try {
    const result = await recipeCollection.updateOne(
      {
        _id: new ObjectId(id),
      },
      { $set: updatedData }
    );
    res.send(result);
  } catch (error) {
    res.send(error);
  }
});
// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
