const express = require('express');
const path = require('path'); // helper for file paths
const mongoose = require("mongoose");
const session = require("express-session");
const app = express();
const axios = require("axios");
const { generateMindMapData } = require('./mindmap-nlp');
const Groq = require('groq-sdk');
const bcrypt = require('bcrypt');
const User = require('./models/user');
require('dotenv').config();


app.set("view engine", "ejs");

// Enable session support
app.use(session({
  secret: "process.env.SESSION_SECRET", // used to sign the session ID cookie
  resave: false,
  saveUninitialized: false
}));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// This line allows Express to read form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // allow JSON body parsing for API routes
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// Serve all files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// 1️⃣ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, )
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error(" MongoDB connection error:", err));

// // 📘 Notes Schema and Model (AI-Ready)
const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
  
  // User who owns this note
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 🔹 AI Fields (Phase 0)
  summary: {
    type: String,
    default: ""
  },
  tags: {
    type: [String],
    default: []
  },
  embedding: {
    type: [Number],
    default: []
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Note = mongoose.model("Note", noteSchema);


// 2️⃣ Create a Schema (data blueprint)
const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  date: { type: Date, default: Date.now }
});

// 3️⃣ Make a Model (like a table)
const Message = mongoose.model("Message", messageSchema);

// Home route (optional, can be removed since index.html will show automatically)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.post("/contact", async (req, res) => {
  try {
    const { name, message } = req.body;

    // Create a new document (row) in database
    const newMessage = new Message({ name, message });
    await newMessage.save(); // save to MongoDB

    // ✨ UPDATED: Better styled response
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Sent - NoteHub</title>
        <link rel="stylesheet" href="/style.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body>
        <nav>
          <div class="nav-container">
            <h1>📝 NoteHub</h1>
            <div class="nav-links">
              <a href="/">Home</a>
              <a href="/notes">Notes</a>
              <a href="/add-note">Add Note</a>
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </nav>

        <div class="container" style="margin-top: 40px;">
          <div class="alert alert-success">
            <span>✅</span>
            <span>Your message has been sent successfully!</span>
          </div>
          
          <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">📧</div>
            <h1 style="color: var(--dark); margin-bottom: 16px;">Thank you, ${name}!</h1>
            <p style="color: var(--gray); font-size: 18px; margin-bottom: 30px;">
              We've received your message and will get back to you soon.
            </p>
            <div class="button-group" style="justify-content: center;">
              <a href="/" class="button">🏠 Back to Home</a>
              <a href="/contact" class="button button-secondary">📧 Send Another Message</a>
            </div>
          </div>
        </div>

        <footer>
          <p>&copy; 2025 NoteHub. Built with ❤️ using Node.js, Express, and MongoDB</p>
        </footer>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error saving to DB:", err);
    res.status(500).send("Something went wrong.");
  }
});

// Route to fetch and display all saved messages
app.get("/messages", async (req, res) => {
   // Check if admin is logged in
  if (!req.session.isAdmin) {
    return res.redirect("/admin");
  }
  try {
    // 1️⃣ Get all messages from the database
    const messages = await Message.find().sort({ date: -1 }); // latest first

    // ✨ UPDATED: Modern styled HTML
    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>All Messages - NoteHub Admin</title>
        <link rel="stylesheet" href="/style.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body>
        <nav>
          <div class="nav-container">
            <h1>📝 NoteHub</h1>
            <div class="nav-links">
              <a href="/">Home</a>
              <a href="/notes">Notes</a>
              <a href="/add-note">Add Note</a>
              <a href="/messages" class="active">Messages</a>
              <a href="/admin/logout">🔓 Logout</a>
            </div>
          </div>
        </nav>

        <div class="container" style="margin-top: 40px;">
          <div class="section-header">
            <h1>📬 Contact Messages</h1>
            <p>All messages received from the contact form</p>
          </div>

          ${messages.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📭</div>
              <h3>No Messages Yet</h3>
              <p>When users submit the contact form, their messages will appear here.</p>
            </div>
          ` : ''}

          <div class="notes-grid">
    `;

    // 3️⃣ Add each message into HTML with modern styling
    messages.forEach(msg => {
      const formattedDate = new Date(msg.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      html += `
        <div class="note">
          <h3>👤 ${msg.name}</h3>
          <p>${msg.message}</p>
          <div class="note-meta">
            <span>📅 ${formattedDate}</span>
          </div>
        </div>
      `;
    });

    // 4️⃣ Close HTML tags
    html += `
          </div>
        </div>

        <footer>
          <p>&copy; 2025 NoteHub. Built with ❤️ using Node.js, Express, and MongoDB</p>
        </footer>
      </body>
      </html>
    `;

    // 5️⃣ Send the full HTML back to browser
    res.send(html);
  } catch (err) {
    console.error("Error retrieving messages:", err);
    res.status(500).send("Error fetching messages.");
  }
});

//  Show Add Note page
app.get("/add-note", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add-note.html"));
});

//  Handle Note creation
app.post("/add-note", requireLogin, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newNote = new Note({
      title,
      content,
      summary: "",
      tags: [],
      embedding: [],
      userId: req.session.userId
    });
    await newNote.save();

    // ✨ UPDATED: Better styled response
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Note Saved - NoteHub</title>
        <link rel="stylesheet" href="/style.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body>
        <nav>
          <div class="nav-container">
            <h1>📝 NoteHub</h1>
            <div class="nav-links">
              <a href="/">Home</a>
              <a href="/notes">Notes</a>
              <a href="/add-note" class="active">Add Note</a>
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </nav>

        <div class="container" style="margin-top: 40px;">
          <div class="alert alert-success">
            <span>✅</span>
            <span>Your note has been saved successfully!</span>
          </div>
          
          <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
            <h1 style="color: var(--dark); margin-bottom: 16px;">Note Saved!</h1>
            <p style="color: var(--gray); font-size: 18px; margin-bottom: 30px;">
              Your note "${title}" has been successfully saved to the database.
            </p>
            <div class="button-group" style="justify-content: center;">
              <a href="/notes" class="button">📚 View All Notes</a>
              <a href="/add-note" class="button button-secondary">✍️ Add Another Note</a>
            </div>
          </div>
        </div>

        <footer>
          <p>&copy; 2025 NoteHub. Built with ❤️ using Node.js, Express, and MongoDB</p>
        </footer>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Error saving note:", err);
    res.status(500).send("Failed to save note.");
  }
});

//  View all notes - ✨ UPDATED WITH MODERN DESIGN
app.get("/notes", requireLogin, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.session.userId })
                            .sort({ createdAt: -1 });
    res.render("notes", { notes, username: req.session.username });
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).send("Error loading notes.");
  }
});

app.get("/note/:id", async (req, res) => {

  try{

    const note = await Note.findById(req.params.id)

    if(!note){
      return res.send("Note not found")
    }

    res.render("note", { note })

  }catch(err){
    console.error(err)
    res.send("Server error")
  }

});

app.post("/update-note/:id", async (req,res)=>{

  try{

    await Note.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content }
    )

    res.redirect("/note/" + req.params.id)

  }catch(err){

    console.error(err)
    res.send("Error updating note")

  }

});

//  Delete a note
app.post("/delete-note/:id", async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.redirect("/notes");
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).send("Could not delete note.");
  }
});

// ================= AI FEATURE PLACEHOLDERS (PHASE 0) =================

// Generate AI Summary (dummy)

app.post("/notes/:id/summarize", async (req, res) => {

  try {

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).send("Note not found");
    }

  
    const cleanText = note.content.replace(/<[^>]*>/g, '');

    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn",
      {
        inputs: cleanText
      },
      {
        headers:{
        Authorization: `Bearer ${process.env.HF_API_KEY}`
      }
      }
    );
    console.log("AI RESPONSE:", response.data);

    const summary = response.data[0]?.summary_text || "AI could not generate summary";

    note.summary = summary;
    await note.save();

    res.json({ summary: summary });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:"Ai summarisation failed"
    })
  }

});
// ================= AI FEATURE PLACEHOLDERS (Mind map generation) =================
// app.post('/generate-mindmap/:id', async (req, res) => {
//     try {
//         const note = await Note.findById(req.params.id);
        
//         // Use NLP instead of AI API
//         const mindmapData = generateMindMapData(note.content);
        
//         res.json(mindmapData);
        
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Failed to generate mind map' });
//     }
// });

app.post('/generate-mindmap/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        const plainText = note.content.replace(/<[^>]*>/g, '');

        const prompt = `
You are a mind map expert. Analyze the following note and create a 
detailed and meaningful mind map.

Rules:
- Central topic must be the core subject of the note
- Create exactly 5 or 6 branches that are MEANINGFUL topics
- Each branch must have exactly 3 specific subtopics
- Avoid generic words like "important", "widely", "various"
- Return ONLY raw JSON, no explanation, no markdown, no backticks

JSON format:
{
    "central": "Core Subject",
    "branches": [
        {
            "topic": "Main Topic 1",
            "subtopics": ["Specific Concept", "Specific Concept", "Specific Concept"]
        }
    ]
}

Note content:
${plainText}
        `;

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1024
        });

        const rawText = response.choices[0].message.content.trim();

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return res.status(500).json({ error: 'AI did not return valid JSON' });
        }

        const mindmapData = JSON.parse(jsonMatch[0]);
        res.json(mindmapData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate mind map' });
    }
});

// Generate Smart Tags using Groq AI
app.post("/notes/:id/tags", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const plainText = note.content.replace(/<[^>]*>/g, '');

    const prompt = `You are a smart tagging assistant. Read the following note and generate 4 to 6 concise, meaningful tags.

Rules:
- Tags must be single words or short 2-word phrases (e.g. "machine-learning", "react", "project-planning")
- Tags should be lowercase, hyphen-separated if multi-word
- Return ONLY a JSON array of strings, no explanation, no markdown, no backticks

Example output: ["javascript", "web-dev", "async", "promises"]

Note content:
${plainText}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200
    });

    const rawText = response.choices[0].message.content.trim();
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ error: 'AI did not return valid tags' });

    const tags = JSON.parse(jsonMatch[0]);
    note.tags = tags;
    await note.save();

    res.json({ tags });
  } catch (error) {
    console.error("Tag generation error:", error);
    res.status(500).json({ error: "Tag generation failed" });
  }
});

// Save tags manually
app.post("/notes/:id/save-tags", async (req, res) => {
  try {
    const { tags } = req.body;
    await Note.findByIdAndUpdate(req.params.id, { tags });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Could not save tags" });
  }
});

// AI Chat about a note
app.post("/notes/:id/chat", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    const { message, history } = req.body;
    const plainText = note.content.replace(/<[^>]*>/g, '');

    const systemPrompt = `You are a helpful AI assistant. The user is asking questions about their note titled "${note.title}".

Note content:
${plainText}

Answer questions based on this note content. Be concise and helpful.`;

    const messages = [
      ...(history || []),
      { role: 'user', content: message }
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 512
    });

    const reply = response.choices[0].message.content.trim();
    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

// Note search
app.get("/search", requireLogin, async (req, res) => {
  try {
    const q = req.query.q || '';
    const notes = await Note.find({
      userId: req.session.userId,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    res.render("notes", { notes, username: req.session.username, searchQuery: q });
  } catch (err) {
    res.status(500).send("Search error");
  }
});

// Show Signup Page
app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

// Handle Signup
app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('signup', { error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        req.session.userId = user._id;
        req.session.username = user.username;

        res.redirect('/notes');
    } catch (error) {
        console.error(error);
        res.render('signup', { error: 'Something went wrong' });
    }
});

// Show Login Page
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Email not found' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { error: 'Incorrect password' });
        }

        req.session.userId = user._id;
        req.session.username = user.username;

        res.redirect('/notes');
    } catch (error) {
        console.error(error);
        res.render('login', { error: 'Something went wrong' });
    }
});

// User Logout
app.get('/logout', (req, res) => {
    req.session.userId = null;
    req.session.username = null;
    res.redirect('/login');
});

// Admin Login Page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

// Handle Admin Login
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    req.session.isAdmin = true;
    res.redirect("/messages");
  } else {
    // UPDATED: Better error message
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login Failed - NoteHub</title>
        <link rel="stylesheet" href="/style.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body>
        <nav>
          <div class="nav-container">
            <h1>📝 NoteHub</h1>
            <div class="nav-links">
              <a href="/">Home</a>
            </div>
          </div>
        </nav>

        <div class="container" style="margin-top: 40px;">
          <div class="alert alert-danger">
            <span>❌</span>
            <span>Invalid username or password!</span>
          </div>
          
          <div style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🔒</div>
            <h1 style="color: var(--dark); margin-bottom: 16px;">Access Denied</h1>
            <p style="color: var(--gray); font-size: 18px; margin-bottom: 30px;">
              The credentials you entered are incorrect. Please try again.
            </p>
            <a href="/admin" class="button">🔐 Try Again</a>
          </div>
        </div>

        <footer>
          <p>&copy; 2025 NoteHub. Built with ❤️ using Node.js, Express, and MongoDB</p>
        </footer>
      </body>
      </html>
    `);
  }
});

// Handle Admin Logout
app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin");
  });
});


app.listen(5000, () => {
  console.log('Server running at http://localhost:5000');
});