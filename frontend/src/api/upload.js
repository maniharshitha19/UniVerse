import { API_URL } from '../config';
import { getAuthToken } from './client';

// Uploads one photo from the phone to the backend (which stores it on Cloudinary)
// and returns its public web address. folder: posts, marketplace, avatars or misc.
export async function uploadImage(uri, folder = 'misc') {
  const name = uri.split('/').pop() || 'photo.jpg';
  const ext = (/\.(\w+)$/.exec(name)?.[1] ?? 'jpg').toLowerCase();
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';

  const form = new FormData();
  form.append('image', { uri, name, type });
  form.append('folder', folder);

  const response = await fetch(`${API_URL}/api/uploads/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: form,
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof json?.error === 'string' ? json.error : json?.error?.message ?? json?.message;
    throw new Error(
      message ||
        'Photo upload failed. The backend needs Cloudinary keys in its .env file to store photos.'
    );
  }
  const data = json?.data ?? json;
  if (!data?.url) throw new Error('The server did not return a photo address.');
  return data.url;
}
