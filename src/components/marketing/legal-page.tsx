import { PubShell } from "@/components/layout/pub-shell";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <PubShell>
      <main className="container-page max-w-3xl py-10">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400">Last updated: {updated}</p>
        <div className="prose-legal mt-6">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
              {section.list ? (
                <ul>
                  {section.list.map((item) => (
                    <li key={item.slice(0, 40)}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </main>
    </PubShell>
  );
}