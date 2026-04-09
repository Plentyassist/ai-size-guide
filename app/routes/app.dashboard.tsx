import { json, LoaderFunctionArgs } from "@shopify/remix-oxygen";
import { useLoaderData } from "@remix-run/react";
import { Page, Card, DataTable, Text, BlockStack, InlineGrid, Box } from "@shopify/polaris";

export async function loader({ request }: LoaderFunctionArgs) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/recommendations?select=*&order=created_at.desc&limit=100`,
    {
      headers: {
        apikey: supabaseKey!,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  const recommendations = await response.json();

  const stats: Record<string, Record<string, number>> = {};
  for (const rec of recommendations) {
    if (!stats[rec.product_title]) stats[rec.product_title] = {};
    const size = rec.recommended_size || "unbekannt";
    stats[rec.product_title][size] = (stats[rec.product_title][size] || 0) + 1;
  }

  return json({ recommendations, stats });
}

export default function Dashboard() {
  const { recommendations, stats } = useLoaderData<typeof loader>();

  return (
    <Page title="AI Size Guide — Dashboard">
      <BlockStack gap="500">
        <InlineGrid columns={3} gap="400">
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd" as="h2">Empfehlungen gesamt</Text>
              <Text variant="heading2xl" as="p">{recommendations.length}</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd" as="h2">Produkte</Text>
              <Text variant="heading2xl" as="p">{Object.keys(stats).length}</Text>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="200">
              <Text variant="headingMd" as="h2">Heute</Text>
              <Text variant="heading2xl" as="p">
                {recommendations.filter((r: any) => {
                  const d = new Date(r.created_at);
                  const today = new Date();
                  return d.toDateString() === today.toDateString();
                }).length}
              </Text>
            </BlockStack>
          </Card>
        </InlineGrid>

        {Object.entries(stats).map(([product, sizes]) => (
          <Card key={product}>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h2">{product}</Text>
              <DataTable
                columnContentTypes={["text", "numeric"]}
                headings={["Größe", "Anzahl Empfehlungen"]}
                rows={Object.entries(sizes)
                  .sort((a, b) => b[1] - a[1])
                  .map(([size, count]) => [size, count])}
              />
            </BlockStack>
          </Card>
        ))}

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">Letzte 100 Empfehlungen</Text>
            <DataTable
              columnContentTypes={["text", "text", "text", "text", "text"]}
              headings={["Zeitpunkt", "Produkt", "Empfehlung", "Größe", "BH-Größe"]}
              rows={recommendations.map((r: any) => [
                new Date(r.created_at).toLocaleString("de-DE"),
                r.product_title || "-",
                r.recommended_size || "-",
                r.figure_type || "-",
                r.cup_size || "-",
              ])}
            />
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
