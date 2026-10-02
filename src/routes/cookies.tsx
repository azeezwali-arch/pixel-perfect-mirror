import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookies – Hildur 4.0" },
      { name: "description", content: "Information om vilka cookies Hildur använder och varför." },
      { property: "og:title", content: "Cookies – Hildur 4.0" },
      { property: "og:description", content: "Information om vilka cookies Hildur använder och varför." },
    ],
  }),
  component: () => (
    <InfoPage
      title="Cookies"
      intro="Här förklarar vi hur vi använder cookies och liknande tekniker."
      sections={[
        { h: "Nödvändiga cookies", p: "Behövs för att appen ska fungera, till exempel för att komma ihåg ditt namn under besöket och ditt cookieval." },
        { h: "Analys", p: "Om du accepterar kan vi samla in anonym statistik för att förbättra tjänsten." },
        { h: "Ändra ditt val", p: "Du kan när som helst rensa cookies i din webbläsare för att göra ett nytt val." },
      ]}
    />
  ),
});
