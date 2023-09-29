const express = require('express');
const Tesseract = require('tesseract.js');
const multer = require('multer');
const Webcam = require('node-webcam');
const path = require('path');
const fs = require('fs');

const axios = require('axios');


const app = express();
const PORT = process.env.PORT || 3850;

const webcam = Webcam.create({
  width: 1280,
  height: 720,
  quality: 100,
  delay: 0,
  saveShots: false,
  output: 'jpeg',
  callbackReturn: 'base64',
});


// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.use(express.static('public'));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Send the index.html file
});


app.post('/save-photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No photo uploaded.');
  }

  const photoBuffer = req.file.buffer;
  const photoName = 'captured.jpg'; // You can use a more dynamic name if needed

  fs.writeFile(path.join(__dirname, 'public', photoName), photoBuffer, err => {
    if (err) {
      console.error('Error saving photo:', err);
      return res.status(500).send('Error saving photo.');
    }

    console.log('Photo saved successfully');
    res.sendStatus(200);
  });
});



// Serve static files (index.html and client-side script)
app.use(express.static(__dirname));

// Handle POST request to /convert
app.post('/convert', upload.single('image'), (req, res) => {
  const imageBuffer = req.file.buffer;

  Tesseract.recognize(
    imageBuffer,
    'eng',
    {
      logger: info => console.log(info),
      psm: 7, // Try different page segmentation modes
    }
  ).then(({ data: { text } }) => {
    console.log('Extracted Text:', text);
    res.send(text);
  }).catch(error => {
    console.error('Error:', error);
    res.status(500).send('Error occurred during OCR.');
  });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});


// Making changes manually_R1_R2_R3_R4

