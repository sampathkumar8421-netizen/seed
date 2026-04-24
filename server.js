const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const results = [];
    
    for (const file of req.files) {
      let text = '';
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (ext === '.pdf') {
        const data = await pdf(file.buffer);
        text = data.text;
      } else if (ext === '.docx') {
        const data = await mammoth.extractRawText({ buffer: file.buffer });
        text = data.value;
      } else {
        // Assume text-based for others (txt, md, js, etc.)
        text = file.buffer.toString('utf8');
      }
      
      // Clean and split lines
      const lines = text
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trimEnd())
        .filter(line => line.length > 0 || line.trim() !== ''); // Keep only non-empty lines for a better reading experience? 
        // Actually, user might want to see blanks. Let's keep them but trim.
      
      const cleanedLines = lines.length > 0 ? lines : ["(No readable text found)"];
      
      results.push({
        name: file.originalname,
        lines: cleanedLines,
        currentIndex: 0,
        playing: false,
        id: Date.now() + Math.random()
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ error: 'Failed to process files' });
  }
});

app.listen(port, () => {
  console.log(`StoryLine Backend listening at http://localhost:${port}`);
});
