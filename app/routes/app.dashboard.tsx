import { json } from "@shopify/remix-oxygen";
import { useLoaderData } from "react-router";

export async function loader() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/recommendations?select=*&order=created_at.desc&limit=200`,
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
    const title = rec.product_title || rec.product_id || "Unbekannt";
    if (!stats[title]) stats[title] = {};
    const size = rec.recommended_size || "?";
    stats[title][size] = (stats[title][size] || 0) + 1;
  }

  return json({ recommendations, stats, total: recommendations.length });
}

export default function Dashboard() {
  const { recommendations, stats, total } = useLoaderData<typeof loader>();
  const today = recommendations.filter((r: any) => {
    return new Date(r.created_at).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div style={{padding: "24px", fontFamily: "sans-serif", maxWidth: "1200px"}}>
      <h1 style={{fontSize: "24px", marginBottom: "24px"}}>AI Size Guide — Dashboard</h1>

      <div style={{display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px"}}>
        <div style={{background: "#f6f6f7", borderRadius: "8px", padding: "20px"}}>
          <div style={{fontSize: "13px", color: "#666", marginBottom: "8px"}}>Empfehlungen gesamt</div>
          <div style={{fontSize: "32px", fontWeight: "600"}}>{total}</div>
        </div>
        <div style={{background: "#f6f6f7", borderRadius: "8px", padding: "20px"}}>
          <div style={{fontSize: "13px", color: "#666", marginBottom: "8px"}}>Produkte</div>
          <div style={{fontSize: "32px", fontWeight: "600"}}>{Object.keys(stats).length}</div>
        </div>
        <div style={{background: "#f6f6f7", borderRadius: "8px", padding: "20px"}}>
          <div style={{fontSize: "13px", color: "#666", marginBottom: "8px"}}>Heute</div>
          <div style={{fontSize: "32px", fontWeight: "600"}}>{today}</div>
        </div>
      </div>

      {Object.entries(stats).map(([product, sizes]) => (
        <div key={product} style={{background: "white", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "20px", marginBottom: "16px"}}>
          <h2 style={{fontSize: "16px", marginBottom: "16px"}}>{product}</h2>
          <table style={{width: "100%", borderCollapse: "collapse"}}>
            <thead>
              <tr style={{borderBottom: "1px solid #e1e3e5"}}>
                <th style={{textAlign: "left", padding: "8px", fontSize: "13px", color: "#666"}}>Größe</th>
                <th style={{textAlign: "left", padding: "8px", fontSize: "13px", color: "#666"}}>Empfehlungen</th>
                <th style={{textAlign: "left", padding: "8px", fontSize: "13px", color: "#666"}}>Anteil</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(sizes).sort((a, b) => b[1] - a[1]).map(([size, count]) => {
                const productTotal = Object.values(sizes).reduce((a, b) => a + b, 0);
                const pct = Math.round((count / productTotal) * 100);
                return (
                  <tr key={size} style={{borderBottom: "1px solid #f1f1f1"}}>
                    <td style={{padding: "10px 8px", fontWeight: "600"}}>{size}</td>
                    <td style={{padding: "10px 8px"}}>{count}</td>
                    <td style={{padding: "10px 8px"}}>
                      <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                        <div style={{background: "#e1e3e5", borderRadius: "4px", height: "8px", width: "100px"}}>
                          <div style={{background: "#008060", borderRadius: "4px", height: "8px", width: `${pct}px`}}></div>
                        </div>
                        <span style={{fontSize: "13px", color: "#666"}}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div style={{background: "white", border: "1px solid #e1e3e5", borderRadius: "8px", padding: "20px"}}>
        <h2 style={{fontSize: "16px", marginBottom: "16px"}}>Letzte Empfehlungen</h2>
        <table style={{width: "100%", borderCollapse: "collapse", fontSize: "13px"}}>
          <thead>
            <tr style={{borderBottom: "1px solid #e1e3e5"}}>
              <th style={{textAlign: "left", padding: "8px", color: "#666"}}>Zeitpunkt</th>
              <th style={{textAlign: "left", padding: "8px", color: "#666"}}>Produkt</th>
              <th style={{textAlign: "left", padding: "8px", color: "#666"}}>Größe</th>
              <th style={{textAlign: "left", padding: "8px", color: "#666"}}>Figurtyp</th>
              <th style={{textAlign: "left", padding: "8px", color: "#666"}}>BH-Größe</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.slice(0, 50).map((r: any) => (
              <tr key={r.id} style={{borderBottom: "1px solid #f1f1f1"}}>
                <td style={{padding: "8px"}}>{new Date(r.created_at).toLocaleString("de-DE")}</td>
                <td style={{padding: "8px"}}>{r.product_title || "-"}</td>
                <td style={{padding: "8px", fontWeight: "600"}}>{r.recommended_size || "-"}</td>
                <td style={{padding: "8px"}}>{r.figure_type || "-"}</td>
                <td style={{padding: "8px"}}>{r.cup_size || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
