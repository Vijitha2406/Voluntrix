import React, { useState } from 'react';

export default function CreateEventModal({ isOpen, onClose, onSuccess, showToast }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    capacity: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
  const token = typeof window !== 'undefined' ? localStorage.getItem('voluntrix_token') : null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image size should be less than 5MB', 'error');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('event-image');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      showToast('Please login to create an event', 'error');
      return;
    }

    // Validation
    if (!formData.title.trim() || !formData.description.trim() || 
        !formData.date || !formData.location.trim() || !formData.capacity) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate date is in future
    const selectedDate = new Date(formData.date);
    const now = new Date();
    if (selectedDate <= now) {
      showToast('Event date must be in the future', 'error');
      return;
    }

    // Validate capacity
    const capacity = parseInt(formData.capacity);
    if (capacity <= 0 || capacity > 10000) {
      showToast('Capacity must be between 1 and 10,000', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert image to base64 if present
      let imageData = null;
      if (imageFile) {
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(imageFile);
        });
      }

      const eventData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        // Convert simple location string to object format expected by backend
        location: {
          address: formData.location,
          isRemote: formData.location.toLowerCase().includes('remote') || formData.location.toLowerCase().includes('online')
        },
        image: imageData
      };

      const res = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Event created successfully!', 'success');
        // Reset form
        setFormData({
          title: '',
          description: '',
          date: '',
          location: '',
          capacity: ''
        });
        setImageFile(null);
        setImagePreview(null);
        
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(data.message || 'Failed to create event', 'error');
      }
    } catch (err) {
      console.error('Create event error:', err);
      showToast('Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Event</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="create-event-form">
          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter event title"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your event"
              rows="4"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date & Time *</label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacity">Capacity *</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="Max participants"
                min="1"
                max="10000"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter event location"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-image">Event Poster/Image</label>
            <div className="image-upload-section">
              {!imagePreview ? (
                <div className="image-upload-placeholder">
                  <input
                    type="file"
                    id="event-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="event-image" className="image-upload-label">
                    <div className="upload-icon">📷</div>
                    <span>Click to upload event poster</span>
                    <small>(PNG, JPG, GIF up to 5MB)</small>
                  </label>
                </div>
              ) : (
                <div className="image-preview">
                  <img src={imagePreview} alt="Event preview" />
                  <button type="button" className="remove-image" onClick={removeImage}>
                    <span>&times;</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}