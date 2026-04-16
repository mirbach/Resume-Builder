import { useState } from 'react';
import type { ResumeData } from '../../lib/types';
import PersonalInfoForm from './forms/PersonalInfoForm';
import SummaryForm from './forms/SummaryForm';
import ExperienceForm from './forms/ExperienceForm';
import EducationForm from './forms/EducationForm';
import SkillsForm from './forms/SkillsForm';
import CertificationsForm from './forms/CertificationsForm';
import LanguagesForm from './forms/LanguagesForm';
import ProjectsForm from './forms/ProjectsForm';
import ProductsForm from './forms/ProductsForm';
import ReferencesForm from './forms/ReferencesForm';
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  Globe,
  FolderOpen,
  Package,
  Users,
} from 'lucide-react';

const TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'certifications', label: 'Certs', icon: Award },
  { id: 'languages', label: 'Languages', icon: Globe },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'references', label: 'References', icon: Users },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export default function ResumeEditor({ data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('personal');

  function renderForm() {
    switch (activeTab) {
      case 'personal':
        return (
          <PersonalInfoForm
            data={data.personal}
            onChange={(personal) => onChange({ ...data, personal })}
          />
        );
      case 'summary':
        return (
          <SummaryForm
            data={data.summary}
            onChange={(summary) => onChange({ ...data, summary })}
          />
        );
      case 'experience':
        return (
          <ExperienceForm
            data={data.experience}
            onChange={(experience) => onChange({ ...data, experience })}
          />
        );
      case 'education':
        return (
          <EducationForm
            data={data.education}
            onChange={(education) => onChange({ ...data, education })}
          />
        );
      case 'skills':
        return (
          <SkillsForm
            data={data.skills}
            onChange={(skills) => onChange({ ...data, skills })}
          />
        );
      case 'certifications':
        return (
          <CertificationsForm
            data={data.certifications}
            onChange={(certifications) => onChange({ ...data, certifications })}
          />
        );
      case 'languages':
        return (
          <LanguagesForm
            data={data.languages}
            onChange={(languages) => onChange({ ...data, languages })}
          />
        );
      case 'projects':
        return (
          <ProjectsForm
            data={data.projects}
            onChange={(projects) => onChange({ ...data, projects })}
          />
        );
      case 'products':
        return (
          <ProductsForm
            data={data.products}
            onChange={(products) => onChange({ ...data, products })}
          />
        );
      case 'references':
        return (
          <ReferencesForm
            data={data.references}
            onChange={(references) => onChange({ ...data, references })}
          />
        );
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form content */}
      <div className="editor-form flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">{renderForm()}</div>
    </div>
  );
}
