import type { ResolvedPersonalInfo, ResumeTheme } from '../../lib/types';
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react';

interface Props {
  data: ResolvedPersonalInfo;
  theme: ResumeTheme;
}

export default function PersonalHeader({ data, theme }: Props) {
  const showPhoto = theme.layout.showPhoto && data.photo;

  return (
    <div
      className="pb-4 mb-4 border-b-2"
      style={{ borderColor: theme.colors.primary }}
    >
      <div className="flex items-start gap-5">
        {showPhoto && (
          <img
            src={data.photo}
            alt={data.name}
            className="h-24 w-24 rounded-full object-cover border-2 shrink-0"
            style={{ borderColor: theme.colors.primary }}
          />
        )}
        <div className="flex-1">
          <h1
            className="text-3xl font-bold"
            style={{ color: theme.colors.heading, fontFamily: theme.fonts.heading }}
          >
            {data.name}
          </h1>
          <p
            className="text-xl mt-1"
            style={{ color: theme.colors.primary, fontFamily: theme.fonts.body }}
          >
            {data.title}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm" style={{ color: theme.colors.secondary }}>
            {data.email && (
              <span className="flex items-center gap-1">
                <Mail size={14} /> {data.email}
              </span>
            )}
            {data.phone && (
              <span className="flex items-center gap-1">
                <Phone size={14} /> {data.phone}
              </span>
            )}
            {data.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {data.location}
              </span>
            )}
            {data.linkedin && (
              <span className="flex items-center gap-1">
                <Linkedin size={14} /> {data.linkedin}
              </span>
            )}
            {data.github && (
              <span className="flex items-center gap-1">
                <Github size={14} /> {data.github}
              </span>
            )}
            {data.website && (
              <span className="flex items-center gap-1">
                <Globe size={14} /> {data.website}
              </span>
            )}
          </div>
        </div>
        {(theme.logo || theme.companyName) && (
          <div className="flex flex-col items-end shrink-0 gap-1 min-w-[80px]">
            {theme.logo && (
              <img
                src={theme.logo}
                alt={theme.companyName || 'Company logo'}
                className="h-12 w-auto object-contain"
              />
            )}
            {theme.companyName && (
              <span
                className="text-xs font-semibold text-right leading-tight"
                style={{ color: theme.colors.secondary }}
              >
                {theme.companyName}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
