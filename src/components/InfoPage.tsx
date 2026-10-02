import { PageShell } from "./SiteChrome";

export function InfoPage({ title, intro, sections }: { title: string; intro: string; sections: { h: string; p: string }[] }) {
  return (
    <PageShell title={title}>
      <p className="mb-6 text-lg text-muted-foreground">{intro}</p>
      <div className="space-y-4">
        {sections.map((s) => (
          <section key={s.h} className="glass animate-fade-up rounded-2xl p-5">
            <h2 className="text-xl">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
