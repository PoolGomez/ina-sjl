import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bingo en Vivo – Transmisión | EVENTOS INA',
  description: 'Sigue el bingo en tiempo real. Ve los números que van saliendo en vivo.',
};

export default function TransmisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
