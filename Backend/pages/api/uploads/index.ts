import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { 
  successResponse, 
  errorResponse, 
  withMethods, 
  withErrorHandling, 
  validateBody,
  generateUniqueFileName
} from '@/utils/api-helpers';
import { uploadFileSchema } from '@/utils/validation';
import { supabase, supabaseAdmin, STORAGE_BUCKETS, getSignedUrl } from '@/lib/supabase';
import { z } from 'zod';

// POST /api/uploads - Generate signed upload URLs
async function generateUploadUrl(req: AuthenticatedRequest, res: NextApiResponse) {
  const bodyValidation = validateBody(uploadFileSchema.extend({
    folder: z.string().optional(),
  }))(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid upload request', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const { bucket, filename, contentType, folder } = bodyValidation.data;

  try {
    // Validate bucket name
    const allowedBuckets = Object.values(STORAGE_BUCKETS);
    if (!allowedBuckets.includes(bucket as any)) {
      return errorResponse(res, 'Invalid bucket name', 400);
    }

    // Validate file type
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];

    if (!allowedTypes.includes(contentType)) {
      return errorResponse(res, `File type ${contentType} not allowed`, 400);
    }

    // Generate unique filename
    const userFolder = req.user.id;
    const subFolder = folder || 'general';
    const uniqueFilename = generateUniqueFileName(filename);
    const fullPath = `${userFolder}/${subFolder}/${uniqueFilename}`;

    // Generate signed URL for upload
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(fullPath);

    if (error) {
      console.error('Error creating signed upload URL:', error);
      return errorResponse(res, 'Failed to create upload URL');
    }

    // Return upload URL and file information
    return successResponse(res, {
      upload_url: data.signedUrl,
      path: fullPath,
      bucket,
      filename: uniqueFilename,
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    }, 'Upload URL generated successfully');

  } catch (error) {
    console.error('Error in POST /api/uploads:', error);
    return errorResponse(res, 'Failed to generate upload URL');
  }
}

// DELETE /api/uploads - Delete uploaded files
async function deleteUploadedFiles(req: AuthenticatedRequest, res: NextApiResponse) {
  const bodyValidation = validateBody(z.object({
    files: z.array(z.object({
      bucket: z.string(),
      path: z.string(),
    })).min(1, 'At least one file is required'),
  }))(req);

  if (!bodyValidation.success) {
    return errorResponse(res, 'Invalid delete request', 422, 'VALIDATION_ERROR', bodyValidation.errors);
  }

  const { files } = bodyValidation.data;

  try {
    const results = [];

    for (const file of files) {
      // Validate bucket name
      const allowedBuckets = Object.values(STORAGE_BUCKETS);
      if (!allowedBuckets.includes(file.bucket as any)) {
        results.push({
          bucket: file.bucket,
          path: file.path,
          success: false,
          error: 'Invalid bucket name',
        });
        continue;
      }

      // Check if user owns the file (path should start with user ID)
      if (!file.path.startsWith(req.user.id) && req.user.role !== 'admin') {
        results.push({
          bucket: file.bucket,
          path: file.path,
          success: false,
          error: 'Access denied',
        });
        continue;
      }

      // Delete file
      const { error } = await supabaseAdmin.storage
        .from(file.bucket)
        .remove([file.path]);

      results.push({
        bucket: file.bucket,
        path: file.path,
        success: !error,
        error: error?.message || null,
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return successResponse(res, {
      results,
      summary: {
        total: files.length,
        success: successCount,
        failed: failCount,
      },
    }, `Deleted ${successCount} files successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);

  } catch (error) {
    console.error('Error in DELETE /api/uploads:', error);
    return errorResponse(res, 'Failed to delete files');
  }
}

// GET /api/uploads - Get signed URLs for existing files
async function getFileUrls(req: NextApiRequest & { user?: any }, res: NextApiResponse) {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 401);
  }

  const { bucket, paths, expires_in } = req.query;

  if (!bucket || !paths) {
    return errorResponse(res, 'bucket and paths query parameters are required', 400);
  }

  try {
    // Validate bucket name
    const allowedBuckets = Object.values(STORAGE_BUCKETS);
    if (!allowedBuckets.includes(bucket as any)) {
      return errorResponse(res, 'Invalid bucket name', 400);
    }

    const pathList = Array.isArray(paths) ? paths : [paths];
    const expiresIn = expires_in ? parseInt(expires_in as string) : 3600; // Default 1 hour

    const results = [];

    for (const path of pathList) {
      // Check if user owns the file or has admin access
      const canAccess = path.startsWith(req.user.id) || 
                       req.user.role === 'admin' ||
                       bucket === STORAGE_BUCKETS.FACILITY_IMAGES ||
                       bucket === STORAGE_BUCKETS.PRODUCT_IMAGES ||
                       bucket === STORAGE_BUCKETS.AVATARS;

      if (!canAccess) {
        results.push({
          path,
          success: false,
          error: 'Access denied',
          signed_url: null,
        });
        continue;
      }

      const signedUrl = await getSignedUrl(bucket as string, path as string, expiresIn);

      results.push({
        path,
        success: !!signedUrl,
        error: signedUrl ? null : 'Failed to generate signed URL',
        signed_url: signedUrl,
      });
    }

    const successCount = results.filter(r => r.success).length;

    return successResponse(res, {
      results,
      expires_in: expiresIn,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    }, `Generated ${successCount} signed URLs successfully`);

  } catch (error) {
    console.error('Error in GET /api/uploads:', error);
    return errorResponse(res, 'Failed to generate signed URLs');
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return requireAuth(generateUploadUrl)(req as AuthenticatedRequest, res);
  }

  if (req.method === 'DELETE') {
    return requireAuth(deleteUploadedFiles)(req as AuthenticatedRequest, res);
  }

  if (req.method === 'GET') {
    return requireAuth(getFileUrls)(req as AuthenticatedRequest, res);
  }

  return errorResponse(res, 'Method not allowed', 405);
}

export default withMethods(['GET', 'POST', 'DELETE'])(
  withErrorHandling(handler)
);
