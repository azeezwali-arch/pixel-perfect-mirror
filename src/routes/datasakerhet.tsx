import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/datasakerhet")({
  head: () => ({
    meta: [
      { title: "Hur din data skyddas – Hildur 4.0" },
      { name: "description", content: "Så krypteras, lagras och skyddas dina uppgifter hos Hildur." },
      { property: "og:title", content: "Hur din data skyddas – Hildur 4.0" },
      { property: "og:description", content: "Så krypteras, lagras och skyddas dina uppgifter hos Hildur." },
    ],
  }),
  component: () => (
    <InfoPage
      title="Hur din data skyddas"
      intro="Vi samlar bara in det som behövs för att hjälpa dig under din vistelse."
      sections={[
        { h: "Kryptering", p: "All data krypteras både under överföring och när den lagras." },
        { h: "Lagring i molnet med backup", p: "Uppgifterna lagras hos en säker molnleverantör med regelbunden backup." },
        { h: "Ingen delning med tredje part", p: "Dina uppgifter säljs eller delas aldrig med tredje part." },
        { h: "Rätt att få data raderad", p: "Du kan när som helst be receptionen att radera dina uppgifter, så gör vi det." },
      ]}
    />
  ),
});
