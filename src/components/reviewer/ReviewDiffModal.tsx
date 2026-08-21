import React from "react";
import { SCORE_DEFS } from "@/components/reviewer/ReviewArticle";

type Version = {
  id: number;
  version_number?: number;
  created_at?: string | null;
  score?: number | null;
  opinion?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  versions: Version[];
};

function scoreLabel(score?: number | null) {
  if (score === null || score === undefined) return "—";
  const found = SCORE_DEFS.find((s) => s.value === score);
  return found ? found.label : String(score);
}

export default function ReviewDiffModal({ open, onClose, versions }: Props) {
  if (!open) return null;

  // build pairs: (v0->v1), (v1->v2), ...
  const pairs: Array<{ from: Version; to: Version }> = [];
  for (let i = 1; i < versions.length; i++) {
    pairs.push({ from: versions[i - 1], to: versions[i] });
  }

  return (
    <div className="rc-modal-backdrop" style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div className="rc-modal" style={{ width: 800, maxHeight: "80vh", overflow: "auto", background: "#fff", borderRadius: 8, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Modificaciones entre versiones</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer" }}>Cerrar</button>
        </div>

        {versions.length <= 1 && <div>No hay versiones para comparar.</div>}

        {pairs.map((p, idx) => {
          const scoreChanged = p.from.score !== p.to.score;
          const opinionChanged = (p.from.opinion || "") !== (p.to.opinion || "");

          return (
            <div key={idx} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                {/* muestra versiones/fechas */}
                Versión {p.from.version_number ?? idx} → {p.to.version_number ?? idx + 1}
                {" · "}
                {p.to.created_at ? new Date(p.to.created_at).toLocaleString() : ""}
              </div>

              {scoreChanged ? (
                <div style={{ marginBottom: 8 }}>
                  <strong>Puntaje:</strong>
                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <div style={{ flex: 1, background: "#fff6f6", padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: "#888" }}>Antes</div>
                      <div style={{ fontWeight: 600 }}>{scoreLabel(p.from.score)}</div>
                    </div>
                    <div style={{ flex: 1, background: "#f6fff6", padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: "#888" }}>Ahora</div>
                      <div style={{ fontWeight: 600 }}>{scoreLabel(p.to.score)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 8, color: "#666" }}>Puntaje sin cambios</div>
              )}

              {opinionChanged ? (
                <div>
                  <strong>Opinión / Comentarios:</strong>
                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#888" }}>Antes</div>
                      <div style={{ whiteSpace: "pre-wrap", background: "#fff6f6", padding: 8, borderRadius: 6 }}>{p.from.opinion ?? ""}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "#888" }}>Ahora</div>
                      <div style={{ whiteSpace: "pre-wrap", background: "#f6fff6", padding: 8, borderRadius: 6 }}>{p.to.opinion ?? ""}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: "#666" }}>Opinión sin cambios</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}