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


// Add global variables for cropping
let isCropping = false;
let cropCanvas, cropContext;
let cropX, cropY, cropWidth, cropHeight;

// Function to start the cropping process
function startCrop() {
  isCropping = true;
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const overlay = document.getElementById('cropOverlay');
  cropCanvas = document.getElementById('cropCanvas');
  cropContext = cropCanvas.getContext('2d');

  // Copy the captured image to the crop canvas
  cropCanvas.width = canvas.width;
  cropCanvas.height = canvas.height;
  cropContext.drawImage(canvas, 0, 0);

  // Show the cropping overlay
  overlay.style.display = 'flex';

  // Disable video streaming temporarily
  video.pause();
}

// Function to complete cropping and replace the image
function cropAndReplace() {
  if (isCropping) {
    isCropping = false;
    const overlay = document.getElementById('cropOverlay');

    // Hide the cropping overlay
    overlay.style.display = 'none';

    // Update the captured image with the cropped image
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');

    // Clear the existing image
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the cropped image onto the canvas
    context.drawImage(
      cropCanvas,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, canvas.width, canvas.height
    );

    // Resume video streaming
    const video = document.getElementById('video');
    video.play();
  }
}

// Function to handle cropping area selection
function handleCropArea(event) {
  if (isCropping) {
    const canvas = cropCanvas;
    const rect = canvas.getBoundingClientRect();
    cropX = (event.clientX - rect.left) * (canvas.width / rect.width);
    cropY = (event.clientY - rect.top) * (canvas.height / rect.height);
    cropWidth = 200; // Define your desired crop dimensions
    cropHeight = 200; // Define your desired crop dimensions

    // Clear the existing selection
    cropContext.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a rectangle for the cropping area
    cropContext.strokeStyle = 'white';
    cropContext.lineWidth = 2;
    cropContext.strokeRect(cropX, cropY, cropWidth, cropHeight);
  }
}

// Attach event listener for cropping area selection
document.getElementById('cropCanvas').addEventListener('mousedown', handleCropArea);

// Function to cancel cropping
function cancelCrop() {
  isCropping = false;
  const overlay = document.getElementById('cropOverlay');
  overlay.style.display = 'none';

  // Resume video streaming
  const video = document.getElementById('video');
  video.play();
}

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
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', // Restrict characters if needed
      psm: 7, // Try different page segmentation modes
    }
  ).then(({ data: { text } }) => {
    // Perform post-processing to remove unwanted characters
    const cleanedText = text.replace(/[`~!@#$%^&*()_=+\[\]{}\\|;:",<.>/?']/g, '');
    console.log('Extracted Text:', cleanedText);
    res.send(cleanedText);
  }).catch(error => {
    console.error('Error:', error);
    res.status(500).send('Error occurred during OCR.');
  });

});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});


// Making changes manually_R1_R2_R3_R4

// Add cropping function

