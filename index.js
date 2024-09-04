require('dotenv').config();
const cors = require('cors');
const multer = require('multer');
const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  createBucket,
  updateBucket,
  deleteBucket,
  getBucketSize,
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteAllFilesInBucket,
  getFileNumberInBucket,
  deleteAllBuckets
} = require('./bucket.controller');

const app = express();
app.use(cors());
app.use(express.json());

// Configure storage for single and multiple files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads_temp'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    // Replace spaces with dashes in the filename
    const sanitizedFileName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${Date.now()}_${sanitizedFileName}`);
  },
});

const upload = multer({ storage });

// Bucket Operations
app.post('/bucket', async (req, res) => {
  const { bucketName } = req.body;
  try {
    const data = await createBucket(bucketName);
    res.status(201).json({ message: 'Bucket created successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/bucket/:bucketName', async (req, res) => {
  const { bucketName } = req.params;
  const newSettings = req.body;
  try {
    const data = await updateBucket(bucketName, newSettings);
    res.status(200).json({ message: 'Bucket updated successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/bucket/:bucketName', async (req, res) => {
  const { bucketName } = req.params;
  try {
    const data = await deleteBucket(bucketName);
    res.status(200).json({ message: 'Bucket deleted successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/buckets', async (req, res) => {
  try {
    const data = await deleteAllBuckets();
    res.status(200).json({ message: 'All buckets deleted successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/bucket/:bucketName/size', async (req, res) => {
  const { bucketName } = req.params;
  try {
    const size = await getBucketSize(bucketName);
    res.status(200).json({ message: 'Bucket size retrieved successfully', size });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/bucket/:bucketName/file-number', async (req, res) => {
  const { bucketName } = req.params;
  try {
    const nb_file = await getFileNumberInBucket(bucketName);
    res.status(200).json({ message: 'Number of files in bucket retrieved successfully', nb_file });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// File Operations
app.post('/bucket/:bucketName/upload', upload.single('file'), async (req, res) => {
  const { bucketName } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const filePath = path.join(__dirname, file.path);
    const fileName = file.originalname;

    const data = await uploadFile(bucketName, filePath, fileName);

    fs.unlinkSync(filePath); // Delete the file from the temporary folder

    res.status(200).json({ message: 'File uploaded successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/bucket/:bucketName/upload-multiple', upload.array('file', 10), async (req, res) => {
  const { bucketName } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  try {
    const filePaths = files.map(file => ({
      path: path.join(__dirname, file.path),
      name: file.originalname
    }));

    const data = await uploadMultipleFiles(bucketName, filePaths);

    files.forEach(file => fs.unlinkSync(path.join(__dirname, file.path))); // Delete the files from the temporary folder

    res.status(200).json({ message: 'Files uploaded successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/bucket/:bucketName/delete/:fileName', async (req, res) => {
  const { bucketName, fileName } = req.params;

  try {
    const data = await deleteFile(bucketName, fileName);
    res.status(200).json({ message: 'File deleted successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/bucket/:bucketName/delete-all', async (req, res) => {
  const { bucketName } = req.params;

  try {
    const data = await deleteAllFilesInBucket(bucketName);
    res.status(200).json({ message: 'All files in bucket deleted successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the server using the PORT from the .env file
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
