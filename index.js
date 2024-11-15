const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const upload = multer({ dest: 'uploads/' });

// const corsOptions = {
//     origin: ['http://localhost:3000','https://abaf-2402-8100-24e8-e780-5dfb-98d-5c62-9a91.ngrok-free.app/','https://time.navneet.website/'],
// };

app.use(cors());
// app.use(cors(corsOptions));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));

// Sample route for testing
app.get('/', (req, res) => {
    res.json("Welcome to our server");
});

app.post('/card', upload.single('photo'), async (req, res) => {
    const { name, address } = req.body;
    const photoPath = req.file ? req.file.path : null;

    console.log(name)
    console.log(address)

    // Canvas dimensions
    const width = 856;
    const height = 540;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    try {
        // Ensure the `images` directory exists
        if (!fs.existsSync(path.join(__dirname, 'images'))) {
            fs.mkdirSync(path.join(__dirname, 'images'));
        }

        // Load template image
        const templatePath = path.join(__dirname, 'templateNav.png');
        const templateImage = await loadImage(templatePath);
        ctx.drawImage(templateImage, 0, 0, width, height);

        // Load and place user photo
        const userPhoto = await loadImage(photoPath);
        ctx.drawImage(userPhoto, 625, 220, 220, 220); // Adjust position and size as needed

        // Add user details to the card
        ctx.font = '30px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText(`Name: ${name}`, 15, 270);
        ctx.fillText(`Address: ${address}`, 15, 320);
        ctx.fillText(`Card No: GD5632`, 15, 370);

        // Save the image locally
        const imageId = uuidv4();
        const imagePath = path.join(__dirname, 'images', `${imageId}.png`);
        const out = fs.createWriteStream(imagePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on('finish', () => {
            // Delete the uploaded user photo after processing
            fs.unlink(photoPath, (err) => {
                if (err) console.error('Failed to delete uploaded photo:', err);
            });

            const imageUrl = `${req.protocol}://${req.get('host')}/images/${imageId}.png`;
            res.json({ imageUrl });
        });
    } catch (error) {
        console.error('Error generating card:', error);
        res.status(500).json({ error: 'Failed to generate card' });
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
