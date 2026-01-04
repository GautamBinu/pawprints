'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  initialValues?: Partial<PetitionFormData>;
  submitLabel?: string;
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
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'indent',
  'link'
];

const formSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(150, 'Title must be less than 150 characters')
    .regex(/^[^<>]*$/, 'HTML not allowed in title'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .refine((val) => val !== '<p><br></p>' && val.trim() !== '', 'Description is required'),
  category: z.string().min(1, 'Please select a category'),
  targetSignatures: z.number(),
  expiresDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PetitionForm({ onSubmit, isSubmitting = false, initialValues, submitLabel = 'Create Petition' }: PetitionFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      category: initialValues?.category || '',
      targetSignatures: initialValues?.targetSignatures || 200,
      expiresDate: initialValues?.expiresDate || '',
    },
  });

  const handleSubmit = (values: FormValues) => {
    // Validate expiration date if provided
    if (values.expiresDate) {
      const expiryDate = new Date(values.expiresDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        form.setError('expiresDate', {
          type: 'manual',
          message: 'Expiration date must be in the future'
        });
        return;
      }
    }

    // Convert empty string expiresDate to undefined
    const submissionData: PetitionFormData = {
      ...values,
      expiresDate: values.expiresDate || undefined,
    };
    onSubmit(submissionData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 mx-auto">

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-700">
                Petition Title <span className="text-red-500">*</span>
              </FormLabel>
              <FormDescription>
                Make sure your title is action-oriented and preferably a one-line statement that summarizes your petition.
              </FormDescription>
              <FormControl>
                <Input
                  placeholder="Enter a clear and concise title for your petition"
                  disabled={isSubmitting}
                  className="h-12 text-lg"
                  {...field}
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormMessage />
                <span className="text-xs text-gray-500 ml-auto">
                  {field.value?.length || 0}/150
                </span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-700">
                Category <span className="text-red-500">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Tags will help others understand what the petition is about.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-700">
                Description <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className="bg-white rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <ReactQuill
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    modules={modules}
                    formats={formats}
                    placeholder="This is the explanation and reasoning behind your petition. Why should someone sign it? How will it improve the community?"
                    className="petition-editor min-h-[200px]"
                    readOnly={isSubmitting}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Minimum 50 characters. Be clear and specific about what you're asking for.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expiration Date (Optional) */}
        {/* <FormField
          control={form.control}
          name="expiresDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-700">
                Expiration Date <span className="text-gray-500 text-xs font-normal">(Optional)</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="date"
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Leave blank for no expiration, or set a deadline for signature collection
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        /> */}

        <div className="mt-16">
          <p>Use of this site falls under the <a href="https://www.rit.edu/policies/c082" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">RIT Code of Conduct for Computer and Network Use</a>.</p><br />
          <p>
            When using this service, you agree to sign petitions from only one RIT Computer Account.
            Should you have access to more than one account, you will only sign from your primary student, faculty, or staff account.
          </p><br />  
          <p className="font-bold">Please exercise good judgment when using this service.</p>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
            className="h-12 px-6"
          >
            Clear Form
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
