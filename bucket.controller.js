const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// **Bucket Operations**

// Create a new bucket
async function createBucket(bucketName) {
  const { data, error } = await supabase.storage.createBucket(bucketName, {
    public: true,
  });
  if (error) {
    throw new Error(`Error creating bucket: ${error.message}`);
  }
  return data;
}

// Update a bucket's settings
async function updateBucket(bucketName, newSettings) {
  const { data, error } = await supabase.storage.updateBucket(bucketName, newSettings);
  if (error) {
    throw new Error(`Error updating bucket: ${error.message}`);
  }
  return data;
}

// Delete a bucket
async function deleteBucket(bucketName) {
  const { data, error } = await supabase.storage.deleteBucket(bucketName);
  if (error) {
    throw new Error(`Error deleting bucket: ${error.message}`);
  }
  return data;
}

// Get the size of a bucket
async function getBucketSize(bucketName) {
  const { data, error } = await supabase.storage.from(bucketName).list('', { limit: 1000 });
  if (error) {
    throw new Error(`Error listing files in bucket: ${error.message}`);
  }
  const totalSize = data.reduce((acc, file) => acc + file.metadata.size, 0);
  return formatSize(totalSize); // in bytes
}

// Get the number of files in a bucket
async function getFileNumberInBucket(bucketName) {
  let fileCount = 0;
  let shouldContinue = true;
  let nextCursor = '';

  while (shouldContinue) {
    const { data, error, cursor } = await supabase.storage.from(bucketName).list('', {
      limit: 1000,
    });

    if (error) {
      throw new Error(`Error listing files in bucket: ${error.message}`);
    }

    // If no more files, stop the loop
    if (!data || data.length === 0) {
      shouldContinue = false;
      break;
    }

    // Count the files
    fileCount += data.length;

    // Prepare for the next batch of files
    nextCursor = cursor;

    if (!cursor) {
      shouldContinue = false;
    }
  }

  return fileCount;
}

// Delete all buckets
async function deleteAllBuckets() {
  // List all buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Error listing buckets: ${listError.message}`);
  }

  const results = [];

  // Delete each bucket
  for (const bucket of buckets) {
    try {
      await deleteAllFilesInBucket(bucket.name); // Optionally delete all files in the bucket before deleting the bucket
      const { data, error } = await supabase.storage.deleteBucket(bucket.name);
      if (error) {
        throw new Error(`Error deleting bucket ${bucket.name}: ${error.message}`);
      }
      results.push({ bucketName: bucket.name, deleted: true });
    } catch (error) {
      console.error(`Error deleting bucket ${bucket.name}: ${error.message}`);
      results.push({ bucketName: bucket.name, error: error.message });
    }
  }

  return results;
}

// **File Operations**

// Upload a file to a bucket and return its URL
async function uploadFile(bucketName, filePath, fileName) {
  // Read the file from the file system
  const file = fs.readFileSync(filePath);

  // Determine the MIME type based on the file extension
  const extname = path.extname(fileName).toLowerCase();
  const isPdf = extname === '.pdf';

  if (isPdf) {
    // Upload the file to the specified bucket with a content type of PDF
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }
  } else {
    // Upload the file to the specified bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Error uploading file: ${error.message}`);
    }
  }

  // Generate a public URL for the uploaded file
  const { data: publicUrlData, error: urlError } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  if (urlError) {
    throw new Error(`Error retrieving public URL: ${urlError.message}`);
  }

  const bs = await getBucketSize(bucketName);

  return { pubUrl: publicUrlData.publicUrl, bucketSize: bs };
}

// Upload multiple files to a bucket
async function uploadMultipleFiles(bucketName, files) {
  const results = [];

  for (const file of files) {
    const filePath = file.path;
    const fileName = path.basename(filePath);

    try {
      const result = await uploadFile(bucketName, filePath, fileName);
      results.push({ fileName, ...result });
    } catch (error) {
      console.error(`Error uploading file ${fileName}: ${error.message}`);
      results.push({ fileName, error: error.message });
    }
  }

  return results;
}

// Delete a file from a bucket
async function deleteFile(bucketName, fileName) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove([fileName]); // Remove accepts an array of file names

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`);
  }

  const bs = await getBucketSize(bucketName);

  return { data: data, bucketSize: bs };
}

// Delete all files in a bucket
async function deleteAllFilesInBucket(bucketName) {
  // List all files in the bucket
  const { data: files, error: listError } = await supabase.storage.from(bucketName).list();

  if (listError) {
    throw new Error(`Error listing files: ${listError.message}`);
  }

  // Delete each file
  for (const file of files) {
    const { error: deleteError } = await supabase.storage.from(bucketName).remove([file.name]);

    if (deleteError) {
      console.error(`Error deleting file ${file.name}: ${deleteError.message}`);
    } else {
      console.log(`Successfully deleted file ${file.name}`);
    }
  }

  const bs = await getBucketSize(bucketName);

  return { bucketSize: bs };
}

// Utility function to format file sizes
function formatSize(sizeInBytes) {
  if (sizeInBytes < 1_000_000) {
    return `${(sizeInBytes / 1_000).toFixed(2)} KB`;
  } else if (sizeInBytes < 1_000_000_000) {
    return `${(sizeInBytes / 1_000_000).toFixed(2)} MB`;
  } else {
    return `${(sizeInBytes / 1_000_000_000).toFixed(2)} GB`;
  }
}

module.exports = {
  // Bucket Operations
  createBucket,
  updateBucket,
  deleteBucket,
  getBucketSize,
  getFileNumberInBucket,
  deleteAllBuckets,

  // File Operations
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteAllFilesInBucket,
};
