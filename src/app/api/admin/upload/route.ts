import { NextResponse } from 'next/server';
import { checkIsAdmin } from '@/lib/admin';
import { getPresignedUploadUrl } from '@/lib/r2/upload';

export async function POST(request: Request) {
  try {
    // 1. Authorize Admin
    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request parameters
    const { type, storySlug, episodeNumber, filename, contentType } = await request.json();

    if (!storySlug || !filename || !contentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Clean up filename and get extension
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    // 3. Construct R2 Storage Key (Path)
    let key = '';
    if (type === 'cover') {
      key = `stories/${storySlug}/cover-${Date.now()}-${cleanFilename}`;
    } else if (type === 'panel') {
      if (episodeNumber === undefined) {
        return NextResponse.json({ error: 'Episode number is required for panel uploads' }, { status: 400 });
      }
      key = `stories/${storySlug}/episodes/${episodeNumber}/panel-${Date.now()}-${cleanFilename}`;
    } else {
      key = `stories/${storySlug}/misc/${cleanFilename}`;
    }

    // 4. Generate Presigned URL
    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    // 5. Build Public CDN URL
    const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
    const cdnUrl = `${cdnBaseUrl}/${key}`;

    return NextResponse.json({
      uploadUrl,
      key,
      cdnUrl,
    });
  } catch (error) {
    console.error('Presigned upload error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
