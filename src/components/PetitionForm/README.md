# PetitionForm Component

A clean and aesthetic form component for creating new petitions with Quill.js rich text editor.

## Features

- ✅ Title input with character counter (10-150 characters)
- ✅ Category dropdown with predefined options
- ✅ Rich text editor (Quill.js) for detailed descriptions
- ✅ Target signatures input (1-100,000)
- ✅ Optional expiration date picker
- ✅ Form validation with error messages
- ✅ Loading state during submission
- ✅ Clear form functionality
- ✅ Responsive design
- ✅ Orange-themed to match RIT branding

## Usage

```tsx
import PetitionForm from '@/components/PetitionForm/PetitionForm';
import { useAuth } from '@/app/auth/AuthContext';

function MyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (data: PetitionFormData) => {
    setIsSubmitting(true);
    try {
      const petitionData: Omit<Petition, 'id'> = {
        ...data,
        author: user?.displayName || 'Anonymous',
        createdDate: new Date().toISOString(),
        currentSignatures: 0,
        status: 'active',
        timePosted: new Date().toLocaleTimeString(),
        updates: []
      };
      
      // Send to Firestore
      await addDoc(collection(db, 'petitions'), petitionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return <PetitionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
}
```

## Props

- `onSubmit`: (data: PetitionFormData) => void - Callback function when form is submitted with valid data
- `isSubmitting`: boolean (optional) - Shows loading state when true

## Form Data Structure

```typescript
export interface PetitionFormData {
  title: string;              // 10-150 characters
  description: string;         // Minimum 50 characters (HTML from Quill)
  category: string;           // One of the predefined categories
  targetSignatures: number;   // 1-100,000
  expiresDate?: string;       // Optional ISO date string
}
```

## Complete Petition Object

The form data can be combined with user info to create a complete `Petition` object:

```typescript
const petitionData: Omit<Petition, 'id'> = {
  title: data.title,
  description: data.description,
  author: user?.displayName || 'Anonymous',
  createdDate: new Date().toISOString(),
  currentSignatures: 0,
  targetSignatures: data.targetSignatures,
  category: data.category,
  status: 'active',
  timePosted: new Date().toLocaleTimeString(),
  expiresDate: data.expiresDate,
  updates: []
};
```

## Categories

- Academic Affairs
- Campus Life
- Facilities
- Student Services
- Dining
- Housing
- Sustainability
- Parking & Transportation
- Technology
- Health & Wellness
- Other

## Validation Rules

- **Title**: Required, 10-150 characters
- **Description**: Required, minimum 50 characters
- **Category**: Required, must select from dropdown
- **Target Signatures**: Required, 1-100,000
- **Expiration Date**: Optional, must be in the future if provided

## Rich Text Editor Features

The Quill editor includes:
- Headers (H1, H2, H3)
- Bold, Italic, Underline, Strikethrough
- Ordered and Unordered lists
- Text indentation
- Links
- Clean formatting option

## Styling

Custom styles are applied in `globals.css` with the `.petition-editor` class to match the RIT orange theme (#f97316).
