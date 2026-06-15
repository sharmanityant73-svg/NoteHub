#  NoteHub
### AI-Powered Personal Knowledge Management System

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

> A full-stack AI-integrated web application built as a personal knowledge management system.
---

##  Live Demo
 **[Coming Soon - Deploying on Render]**

---

##  Features

| Feature | Description |
|---|---|
| User Authentication | Secure signup/login with bcrypt password hashing and session management |
| Rich Text Editor | Quill.js editor with full formatting toolbar |
| AI Summary | Automatic note summarization using Hugging Face BART-large-CNN |
| AI Mind Map | Interactive mind map generation using Groq LLaMA 3.3 70B + D3.js |
| AI Chat | Multi-turn conversational AI that answers questions about your notes |
| Smart Tags | AI-generated semantic tags using LLaMA 3.3 70B |
| Full-Text Search | Search across note titles, content, and tags |
| Two-Column Layout | Notion-style workspace with editor and AI tools side by side |

---

## Tech Stack

### Backend
- **Node.js** — JavaScript runtime
- **Express.js** — Web framework
- **MongoDB Atlas** — Cloud NoSQL database
- **Mongoose** — ODM for MongoDB
- **bcrypt** — Password hashing
- **express-session** — Session management
- **dotenv** — Environment variable management

### Frontend
- **EJS** — Server-side templating
- **Quill.js** — Rich text editor
- **D3.js** — Interactive SVG mind map visualization
- **CSS Grid** — Two-column responsive layout

### AI & NLP
- **Groq API** — LLaMA 3.3 70B for mind maps, tags, and chat
- **Hugging Face API** — BART-large-CNN for summarization
- **natural.js** — Local TF-IDF keyword extraction (offline fallback)

---

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB Atlas account
- Groq API key
- Hugging Face API key

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/sharmanityant73-svg/NoteHub.git
cd NoteHub
```

**2. Install dependencies**
```bash
npm install
```

**3. Create `.env` file in root directory**
```env
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
HF_API_KEY=your_huggingface_api_key
SESSION_SECRET=your_session_secret
ADMIN_USER=your_admin_username
ADMIN_PASS=your_admin_password
```

**4. Run the application**
```bash
node server.js
```

**5. Open in browser**
```
http://localhost:3000
```

---

## Project Structure

```
NoteHub/
├── models/
│   ├── user.js          # User schema
│   └── note.js          # Note schema
├── public/
│   └── js/
│       └── script.js    # Client-side JavaScript
├── views/
│   ├── notes.ejs        # Notes listing page
│   ├── note.ejs         # Note workspace
│   ├── login.ejs        # Login page
│   └── signup.ejs       # Signup page
├── mindmap-nlp.js       # Local NLP module (TF-IDF)
├── server.js            # Main application file
├── package.json
└── .env                 # Environment variables (not committed)
```

---

## Version History

| Version | Key Features Added |
|---|---|
| v1.0 | Basic CRUD note management |
| v2.0 | User auth, Quill editor, AI summary, Mind map |
| v3.0 | AI Chat, Semantic tags, Full-text search, Two-column layout |

---

## Future Scope
- Vector-based semantic search using MongoDB Atlas Vector Search
- Note categories and folders
- Real-time collaboration using WebSockets
- Export notes as PDF or Markdown
- Progressive Web App (PWA) support
- Email notifications using Nodemailer
- Note version history

---

## Author
**Nityant Sharma**
- sharmanityant73@gmail.com
- [GitHub](https://github.com/sharmanityant73-svg)

## License
This project is open source and available under the [MIT License](LICENSE).
