"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentSchema, type StudentFormValues } from '@/lib/schema';
import type { Student } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface StudentFormProps {
  onSubmit: (data: StudentFormValues) => void;
  defaultValues?: Student | null;
  courseNames: string[];
}

export function StudentForm({ onSubmit, defaultValues, courseNames }: StudentFormProps) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      phone: defaultValues?.phone || '',
      onAccount: defaultValues?.onAccount ?? '',
      total: defaultValues?.total ?? '',
      course: defaultValues?.course || courseNames[0],
      observations: defaultValues?.observations || '',
      qrPayment: undefined,
      hasVideo: defaultValues?.hasVideo || false,
    },
  });

  const qrPaymentRef = form.register('qrPayment');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
            control={form.control}
            name="course"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Curso</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    {courseNames.map(courseName => (
                       <FormItem key={courseName} className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={courseName} />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {courseName}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Juan Perez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Ej: 123-456-7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="onAccount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>A Cuenta</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="qrPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pago QR</FormLabel>
                <FormControl>
                  <Input type="file" accept="image/*" {...qrPaymentRef} />
                </FormControl>
                 <FormDescription>
                  Sube una imagen del comprobante de pago.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hasVideo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>¿Compró el video?</FormLabel>
                  <FormDescription>
                    Indica si el estudiante querrá el video pregrabado de su curso para verlo luego.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade notas o comentarios adicionales..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit" className="w-full md:w-auto">
          {defaultValues ? 'Actualizar Estudiante' : 'Guardar Estudiante'}
        </Button>
      </form>
    </Form>
  );
}
