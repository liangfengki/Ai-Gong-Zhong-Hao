import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Unsplash 搜索（有 API Key 走官方 API，否则用 Lorem Picsum 兜底）
router.get('/unsplash/search', async (req, res) => {
  try {
    const { query, page = 1, per_page = 20, orientation } = req.query;
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      const encodedQuery = encodeURIComponent(query || 'nature');
      const images = Array.from({ length: parseInt(per_page, 10) || 20 }, (_, i) => ({
        id: `picsum-${page}-${i}`,
        url: `https://picsum.photos/seed/${encodedQuery}-${page}-${i}/800/600`,
        thumbUrl: `https://picsum.photos/seed/${encodedQuery}-${page}-${i}/200/150`,
        alt: `${query} ${i + 1}`,
        author: 'Lorem Picsum',
        source: 'unsplash',
        downloadUrl: `https://picsum.photos/seed/${encodedQuery}-${page}-${i}/1920/1080`,
      }));
      return res.json({ results: images });
    }

    const { data } = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, page, per_page, orientation },
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
    res.json(data);
  } catch (error) {
    console.error('Unsplash搜索失败:', error.message);
    res.json({ results: [] });
  }
});

// Pexels 搜索
router.get('/pexels/search', async (req, res) => {
  try {
    const { query, page = 1, per_page = 20, orientation } = req.query;
    const apiKey = process.env.PEXELS_API_KEY;

    if (!apiKey) {
      const encodedQuery = encodeURIComponent(query || 'nature');
      const images = Array.from({ length: parseInt(per_page, 10) || 20 }, (_, i) => ({
        id: `picsum-pexels-${page}-${i}`,
        src: {
          original: `https://picsum.photos/seed/pexels-${encodedQuery}-${page}-${i}/1920/1080`,
          large: `https://picsum.photos/seed/pexels-${encodedQuery}-${page}-${i}/800/600`,
          medium: `https://picsum.photos/seed/pexels-${encodedQuery}-${page}-${i}/200/150`,
        },
        alt: `${query} ${i + 1}`,
        photographer: 'Lorem Picsum',
      }));
      return res.json({ photos: images });
    }

    const { data } = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, page, per_page, orientation },
      headers: { Authorization: apiKey },
    });
    res.json(data);
  } catch (error) {
    console.error('Pexels搜索失败:', error.message);
    res.json({ photos: [] });
  }
});

// Pixabay 搜索
router.get('/pixabay/search', async (req, res) => {
  try {
    const { q, page = 1, per_page = 20 } = req.query;
    const apiKey = process.env.PIXABAY_API_KEY;

    if (!apiKey) {
      const encodedQuery = encodeURIComponent(q || 'nature');
      const images = Array.from({ length: parseInt(per_page, 10) || 20 }, (_, i) => ({
        id: `picsum-pixabay-${page}-${i}`,
        largeImageURL: `https://picsum.photos/seed/pixabay-${encodedQuery}-${page}-${i}/800/600`,
        previewURL: `https://picsum.photos/seed/pixabay-${encodedQuery}-${page}-${i}/200/150`,
        tags: `${q} ${i + 1}`,
        user: 'Lorem Picsum',
      }));
      return res.json({ hits: images });
    }

    const { data } = await axios.get('https://pixabay.com/api/', {
      params: { key: apiKey, q, page, per_page, image_type: 'photo' },
    });
    res.json(data);
  } catch (error) {
    console.error('Pixabay搜索失败:', error.message);
    res.json({ hits: [] });
  }
});

export default router;
