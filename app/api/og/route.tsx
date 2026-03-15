import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            top: "-100px",
            right: "-100px",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
            bottom: "-80px",
            left: "-60px",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
            padding: "60px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#22d3ee",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Academia Dialéctica
          </div>

          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#f1f5f9",
              lineHeight: 1.15,
              maxWidth: "900px",
            }}
          >
            Clases Particulares y Tutoría Personalizada
          </div>

          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              maxWidth: "700px",
              lineHeight: 1.5,
            }}
          >
            Aprende a tu ritmo con atención individualizada para todos los niveles
          </div>

          {/* CTA pill */}
          <div
            style={{
              marginTop: "12px",
              padding: "14px 36px",
              borderRadius: "9999px",
              background: "linear-gradient(90deg, #6366f1, #22d3ee)",
              fontSize: "20px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            Reclama tu Premio →
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
