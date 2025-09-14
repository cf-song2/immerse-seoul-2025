import React, { useState, useEffect, useCallback } from 'react';
import { Image, Globe, Lock, Loader2, Trash2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

export default function ImageGallery({ viewMode = 'my' }) {
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  function renderImage(image, blobVal, hasImg) {
    if (hasImg) {
      return (
        <img
          src={blobVal}
          alt={image.prompt || ''}
          className="w-full h-full object-cover"
          loading="lazy"
          style={{ background: 'transparent' }}
        />
      );
    }
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ minHeight: 200, background: '#eee' }}
      >
        <span style={{ color: 'red', fontSize: 14 }}>
          이미지 없음/실패
        </span>
      </div>
    );
  }
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBlobs, setImageBlobs] = useState({});

  const handleDeleteImage = async (imageId, e) => {
    e.stopPropagation(); // Prevent opening the image modal
    setDeletingImageId(imageId);
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      await api.deleteImage(imageId);
      // Remove the deleted image from the state
      setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      // Also remove from imageBlobs
      setImageBlobs(prevBlobs => {
        const newBlobs = {...prevBlobs};
        delete newBlobs[imageId];
        return newBlobs;
      });
    } catch (error) {
      console.error('Failed to delete image:', error);
      setDeleteError(error.message || 'Failed to delete image');
    } finally {
      setIsDeleting(false);
      setDeletingImageId(null);
    }
  };
  
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (viewMode === 'public') {
        data = await api.getPublicImages();
      } else if (user) {
        data = await api.getUserImages();
      } else {
        data = { images: [] };
      }
      setImages(data.images || []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, user]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const fetchImageBlobUrl = useCallback(
    async (image) => {
      try {
        const url = api.getImageUrl(image.id);
        const headers = user?.token
          ? { Authorization: `Bearer ${user.token}` }
          : {};

        const res = await fetch(url, { headers });
        const ct = res.headers.get('content-type');
        if (!res.ok || !ct || !ct.startsWith('image/')) return '';
        const blob = await res.blob();
        if (!blob || !blob.size) return '';
        return URL.createObjectURL(blob);
      } catch {
        return '';
      }
    },
    [user]
  );

  useEffect(() => {
    let isMounted = true;
    const loadBlobs = async () => {
      if (images.length > 0) {
        const blobs = {};
        for (const image of images) {
          blobs[image.id] = await fetchImageBlobUrl(image);
        }
        if (isMounted) setImageBlobs(blobs);
      } else {
        setImageBlobs({});
      }
    };
    loadBlobs();
    return () => {
      isMounted = false;
    };
  }, [images, fetchImageBlobUrl]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
      </div>
    );
  }

  if (!user && viewMode === 'my') {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <Lock className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-gray-500">Please login to view your images</p>
      </div>
    );
  }

  if (deleteError) {
    return (
      <div className="text-center py-6 bg-white rounded-lg mb-4">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 text-red-500">{deleteError}</p>
        <button 
          onClick={() => setDeleteError('')}
          className="mt-2 px-4 py-1 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
        >
          Dismiss
        </button>
      </div>
    );
  }
  
  if (images.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <Image className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-gray-500">No images found</p>
      </div>
    );
  }

  // ==========================

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => {
          const blobVal = imageBlobs[image.id];
          const hasImg = typeof blobVal === 'string' && !!blobVal;
          return (
            <div
              key={image.id}
              onClick={() => setSelectedImage(image)}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
            >
              <div className="aspect-square relative">
                {renderImage(image, blobVal, hasImg)}
                <div className="absolute top-2 right-2 flex space-x-2">
                  {image.is_public ? (
                    <div className="p-1 bg-blue-500 bg-opacity-70 rounded-full">
                      <Globe className="w-4 h-4 text-white drop-shadow-lg" />
                    </div>
                  ) : (
                    <div className="p-1 bg-gray-500 bg-opacity-70 rounded-full">
                      <Shield className="w-4 h-4 text-white drop-shadow-lg" />
                    </div>
                  )}
                  {viewMode === 'my' && (
                    <button 
                      onClick={(e) => handleDeleteImage(image.id, e)}
                      className="p-1 bg-red-500 bg-opacity-70 hover:bg-opacity-100 rounded-full transition-all"
                      disabled={isDeleting && deletingImageId === image.id}
                    >
                      {isDeleting && deletingImageId === image.id ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-700 line-clamp-2">{image.prompt ? image.prompt : ''}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {image.created_at ? new Date(image.created_at).toLocaleDateString() : ''}
                  </p>
                  {viewMode === 'public' && image.username && !!image.username && (
                    <p className="text-xs text-gray-500">{image.username ? `by ${image.username}` : ''}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4">
              {typeof imageBlobs[selectedImage.id] === 'string' && !!imageBlobs[selectedImage.id] ? (
                <img
                  src={imageBlobs[selectedImage.id]}
                  alt={selectedImage.prompt}
                  className="w-full h-auto rounded"
                  style={{ background: 'transparent' }}
                />
              ) : (
                <div
                  className="w-full h-64 flex items-center justify-center"
                  style={{ background: '#eee' }}
                >
                  <span style={{ color: 'red', fontSize: 14 }}>
                    이미지 없음/실패
                  </span>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <div>
                  <p className="font-semibold">Prompt:</p>
                  <p className="text-sm text-gray-600">{selectedImage.prompt}</p>
                </div>
                {selectedImage.negative_prompt && (
                  <div>
                    <p className="font-semibold mt-2">Negative Prompt:</p>
                    <p className="text-sm text-gray-600">{selectedImage.negative_prompt}</p>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4">
                  {selectedImage.width > 0 && selectedImage.height > 0 && (
                    <span className="text-sm text-gray-500">
                      {selectedImage.width} × {selectedImage.height}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {new Date(selectedImage.created_at).toLocaleString()}
                  </span>
                </div>
                {viewMode === 'public' && selectedImage.username && (
                  <p className="text-sm text-gray-500 text-right">
                    Created by {selectedImage.username}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
