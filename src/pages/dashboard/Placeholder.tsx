export default function Placeholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-10">
      <h1
        className="text-4xl mb-2 text-[#F0EAE0]"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {title}
      </h1>
      <p className="text-[#F0EAE0]/60 mb-10">{description}</p>
      <div className="border border-dashed border-[#C4A264]/20 p-16 text-center text-[#F0EAE0]/40 text-sm">
        Bientôt disponible — Phase suivante.
      </div>
    </div>
  );
}
