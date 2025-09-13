"use client";

import type { Student } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, MoreVertical, Edit, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface StudentTableProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
  }).format(amount);
};

export function StudentTable({ students, onEdit, onDelete }: StudentTableProps) {
  if (students.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <h3 className="text-xl font-medium">No hay estudiantes registrados</h3>
          <p className="text-muted-foreground mt-2">Agrega un nuevo estudiante para empezar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">Teléfono</TableHead>
            <TableHead className="text-right">A Cuenta</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Video</TableHead>
            <TableHead className="hidden lg:table-cell">Archivos</TableHead>
            <TableHead className="hidden xl:table-cell">Observaciones</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.name}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">{student.phone}</TableCell>
              <TableCell className="text-right text-green-600">{formatCurrency(student.onAccount)}</TableCell>
              <TableCell className="text-right">
                <Badge variant={student.balance > 0 ? "destructive" : "secondary"}>
                  {formatCurrency(student.balance)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(student.total)}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Video className="h-4 w-4" />
                  {student.hasVideo ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-4">
                  {student.qrPaymentUrl && (
                    <a href={student.qrPaymentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                      <FileText className="h-4 w-4" /> <span>QR</span>
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden xl:table-cell max-w-xs truncate text-muted-foreground">{student.observations}</TableCell>
              <TableCell className="text-right">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(student)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(student.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Eliminar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
