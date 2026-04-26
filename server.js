const express = require('express');
const multer = require('multer');
const { Dropbox } = require('dropbox');
const path = require('path');
require('dotenv').config();

const app = express();
// Keep the uploaded file in the server's memory temporarily
const upload = multer({ storage: multer.memoryStorage() }); 

// Serve your index.html file to the public
app.use(express.static(__dirname));

// This is your custom "Webhook" route that catches the file
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        // Unlock Dropbox using your secret key
        const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });
        
        const file = req.file;
        const { artist, title, genre, notes } = req.body;

        // 1. Upload the tagged MP3 to Dropbox
        await dbx.filesUpload({
            path: `/${file.originalname}`,
            contents: file.buffer
        });

        // 2. Format the answers and upload them as a text document
        const answersContent = `Artist: ${artist}\nTitle: ${title}\nGenre: ${genre}\nNotes: ${notes}`;
        await dbx.filesUpload({
            path: `/${title}_Answers.txt`,
            contents: Buffer.from(answersContent)
        });

        // Tell the frontend it was a success
        res.status(200).send('Files securely uploaded to Dropbox!');

    } catch (error) {
        console.error("Dropbox Upload Error:", error);
        res.status(500).send('Error uploading files to server.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
