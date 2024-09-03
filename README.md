Sure! Here’s a detailed `README.md` for your project, covering the Supabase operations and the Express server setup:

```markdown
# Supabase Bucket Management API

This project provides an API for managing Supabase storage buckets using Express.js. The API includes functionality to create, update, delete buckets, and manage files within those buckets.

## Prerequisites

- Node.js (version 14 or higher)
- Supabase account and project
- `.env` file with Supabase credentials

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create a `.env` file:**

   Copy `.env.example` to `.env` and replace the placeholders with your Supabase project credentials.

   ```env
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_KEY=<your-supabase-key>
   PORT=3000
   ```

4. **Create an uploads directory:**

   Make sure to create the directory for temporary file uploads.

   ```bash
   mkdir uploads_temp
   ```

## API Endpoints

### Bucket Operations

- **Create a Bucket**

  ```http
  POST /bucket
  ```

  **Request Body:**

  ```json
  {
    "bucketName": "example-bucket"
  }
  ```

  **Response:**

  ```json
  {
    "message": "Bucket created successfully",
    "data": { ... }
  }
  ```

- **Update a Bucket**

  ```http
  PUT /bucket/:bucketName
  ```

  **Request Body:**

  ```json
  {
    "public": true
  }
  ```

  **Response:**

  ```json
  {
    "message": "Bucket updated successfully",
    "data": { ... }
  }
  ```

- **Delete a Bucket**

  ```http
  DELETE /bucket/:bucketName
  ```

  **Response:**

  ```json
  {
    "message": "Bucket deleted successfully",
    "data": { ... }
  }
  ```

### File Operations

- **Get Bucket Size**

  ```http
  GET /bucket/:bucketName/size
  ```

  **Response:**

  ```json
  {
    "message": "Bucket size retrieved successfully",
    "size": "10.00 MB"
  }
  ```

- **Get Number of Files in a Bucket**

  ```http
  GET /bucket/:bucketName/file-number
  ```

  **Response:**

  ```json
  {
    "message": "Files in Bucket retrieved successfully",
    "nb_file": 123
  }
  ```

- **Upload a File**

  ```http
  POST /bucket/:bucketName/upload
  ```

  **Form Data:**

  - `file`: The file to upload

  **Response:**

  ```json
  {
    "message": "File uploaded successfully",
    "data": {
      "pubUrl": "https://your-supabase-url/storage/v1/object/public/example-bucket/file-name",
      "bucketSize": "10.00 MB"
    }
  }
  ```

- **Delete a File**

  ```http
  DELETE /bucket/:bucketName/delete/:fileName
  ```

  **Response:**

  ```json
  {
    "message": "File deleted successfully",
    "data": { ... }
  }
  ```

- **Delete All Files in a Bucket**

  ```http
  DELETE /bucket/:bucketName/deleteAll
  ```

  **Response:**

  ```json
  {
    "message": "Files deleted successfully",
    "bucketSize": "0.00 MB"
  }
  ```

## Running the Server

To start the server, run:

```bash
npm start
```

The server will listen on the port specified in the `.env` file or default to port 3000.

## Error Handling

All endpoints return appropriate HTTP status codes and error messages. Ensure to handle these errors in your client application.

## License

This project is licensed under the MIT License.

## Contributing

Feel free to open issues or submit pull requests. Contributions are welcome!