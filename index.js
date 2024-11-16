const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
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
    let photoPath = req.file ? req.file.path : null;

    console.log(name);
    console.log(address);

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

        // Convert HEIC/HEIF images to PNG if necessary
        if (photoPath) {
            const fileExtension = path.extname(photoPath).toLowerCase();
            if (fileExtension === '.heic' || fileExtension === '.heif') {
                try {
                    const convertedPath = `${photoPath}.png`;
                    await sharp(photoPath)
                        .toFormat('png')
                        .toFile(convertedPath);
                    fs.unlinkSync(photoPath); // Delete the original file
                    photoPath = convertedPath; // Update the photoPath to the converted file
                } catch (conversionError) {
                    console.error("Failed to convert HEIC/HEIF image. Skipping photo placement.");
                    photoPath = null; // Skip using the photo
                }
            }
        }

        // Load template image
        const templatePath = path.join(__dirname, 'templateNav.png');
        const templateImage = await loadImage(templatePath);
        ctx.drawImage(templateImage, 0, 0, width, height);

        // Try to load and place the user photo if available
        if (photoPath) {
            try {
                const userPhoto = await loadImage(photoPath);
                ctx.drawImage(userPhoto, 625, 220, 220, 220); // Adjust position and size as needed
            } catch (photoError) {
                console.error("Failed to load user photo. Skipping photo placement.");
            } finally {
                // Delete the uploaded or converted photo after processing
                fs.unlink(photoPath, (err) => {
                    if (err) console.error('Failed to delete processed photo:', err);
                });
            }
        }

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
