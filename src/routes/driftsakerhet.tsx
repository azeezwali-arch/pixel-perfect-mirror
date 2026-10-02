import { createFileRoute } from "@tanstack/react-router";
import { InfoPage } from "@/components/InfoPage";

export const Route = createFileRoute("/driftsakerhet")({
  head: () => ({
    meta: [
      { title: "Om strömmen går – Hildur 4.0" },
      { name: "description", content: "Hildur körs i molnet med redundans och backup och är alltid online." },
      { property: "og:title", content: "Om strömmen går – Hildur 4.0" },
      { property: "og:description", content: "Hildur körs i molnet med redundans och backup och är alltid online." },
    ],
  }),
  component: () => (
    <InfoPage
      title="Om strömmen går"
      intro="Ett strömavbrott på hotellet påverkar inte Hildur. Här är varför."
      sections={[
        { h: "Körs i molnet", p: "Hildur körs på servrar i molnet med redundans, inte på hotellet. Går strömmen här på plats fortsätter Hildur att fungera som vanligt." },
        { h: "Backup av alla bokningar", p: "Dina bokningar och uppgifter lagras säkert med regelbunden backup, så ingenting försvinner." },
        { h: "Alltid online", p: "Du kan fortsätta använda Hildur från din mobil via mobilnätet, även om hotellets wifi ligger nere." },
        { h: "Vid akuta fel", p: "Är det akut – till exempel vid brand, vattenläcka eller om någon är skadad – kontakta receptionen direkt eller ring 112." },
      ]}
    />
  ),
});
