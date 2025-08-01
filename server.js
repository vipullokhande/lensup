require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const express = require('express');
const PORT = process.env.PORT || 3000;

const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json({ limit: '10mb' }));

let db;
MongoClient.connect(process.env.MONGO_URI, { useUnifiedTopology: true })
    .then(client => {
        db = client.db('mydb'); // use your database name here
        console.log('Connected to MongoDB Atlas');

        // Start server only after DB is connected
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection failed:', err);
    });
function saveBase64Image(base64String, folder = 'uploads') {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);

    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid base64 string');

    const mimeType = matches[1];
    const ext = mimeType.split('/')[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a hash from image content
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const filename = `${hash}.${ext}`;
    const filepath = path.join(folder, filename);

    // Only write the file if it doesn't already exist
    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, buffer);
    }

    return filepath;
}
//Edit profile API
app.put('/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { name, bio, gender, image } = req.body;
        if (!name || !image) {
            return res.status(400).json({ error: 'name and image are required.' });
        }
        let imagePath;
        try {
            imagePath = saveBase64Image(image);
        } catch (err) {
            return res.status(400).json({ error: 'Invalid base64 image' });
        }
        console.log("ImagePath", imagePath);
        const result = await db.collection('users').updateOne(
            { username },
            {
                $set: {
                    name,
                    bio,
                    gender,
                    image: imagePath
                }
            }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});