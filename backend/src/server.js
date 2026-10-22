require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const cors = require('cors');
const express = require('express');
const multer = require('multer');

const unlink = promisify(fs.unlink);
const app = express();
const port = Number(process.env.PORT || 4000);
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 10);
const uploadsDirectory = path.resolve(__dirname, '..', 'uploads');

fs.mkdirSync(uploadsDirectory, { recursive: true });

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const storage = multer.diskStorage({
  destination: uploadsDirectory,
  filename: (_request, _file, callback) => {
    callback(null, `${crypto.randomUUID()}.csv`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: maxUploadMb * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return callback(new ApiError(415, 'NOT_CSV', 'Only CSV files are accepted.'));
    }
    callback(null, true);
  }
});

app.use(cors({ origin: 'http://localhost:5173' }));

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filePath);

    input.on('error', reject);
    input.on('data', (chunk) => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

// M1 implementation of the contract's dataset-upload endpoint.
// Registration, quality analysis, versioning, and ledger calls are added in M3.
app.post('/api/datasets', upload.single('file'), async (request, response, next) => {
  try {
    if (!request.file) {
      throw new ApiError(400, 'NO_FILE', 'Provide a CSV file in the "file" field.');
    }

    if (request.file.size === 0) {
      await unlink(request.file.path);
      throw new ApiError(400, 'EMPTY_FILE', 'The CSV file must not be empty.');
    }

    const sha256 = await sha256File(request.file.path);
    response.status(201).json({
      fileName: request.file.filename,
      sizeBytes: request.file.size,
      sha256
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return response.status(413).json({
      error: { code: 'FILE_TOO_LARGE', message: `File must be ${maxUploadMb} MB or smaller.` }
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.status).json({
      error: { code: error.code, message: error.message }
    });
  }

  console.error('Unhandled request error:', error.message);
  response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }
  });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
