'use client';

import { useState } from 'react';
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';

export interface PetitionFormData {
  title: string;
  description: string;
  category: string;
  targetSignatures: number;
  expiresDate?: string;
}

interface PetitionFormProps {
  onSubmit: (data: PetitionFormData) => void;
  isSubmitting?: boolean;
}

const categories = [
  'Academic Affairs',
  'Campus Life',
  'Facilities',
  'Student Services',
  'Dining',
  'Housing',
  'Sustainability',
  'Parking & Transportation',
  'Technology',
  'Health & Wellness',
  'Other'
];

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'indent',
  'link'
];

export default function PetitionForm({ onSubmit, isSubmitting = false }: PetitionFormProps) {
  const [formData, setFormData] = useState<PetitionFormData>({
    title: '',
    description: '',
    category: '',
    targetSignatures: 200, // Fixed value
    expiresDate: undefined
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PetitionFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PetitionFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 150) {
      newErrors.title = 'Title must be less than 150 characters';
    }

    if (!formData.description.trim() || formData.description === '<p><br></p>') {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Target signatures is fixed at 200, no validation needed

    if (formData.expiresDate) {
      const expiryDate = new Date(formData.expiresDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        newErrors.expiresDate = 'Expiration date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleDescriptionChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }));
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Title Input */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
          Petition Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, title: e.target.value }));
            if (errors.title) {
              setErrors(prev => ({ ...prev, title: undefined }));
            }
          }}
          className={`w-full px-4 py-3 border ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
          placeholder="Enter a clear and concise title for your petition"
          maxLength={150}
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.title && (
            <span className="text-red-500 text-sm">{errors.title}</span>
          )}
          <span className="text-gray-500 text-sm ml-auto">
            {formData.title.length}/150
          </span>
        </div>
      </div>

      {/* Category Selection */}
      <div className="mb-6">
        <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, category: e.target.value }));
            if (errors.category) {
              setErrors(prev => ({ ...prev, category: undefined }));
            }
          }}
          className={`w-full px-4 py-3 border ${
            errors.category ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white`}
          disabled={isSubmitting}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <span className="text-red-500 text-sm mt-1 block">{errors.category}</span>
        )}
      </div>

      {/* Description Editor */}
      <div className="mb-6">
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <div className={`bg-white rounded-lg border ${
          errors.description ? 'border-red-500' : 'border-gray-300'
        } overflow-hidden`}>
          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={handleDescriptionChange}
            modules={modules}
            formats={formats}
            placeholder="Provide a detailed description of your petition. Explain what you want to change and why it matters..."
            className="petition-editor"
            readOnly={isSubmitting}
          />
        </div>
        {errors.description && (
          <span className="text-red-500 text-sm mt-1 block">{errors.description}</span>
        )}
        <p className="text-gray-500 text-sm mt-2">
          Minimum 50 characters. Be clear and specific about what you're asking for.
        </p>
      </div>

      {/* Expiration Date (Optional) */}
      <div className="mb-6">
        <label htmlFor="expiresDate" className="block text-sm font-semibold text-gray-700 mb-2">
          Expiration Date <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        <input
          type="date"
          id="expiresDate"
          value={formData.expiresDate || ''}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, expiresDate: e.target.value || undefined }));
            if (errors.expiresDate) {
              setErrors(prev => ({ ...prev, expiresDate: undefined }));
            }
          }}
          className={`w-full px-4 py-3 border ${
            errors.expiresDate ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
          min={new Date().toISOString().split('T')[0]}
          disabled={isSubmitting}
        />
        {errors.expiresDate && (
          <span className="text-red-500 text-sm mt-1 block">{errors.expiresDate}</span>
        )}
        <p className="text-gray-500 text-sm mt-2">
          Leave blank for no expiration, or set a deadline for signature collection
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => {
            setFormData({ title: '', description: '', category: '', targetSignatures: 200, expiresDate: undefined });
            setErrors({});
          }}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          Clear Form
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            'Create Petition'
          )}
        </button>
      </div>
    </form>
  );
}
