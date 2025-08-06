require('dotenv').config();
const { MongoClient } = require('mongodb');
const multer = require('multer');
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

// Create upload destination
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage });
app.put('/users/:username', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'themeImage', maxCount: 1 }
]), async (req, res) => {
    try {
        const { username } = req.params;
        const { name, bio } = req.body;

        if (!name || !req.files.profileImage || !req.files.themeImage) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const profileImagePath = `/uploads/${req.files.profileImage[0].filename}`;
        const themeImagePath = `/uploads/${req.files.themeImage[0].filename}`;

        const result = await db.collection('users').updateOne(
            { username },
            {
                $set: {
                    name,
                    bio,
                    username,
                    profileImage: profileImagePath,
                    themeImage: themeImagePath
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.put('/personalInfo/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { mobile, email, dob, gender, hide } = req.body;
        if (!mobile || !email || !dob || !hide) {
            return res.status(400).json({ error: 'Mobile, Email,gender and DOB are required.' });
        }
        const result = await db.collection('users').updateOne(
            { username },
            {
                $set: {
                    mobile,
                    email,
                    gender,
                    dob,
                    hide
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
app.put('/interestsHashtags/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { interests, hashtags } = req.body;
        if (!interests || !hashtags) {
            return res.status(400).json({ error: 'interests and hashtags are required.' });
        }
        const result = await db.collection('users').updateOne(
            { username },
            {
                $set: {
                    interests,
                    hashtags
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
app.put('/socialHandles/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { socialHandles } = req.body;
        if (!socialHandles) {
            return res.status(400).json({ error: 'socialHandles are required.' });
        }
        const result = await db.collection('users').updateOne(
            { username },
            {
                $set: {
                    socialHandles
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