import { StudentLedgerPage } from '@/components/student-ledger-page';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8 flex items-center gap-6">
        <Image
          src="https://drive.google.com/uc?export=view&id=1SwXvtnQSxcUTeG1SgaFi3_qObiuswCr6"
          alt="Logo de Escuela Gato Chef"
          width={150}
          height={150}
          className="rounded-full"
          data-ai-hint="cat chef"
        />
        <div>
          <h1 className="text-4xl font-bebas-neue font-bold" style={{color: 'hsl(var(--primary))'}}>
            Escuela Gato Chef
          </h1>
          <p className="text-muted-foreground mt-2">
            Registro de Ingresos de Estudiantes
          </p>
        </div>
      </header>
      <StudentLedgerPage />
    </main>
  );
}
