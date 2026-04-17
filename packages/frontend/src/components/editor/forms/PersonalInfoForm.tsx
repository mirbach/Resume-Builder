import type { PersonalInfo } from '../../../lib/types';
import { uploadFile } from '../../../lib/api';
import BilingualField from '../BilingualField';
import { Upload, X } from 'lucide-react';

interface Props {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

export default function PersonalInfoForm({ data, onChange }: Props) {
  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file, 'photo');
    onChange({ ...data, photo: result.path });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

      {/* Photo upload */}
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {data.photo ? (
            <div className="relative">
              <img
                src={data.photo}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
              />
              <button
                onClick={() => onChange({ ...data, photo: undefined })}
                aria-label="Remove photo"
                className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white p-0.5 hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
              <Upload size={20} className="text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Photo</span>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className={inputClasses}
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              placeholder="Max Mustermann"
            />
          </div>
          <BilingualField
            label="Job Title"
            value={data.title}
            onChange={(title) => onChange({ ...data, title })}
            placeholder={{ en: 'Senior Software Engineer', de: 'Senior Softwareentwickler' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          type="tel"
          className={inputClasses}
          value={data.phone}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          placeholder="+49 170 1234567"
        />
      </div>

      <BilingualField
        label="Location"
        value={data.location}
        onChange={(location) => onChange({ ...data, location })}
        placeholder={{ en: 'Munich, Germany', de: 'München, Deutschland' }}
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
          <input
            type="text"
            className={inputClasses}
            value={data.linkedin || ''}
            onChange={(e) => onChange({ ...data, linkedin: e.target.value || undefined })}
            placeholder="linkedin.com/in/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">GitHub</label>
          <input
            type="text"
            className={inputClasses}
            value={data.github || ''}
            onChange={(e) => onChange({ ...data, github: e.target.value || undefined })}
            placeholder="github.com/..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input
            type="text"
            className={inputClasses}
            value={data.website || ''}
            onChange={(e) => onChange({ ...data, website: e.target.value || undefined })}
            placeholder="yoursite.dev"
          />
        </div>
      </div>
    </div>
  );
}
