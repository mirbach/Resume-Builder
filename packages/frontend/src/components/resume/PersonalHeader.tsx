import type { ResolvedPersonalInfo, ResumeTheme } from '../../lib/types';
import { Mail, Phone, MapPin, Briefcase, GitFork, Globe } from 'lucide-react';
import { useAuthedImageSrc } from '../../lib/useAuthedImageSrc';

interface Props {
  data: ResolvedPersonalInfo;
  theme: ResumeTheme;
}

export default function PersonalHeader({ data, theme }: Props) {
  const showPhoto = theme.layout.showPhoto && data.photo;
  const photoSrc = useAuthedImageSrc(data.photo);
  const logoSrc = useAuthedImageSrc(theme.logo);

  return (
    <div
      className="pb-4 mb-4 border-b-2"
      style={{ borderColor: theme.colors.primary }}
    >
      <div className="flex items-start gap-5">
        {showPhoto && photoSrc && (
          <img
            src={photoSrc}
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
          {theme.companyName && (
            <p
              className="text-sm font-semibold mt-0.5"
              style={{ color: theme.colors.secondary }}
            >
              {theme.companyName}
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm" style={{ color: theme.colors.secondary }}>
            {theme.companyEmail && (
              <span className="flex items-center gap-1">
                <Mail size={14} /> {theme.companyEmail}
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
            {data.github && (
              <a
                href={data.github.startsWith('http') ? data.github : `https://${data.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ color: theme.colors.secondary }}
              >
                <GitFork size={14} /> {data.github}
              </a>
            )}
            {data.linkedin && (
              <a
                href={data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ color: theme.colors.secondary }}
              >
                <Briefcase size={14} /> {data.linkedin}
              </a>
            )}
            {data.website && (
              <a
                href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ color: theme.colors.secondary }}
              >
                <Globe size={14} /> {data.website}
              </a>
            )}
            {theme.companyWebsite && (
              <a
                href={theme.companyWebsite.startsWith('http') ? theme.companyWebsite : `https://${theme.companyWebsite}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ color: theme.colors.secondary }}
              >
                <Globe size={14} /> {theme.companyWebsite}
              </a>
            )}
          </div>
        </div>
        {theme.logo && logoSrc && (
          <div className="flex flex-col items-end shrink-0 gap-1 min-w-[80px]">
            <img
              src={logoSrc}
              alt={theme.companyName || 'Company logo'}
              className="h-12 w-auto object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
