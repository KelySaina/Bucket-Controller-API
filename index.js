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
  deleteFile,
  deleteAllFilesInBucket,
  getFileNumberInBucket
} = require('./bucket.controller');

const app = express();
app.use(cors())
app.use(express.json());

// Configure storage
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
  
  // Create multer instance
  const upload = multer({ storage });

// Route to create a new bucket
app.post('/bucket', async (req, res) => {
  const { bucketName } = req.body;
  try {
    const data = await createBucket(bucketName);
    res.status(201).json({ message: 'Bucket created successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to update a bucket
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

// Route to delete a bucket
app.delete('/bucket/:bucketName', async (req, res) => {
  const { bucketName } = req.params;
  try {
    const data = await deleteBucket(bucketName);
    res.status(200).json({ message: 'Bucket deleted successfully', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get the size of a bucket
app.get('/bucket/:bucketName/size', async (req, res) => {
  const { bucketName } = req.params;
  try {
    const size = await getBucketSize(bucketName);
    res.status(200).json({ message: 'Bucket size retrieved successfully', size });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get the number of files of a bucket
app.get('/bucket/:bucketName/file-number', async (req, res) => {
    const { bucketName } = req.params;
    try {
      const nb_file = await getFileNumberInBucket(bucketName);
      res.status(200).json({ message: 'Files in Bucket retrieved successfully', nb_file });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


// Route to delete a file from a bucket
app.delete('/bucket/:bucketName/delete/:fileName', async (req, res) => {
    const { bucketName, fileName } = req.params;
  
    try {
      const data = await deleteFile(bucketName, fileName);
      res.status(200).json({ message: 'File deleted successfully', data });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Route to delete al file from a bucket
    app.delete('/bucket/:bucketName/deleteAll', async (req, res) => {
        const { bucketName, fileName } = req.params;
    
        try {
        const data = await deleteAllFilesInBucket(bucketName);
        res.status(200).json({ message: 'Files deleted successfully', data });
        } catch (error) {
        res.status(500).json({ message: error.message });
        }
    });

    // Route to upload a file to a bucket
    app.post('/bucket/:bucketName/upload', upload.single('file'), async (req, res) => {
        const { bucketName } = req.params;
        const file = req.file;
    
        if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
        }
    
        try {
        // Define the path to the file and its name
        const filePath = path.join(__dirname, file.path);
        const fileName = file.originalname;
    
        // Upload the file to Supabase bucket
        const data = await uploadFile(bucketName, filePath, fileName);
    
        // Delete the file from the temporary folder
        fs.unlinkSync(filePath);
    
        res.status(200).json({ message: 'File uploaded successfully', data });
        } catch (error) {
        res.status(500).json({ message: error.message });
        }
    });  

// Start the server using the PORT from the .env file
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
