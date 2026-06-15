const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

// Common stop words to remove
const stopWords = new Set([
    'the','is','in','it','of','and','a','to','was','for',
    'on','are','as','with','his','they','at','be','this',
    'from','or','an','that','which','but','not','have',
    'had','has','he','she','we','you','i','its','by',
    'can','will','also','been','were','their','there',
    'used','use','using','would','could','should','may',
    'such','more','about','into','than','then','when',
    'what','how','all','do','does','did','just','so',
    'if','up','out','no','one','your','our','these'
]);

// ─── STEP 1: Tokenize and clean ────────────────────────────────
function tokenizeAndClean(text) {
    // Remove HTML tags first
    const plainText = text.replace(/<[^>]*>/g, '');
    
    // Split into words and convert to lowercase
    const tokens = tokenizer.tokenize(plainText.toLowerCase());
    
    // Remove stop words and short words (less than 3 characters)
    return tokens.filter(word => 
        !stopWords.has(word) && word.length > 2
    );
}

// ─── STEP 2: TF-IDF Scoring ────────────────────────────────────
function calculateTF(tokens) {
    const frequency = {};
    
    // Count how many times each word appears
    tokens.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Normalize by total number of tokens
    // This gives a score between 0 and 1
    const totalTokens = tokens.length;
    const tf = {};
    
    Object.keys(frequency).forEach(word => {
        tf[word] = frequency[word] / totalTokens;
    });
    
    return tf;
}

// ─── STEP 3: Extract top keywords ──────────────────────────────
function extractTopKeywords(tf, topN = 6) {
    // Sort words by their TF score, highest first
    return Object.entries(tf)
        .sort((a, b) => b[1] - a[1])   // sort by score descending
        .slice(0, topN)                  // take top N
        .map(entry => entry[0]);         // return just the word
}

// ─── STEP 4: Find subtopics for each keyword ───────────────────
function findSubtopics(keyword, sentences, stopWords) {
    const subtopics = new Set();
    
    sentences.forEach(sentence => {
        // If sentence contains this keyword
        if (sentence.toLowerCase().includes(keyword)) {
            
            // Tokenize this sentence
            const words = tokenizer.tokenize(sentence.toLowerCase());
            
            // Find other meaningful words in the same sentence
            // These are related to the keyword = good subtopics
            words.forEach(word => {
                if (
                    !stopWords.has(word) &&
                    word !== keyword &&
                    word.length > 3
                ) {
                    subtopics.add(word);
                }
            });
        }
    });
    
    // Return max 3 subtopics
    return [...subtopics].slice(0, 3);
}

// ─── MAIN FUNCTION: Generate mind map data ─────────────────────
function generateMindMapData(noteContent) {
    // Remove HTML tags and get plain text
    const plainText = noteContent.replace(/<[^>]*>/g, '');
    
    // Split text into sentences
    const sentences = plainText
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
    
    // Step 1: Tokenize and clean
    const tokens = tokenizeAndClean(plainText);
    
    // Step 2: Calculate TF scores
    const tfScores = calculateTF(tokens);
    
    // Step 3: Get top keywords — these become your branches
    const topKeywords = extractTopKeywords(tfScores, 6);
    
    // Step 4: For each keyword find related words as subtopics
    const branches = topKeywords.map(keyword => ({
        topic: keyword.charAt(0).toUpperCase() + keyword.slice(1), // capitalize
        subtopics: findSubtopics(keyword, sentences, stopWords)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    }));
    
    // The central topic = most frequent keyword
    const centralTopic = topKeywords[0].charAt(0).toUpperCase() 
                       + topKeywords[0].slice(1);
    
    return {
        central: centralTopic,
        branches: branches
    };
}

module.exports = { generateMindMapData };