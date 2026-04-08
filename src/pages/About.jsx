import './About.css';
import { useSiteContent } from '../context/SiteContentContext';

export default function About() {
  const { content } = useSiteContent();

  return (
    <main className="about-page">
      <div className="about-container">
        <h1>{content.about.title}</h1>

        <img
          src="/images/photographer.jpeg"
          alt={`Portrait of ${content.brand.photographerName}`}
          className="about-image"
        />

        <p>
          <strong>{content.brand.photographerName}</strong> {content.about.intro.replace(`${content.brand.photographerName} `, '')}
        </p>

        {content.about.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        <p>
          You can follow his latest projects and travels on{' '}
          <a
            href={content.socials.instagramUrl}
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
          {' '}and TikTok under the username <strong>{content.socials.tiktokLabel}</strong>.
        </p>
      </div>
    </main>
  );
}
