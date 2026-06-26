export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        background: "#162233",
        borderRadius: 4,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {"</>"}
    </span>
  );
}
