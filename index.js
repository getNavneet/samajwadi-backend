const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const cors = require('cors')
// enabling CORS for some specific origins only.
let corsOptions = {
    origin : ['http://localhost:3000'],
 }
 
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

app.use(cors(corsOptions))
// sample api routes for testing
app.get('/',(req, res) => {
    res.json("welcome to our server")
 });
// Serve static files from a folder
app.use('/images', express.static(path.join(__dirname, 'images')));
app.get('/hello',(req,res)=>{
    res.send("hello ")
})
app.post('/card', async (req, res) => {
  const { name, address, cardNumber } = req.body;
console.log(name)

  // Canvas dimensions (adjust if needed)
  const width = 856;
  const height = 540;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Load template image
  try{
    console.log("loadin ")
    const templatePath = path.join(__dirname, 'template.png');
    const templateImage = await loadImage(templatePath);
    ctx.drawImage(templateImage, 0, 0, width, height);
    console.log("loaded ")
  }
  catch{

    res.send("errre")
  }
  

  // Add user details to the card
  ctx.font = '30px Arial';
  ctx.fillStyle = '#000';
  ctx.fillText(`Name: ${name}`, 15, 270);
  ctx.fillText(`Address: ${address}`, 15, 320);
  ctx.fillText(`Card No: ${cardNumber}`, 15, 370);

  // Save the image locally
  const imageId = uuidv4();
  const imagePath = path.join(__dirname, 'images', `${imageId}.png`);
  const out = fs.createWriteStream(imagePath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  out.on('finish', () => {
    const imageUrl = `${req.protocol}://${req.get('host')}/images/${imageId}.png`;
    console.log(imageUrl)
    res.json({ imageUrl });
  });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
