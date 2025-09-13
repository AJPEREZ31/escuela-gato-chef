
"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { PlusCircle, Users, DollarSign, Percent, Plus, XIcon, Calendar as CalendarIcon, Send } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp, 
  getDocs,
  writeBatch,
  where
} from 'firebase/firestore';


import type { Student, Course } from '@/lib/types';
import type { StudentFormValues } from '@/lib/schema';
import { StudentForm } from '@/components/student-form';
import { StudentTable } from '@/components/student-table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendStudentToN8n, sendFormattedStudentToN8n } from '@/ai/flows/send-to-n8n-flow';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    currencyDisplay: 'symbol',
  }).format(amount);
};

// Helper to convert a file to a Base64 Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const CourseTabContent = ({
  students,
  courseName,
  onEdit,
  onDelete,
  onFinishEnrollment
}: {
  students: Student[];
  courseName: string;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  onFinishEnrollment: (courseName: string) => void;
}) => {
  const totalStudents = students.length;
  const totalIncome = students.reduce((acc, student) => acc + student.total, 0);
  const studentsWithVideo = students.filter(student => student.hasVideo).length;
  const videoPercentage = totalStudents > 0 ? (studentsWithVideo / totalStudents) * 100 : 0;
  
  return (
    <div className="space-y-8">
       <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Alumnos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ingresos Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adquisición de Video</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{videoPercentage.toFixed(0)}%</div>
               <p className="text-xs text-muted-foreground">
                {studentsWithVideo} de {totalStudents} estudiantes
              </p>
            </CardContent>
          </Card>
        </div>
        <StudentTable students={students} onEdit={onEdit} onDelete={onDelete} />
        <div className="flex justify-end">
            <Button onClick={() => onFinishEnrollment(courseName)}>
                <Send className="mr-2 h-4 w-4" />
                Finalizar Inscripción: {courseName}
            </Button>
        </div>
    </div>
  );
}


export function StudentLedgerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDateRange, setNewCourseDateRange] = useState<DateRange | undefined>();
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const { toast } = useToast();

  const courseNames = courses.map(c => c.name);

  // Fetch courses and students from Firestore in real-time
  useEffect(() => {
    // Fetch courses
    const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'asc'));
    const unsubscribeCourses = onSnapshot(coursesQuery, (querySnapshot) => {
      const coursesData: Course[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        coursesData.push({
          id: doc.id,
          name: data.name,
          createdAt: data.createdAt,
          dateRange: (data.dateRange?.from && {
            from: (data.dateRange.from as Timestamp).toDate(),
            to: data.dateRange.to ? (data.dateRange.to as Timestamp).toDate() : undefined,
          }) || undefined,
        });
      });
      setCourses(coursesData);
      if (coursesData.length > 0 && !activeTab) {
        setActiveTab(coursesData[0].name);
      } else if (coursesData.length === 0) {
        setActiveTab('');
      }
    });

    // Fetch students
    const studentsQuery = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData: Student[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        studentsData.push({ id: doc.id, ...data } as Student);
      });
      setStudents(studentsData);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeCourses();
      unsubscribeStudents();
    };
  }, [activeTab]);


  const handleConfirmAddCourse = async () => {
    const trimmedName = newCourseName.trim();
    if (trimmedName === '') {
      toast({
        title: "Nombre de curso vacío",
        description: "El nombre del curso no puede estar vacío.",
        variant: "destructive"
      });
      return;
    }
    if (courses.some(c => c.name === trimmedName)) {
      toast({
        title: "Nombre duplicado",
        description: "Ya existe un curso con este nombre.",
        variant: "destructive"
      });
      return;
    }

    const newCourse: Omit<Course, 'id'> = { 
      name: trimmedName,
      createdAt: Timestamp.now(),
      dateRange: newCourseDateRange ? {
        from: newCourseDateRange.from!,
        to: newCourseDateRange.to,
      } : undefined,
    };

    try {
      const docRef = await addDoc(collection(db, 'courses'), newCourse);
      setActiveTab(trimmedName);
      setNewCourseName('');
      setNewCourseDateRange(undefined);
      setIsAddCourseDialogOpen(false);
      toast({
        title: "Curso Agregado",
        description: `El curso "${trimmedName}" ha sido creado.`,
      });
    } catch(e) {
      console.error("Error adding course: ", e);
      toast({ title: "Error", description: "No se pudo crear el curso.", variant: "destructive"});
    }
  };
  
 const handleCourseNameChange = async (courseId: string, newName: string) => {
    const courseToUpdate = courses.find(c => c.id === courseId);
    if (!courseToUpdate) return;
    const originalName = courseToUpdate.name;

    // Optimistically update UI
    const updatedCourses = courses.map(c => c.id === courseId ? {...c, name: newName} : c);
    setCourses(updatedCourses);
    
    // Prevent duplicate names
    if (courses.some(c => c.name === newName && c.id !== courseId)) {
        toast({
            title: "Nombre duplicado",
            description: "Ya existe un curso con este nombre.",
            variant: "destructive"
        });
        // Revert to original name visually
        setCourses(courses.map(c => c.id === courseId ? { ...c, name: originalName } : c));
        return;
    }

    if (newName.trim() === '') {
        return; // Don't save empty names to DB yet
    }

    try {
      const courseDocRef = doc(db, 'courses', courseId);
      await updateDoc(courseDocRef, { name: newName });
      
      // Batch update students in the old course
      const studentsQuery = query(collection(db, 'students'), where('course', '==', originalName));
      const studentDocs = await getDocs(studentsQuery);
      const batch = writeBatch(db);
      studentDocs.forEach(studentDoc => {
        batch.update(studentDoc.ref, { course: newName });
      });
      await batch.commit();

      if (activeTab === originalName) {
        setActiveTab(newName);
      }
    } catch (e) {
      console.error("Error updating course name: ", e);
      // Revert UI on failure
      setCourses(courses.map(c => c.id === courseId ? { ...c, name: originalName } : c));
      toast({ title: "Error", description: "No se pudo actualizar el nombre del curso.", variant: "destructive" });
    }
};

  const handleCourseNameBlur = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course && (!course.name || course.name.trim() === '')) {
        let counter = 1;
        let defaultName = `Curso ${courses.length}`;
        while(courses.some(c => c.name === defaultName && c.id !== courseId)){
            counter++;
            defaultName = `Curso ${courses.length + counter}`;
        }
        handleCourseNameChange(courseId, defaultName);
    }
  }

  const handleDeleteCourse = async (courseNameToDelete: string) => {
    const course = courses.find(c => c.name === courseNameToDelete);
    if (!course) return;

    try {
      // Delete the course document
      await deleteDoc(doc(db, 'courses', course.id));

      // Batch delete students associated with the course
      const studentsQuery = query(collection(db, 'students'), where('course', '==', courseNameToDelete));
      const studentDocs = await getDocs(studentsQuery);
      const batch = writeBatch(db);
      studentDocs.forEach(studentDoc => {
        batch.delete(studentDoc.ref);
      });
      await batch.commit();

      toast({
        title: "Curso Eliminado",
        description: `El curso "${courseNameToDelete}" y todos sus estudiantes han sido eliminados.`,
        variant: "destructive"
      });
      setCourseToDelete(null);
    } catch (e) {
      console.error("Error deleting course: ", e);
      toast({ title: "Error", description: "No se pudo eliminar el curso.", variant: "destructive" });
    }
  };


  const handleAddStudent = async (data: StudentFormValues) => {
    const balance = Number(data.total) - (Number(data.onAccount) || 0);
    const qrFile = data.qrPayment?.[0];
    let qrPaymentUrl;
    let qrPaymentDataUri;
    // Note: We won't store the blob URL in Firestore. We will store the data URI for n8n.
    if (qrFile) {
        // qrPaymentUrl = URL.createObjectURL(qrFile); // This is temporary client-side only
        qrPaymentDataUri = await fileToDataUri(qrFile);
    }

    const newStudent: Omit<Student, 'id'> = {
      ...data,
      total: Number(data.total),
      onAccount: Number(data.onAccount) || 0,
      balance,
      observations: data.observations || '',
      qrPaymentFileName: qrFile?.name,
      createdAt: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'students'), newStudent);
      
      // Send data to n8n
      await sendStudentToN8n({
          id: docRef.id,
          ...newStudent,
          qrPaymentUrl: qrPaymentDataUri, // Send the data URI
      });

      toast({
        title: "Estudiante Agregado",
        description: `${data.name} ha sido añadido al registro.`,
      });
      setIsAccordionOpen(false);
      setActiveTab(data.course);
    } catch(e) {
        console.error("Error adding student: ", e);
        toast({ title: "Error", description: "No se pudo agregar al estudiante.", variant: "destructive"});
    }
  };
  
  const handleUpdateStudent = async (id: string, data: StudentFormValues) => {
    const balance = Number(data.total) - (Number(data.onAccount) || 0);
    const studentToUpdate = students.find(s => s.id === id);
    if (!studentToUpdate) return;

    const qrFile = data.qrPayment?.[0];
    let qrPaymentDataUri; // We'll send this to n8n if it changes

    if (qrFile) {
        qrPaymentDataUri = await fileToDataUri(qrFile);
    }
    
    const updatedStudentData = {
        ...data,
        total: Number(data.total),
        onAccount: Number(data.onAccount) || 0,
        balance,
        observations: data.observations || '',
        qrPaymentFileName: qrFile ? qrFile.name : studentToUpdate.qrPaymentFileName,
    };

    try {
      const studentDocRef = doc(db, 'students', id);
      await updateDoc(studentDocRef, updatedStudentData);
      
      // Send updated data to n8n
      await sendStudentToN8n({
          id: id,
          ...studentToUpdate, // Send original data merged with new data
          ...updatedStudentData,
          qrPaymentUrl: qrPaymentDataUri, // Send the potentially new data URI
      });
      
      toast({
        title: "Estudiante Actualizado",
        description: `${data.name} ha sido actualizado.`,
      });
      setEditingStudent(null);
      setIsAccordionOpen(false);
      setActiveTab(data.course);
    } catch(e) {
        console.error("Error updating student: ", e);
        toast({ title: "Error", description: "No se pudo actualizar al estudiante.", variant: "destructive"});
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsAccordionOpen(true);
  }

  const handleDelete = async (id: string) => {
    const studentToDelete = students.find(s => s.id === id);
    if (!studentToDelete) return;

    try {
      await deleteDoc(doc(db, 'students', id));
      toast({
        title: "Estudiante Eliminado",
        description: `${studentToDelete.name} ha sido eliminado del registro.`,
        variant: "destructive"
      });
      // Note: We are not sending delete events to n8n in this example,
      // but you could create another flow for that.
    } catch(e) {
      console.error("Error deleting student: ", e);
      toast({ title: "Error", description: "No se pudo eliminar al estudiante.", variant: "destructive"});
    }
  }

  const onAccordionToggle = (value: string) => {
    const isOpen = value === 'item-1';
    setIsAccordionOpen(isOpen);
    if (!isOpen) {
      setEditingStudent(null); // Clear editing state when accordion closes
    }
  }

  const studentsByCourse = (courseName: string) => students.filter(s => s.course === courseName);
  
  const handleDateChange = async (date: DateRange | undefined, courseId: string) => {
    const updatedDateRange = date ? { from: date.from!, to: date.to } : undefined;
    
    // Optimistically update UI
    const updatedCourses = courses.map(c => {
      if (c.id === courseId) {
        return { ...c, dateRange: date };
      }
      return c;
    });
    setCourses(updatedCourses);

    try {
      const courseDocRef = doc(db, 'courses', courseId);
      await updateDoc(courseDocRef, { dateRange: updatedDateRange });
    } catch (e) {
      console.error("Error updating date: ", e);
      // Revert on error - not fully implemented for simplicity but would be needed in prod
      toast({ title: "Error", description: "No se pudo guardar la fecha.", variant: "destructive" });
    }
  };

  const activeCourse = courses.find(c => c.name === activeTab);

  const handleFinishEnrollment = async (courseName: string) => {
    const courseStudents = students.filter(s => s.course === courseName);
    if (courseStudents.length === 0) {
      toast({
        title: 'No hay estudiantes',
        description: `No hay estudiantes inscritos en el curso "${courseName}".`,
        variant: 'destructive',
      });
      return;
    }
    try {
      // We can't easily send images for a batch, so we'll omit them.
      const studentDataPromises = courseStudents.map(s => {
         return sendFormattedStudentToN8n({
            date: new Date().toLocaleDateString('es-ES'), // "dd/mm/yyyy"
            name: s.name,
            phone: s.phone,
            course: s.course,
            onAccount: s.onAccount,
            balance: s.balance,
            total: s.total,
            qrPayment: s.qrPaymentFileName || 'No',
            observations: s.observations || 'Ninguna',
            video: s.hasVideo ? 'Sí' : 'No',
          });
      });

      await Promise.all(studentDataPromises);
      
      toast({
        title: 'Inscripciones Cerradas',
        description: `Se han registrado con éxito ${courseStudents.length} nuevos alumnos para el curso "${courseName}".`,
      });
    } catch (error) {
      console.error('Error sending batch data to n8n:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al enviar los datos.',
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="space-y-8">
      <Accordion type="single" collapsible value={isAccordionOpen ? 'item-1' : ''} onValueChange={onAccordionToggle}>
        <AccordionItem value="item-1" className="border rounded-lg shadow-sm">
          <AccordionTrigger className="px-6 py-4 text-lg font-medium hover:no-underline data-[state=open]:border-b">
            <div className="flex items-center gap-3">
              <PlusCircle className="h-6 w-6 text-primary" />
              <span>{editingStudent ? 'Editar Estudiante' : 'Agregar Nuevo Estudiante'}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6">
            <StudentForm 
              onSubmit={editingStudent ? (data) => handleUpdateStudent(editingStudent.id, data) : handleAddStudent} 
              defaultValues={editingStudent}
              courseNames={courseNames}
              key={editingStudent?.id || 'new'}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AlertDialog open={!!courseToDelete} onOpenChange={(isOpen) => !isOpen && setCourseToDelete(null)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center border-b">
            <TabsList className="flex-nowrap overflow-x-auto justify-start bg-muted text-muted-foreground rounded-none p-0 h-auto">
              {courses.map((course) => {
                  const isActive = activeTab === course.name;
                  return (
                    <div key={course.id} className="relative group flex items-center flex-shrink-0">
                      <TabsTrigger value={course.name} className="pr-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none">
                        <Input
                          value={course.name}
                          onChange={(e) => handleCourseNameChange(course.id, e.target.value)}
                          onBlur={() => handleCourseNameBlur(course.id)}
                          className={cn(
                            "w-auto h-full text-center cursor-pointer transition-all border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-2",
                             isActive ? "text-primary-foreground" : "text-black"
                          )}
                          style={{pointerEvents: 'auto'}}
                        />
                      </TabsTrigger>
                      <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute right-1 h-6 w-6 rounded-full opacity-50 group-hover:opacity-100 transition-opacity z-10 hover:bg-destructive [&>svg]:text-destructive-foreground",
                                isActive && "text-primary-foreground hover:bg-destructive/80 [&:hover>svg]:text-primary-foreground"
                            )}
                            onClick={(e) => { e.stopPropagation(); setCourseToDelete(course.name)}}
                          >
                            <XIcon className="h-4 w-4" />
                            <span className="sr-only">Eliminar curso</span>
                          </Button>
                      </AlertDialogTrigger>
                    </div>
                  );
                })}
               <AlertDialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
                <AlertDialogTrigger asChild>
                   <Button variant="ghost" size="sm" className="ml-2 shrink-0">
                      <Plus className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Agregar Nuevo Curso</AlertDialogTitle>
                    <AlertDialogDescription>
                      Introduce el nombre y el rango de fechas para el nuevo curso.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="course-name" className="text-right">
                        Nombre
                      </Label>
                      <Input
                        id="course-name"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        className="col-span-3"
                        placeholder="Ej: Curso de Verano"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                       <Label className="text-right">
                        Duración
                      </Label>
                       <div className="col-span-3">
                         <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !newCourseDateRange && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newCourseDateRange?.from ? (
                                  newCourseDateRange.to ? (
                                    <>
                                      {format(newCourseDateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                      {format(newCourseDateRange.to, "LLL dd, y", { locale: es })}
                                    </>
                                  ) : (
                                    format(newCourseDateRange.from, "LLL dd, y", { locale: es })
                                  )
                                ) : (
                                  <span>Selecciona un rango de fechas</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={newCourseDateRange?.from}
                                selected={newCourseDateRange}
                                onSelect={setNewCourseDateRange}
                                numberOfMonths={2}
                                locale={es}
                              />
                            </PopoverContent>
                          </Popover>
                      </div>
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                        setNewCourseName('');
                        setNewCourseDateRange(undefined);
                    }}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmAddCourse}>Guardar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsList>
            <div className="flex-grow flex justify-center sm:justify-end items-center p-2">
              {activeCourse && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full sm:w-[300px] justify-start text-left font-normal",
                        !activeCourse.dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activeCourse.dateRange?.from ? (
                        activeCourse.dateRange.to ? (
                          <>
                            {format(activeCourse.dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                            {format(active-course.dateRange.to, "LLL dd, y", { locale: es })}
                          </>
                        ) : (
                          format(activeCourse.dateRange.from, "LLL dd, y", { locale: es })
                        )
                      ) : (
                        <span>Selecciona un rango de fechas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={activeCourse.dateRange?.from}
                      selected={activeCourse.dateRange}
                      onSelect={(date) => handleDateChange(date, activeCourse.id)}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
          {courses.map(course => (
            <TabsContent key={course.id} value={course.name} className="mt-4">
              <CourseTabContent 
                students={studentsByCourse(course.name)} 
                courseName={course.name}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onFinishEnrollment={handleFinishEnrollment}
              />
            </TabsContent>
          ))}
          {courses.length === 0 && (
            <Card className="mt-4 text-center py-12">
              <CardContent>
                <h3 className="text-xl font-medium">No hay cursos registrados</h3>
                <p className="text-muted-foreground mt-2">Agrega un nuevo curso para empezar.</p>
              </CardContent>
            </Card>
          )}
        </Tabs>
        
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el curso "{courseToDelete}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. Se eliminarán todos los estudiantes inscritos en este curso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCourseToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => courseToDelete && handleDeleteCourse(courseToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
