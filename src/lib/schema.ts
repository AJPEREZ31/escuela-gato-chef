import { z } from 'zod';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const studentSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  phone: z.string().regex(/^\+?[0-9\s-]{7,15}$/, { message: "Número de teléfono no válido." }),
  onAccount: z.union([z.string().length(0), z.coerce.number().min(0, "El monto debe ser un número positivo.")]).optional().default(0),
  total: z.union([z.string().length(0), z.coerce.number()]).refine(val => val !== '', {message: 'El total es requerido.'}),
  course: z.string().min(1, { message: "Debes seleccionar un curso." }),
  observations: z.string().max(500, { message: "Las observaciones no pueden exceder los 500 caracteres."}).optional(),
  qrPayment: z.any()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_IMAGE_SIZE, `El tamaño máximo de la imagen es 5MB.`)
    .refine((files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), ".jpg, .jpeg, .png y .webp son los formatos aceptados."),
  hasVideo: z.boolean().default(false).optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
