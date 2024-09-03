const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Create a new bucket
async function createBucket(bucketName) {
  const { data, error } = await supabase.storage.createBucket(bucketName,{
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
  

// Upload a file to a bucket and return its URL
async function uploadFile(bucketName, filePath, fileName) {
    // Read the file from the file system
    const file = fs.readFileSync(filePath);

    // Determine the MIME type based on the file extension
    const extname = path.extname(fileName).toLowerCase();
    const isPdf = extname === '.pdf';

    if(isPdf){
        // Upload the file to the specified bucket
        const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf'
        });

        if (error) {
            throw new Error(`Error uploading file: ${error.message}`);
        }
    }else{
  
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

    const bs = await getBucketSize(bucketName)
  
    return {pubUrl: publicUrlData.publicUrl, bucketSize: bs};
  }
    // Delete a file from a bucket
    async function deleteFile(bucketName, fileName) {
        const { data, error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]); // Remove accepts an array of file names
    
        if (error) {
        throw new Error(`Error deleting file: ${error.message}`);
        }
    
        const bs = await getBucketSize(bucketName)
  
        return {data: data, bucketSize: bs};
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
        const bs = await getBucketSize(bucketName)
  
        return {bucketSize: bs};
    }

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
  createBucket,
  updateBucket,
  deleteBucket,
  getBucketSize,
  getFileNumberInBucket,
  uploadFile,
  deleteFile,
  deleteAllFilesInBucket
};
