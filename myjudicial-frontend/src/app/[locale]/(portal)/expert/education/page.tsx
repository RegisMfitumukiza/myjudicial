"use client";

import { useState } from "react";
import { Plus, GraduationCap, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useEducation,
  useCreateEducation,
  useUpdateEducation,
  useDeleteEducation,
  type ExpertEducation,
  type CreateEducationDto,
} from "@/features/experts/hooks/useEducation";

const educationSchema = z.object({
  institution: z.string().min(2).max(200),
  degree: z.string().min(2).max(100),
  fieldOfStudy: z.string().max(100).optional(),
  yearCompleted: z.coerce
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear()),
});

type EducationFormValues = z.infer<typeof educationSchema>;

export default function EducationPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingEducation, setEditingEducation] = useState<
    ExpertEducation | undefined
  >();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: education, isLoading, error } = useEducation();
  const createEducation = useCreateEducation();
  const updateEducation = useUpdateEducation();
  const deleteEducation = useDeleteEducation();

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema) as any,
    defaultValues: {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      yearCompleted: new Date().getFullYear(),
    },
  });

  const handleEdit = (edu: ExpertEducation) => {
    setEditingEducation(edu);
    form.reset({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || "",
      yearCompleted: edu.yearCompleted,
    });
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingEducation(undefined);
    form.reset();
  };

  const onSubmit = async (values: EducationFormValues) => {
    const dto: CreateEducationDto = {
      institution: values.institution,
      degree: values.degree,
      fieldOfStudy: values.fieldOfStudy,
      yearCompleted: values.yearCompleted,
    };

    try {
      if (editingEducation) {
        await updateEducation.mutateAsync({ id: editingEducation.id, dto });
      } else {
        await createEducation.mutateAsync(dto);
      }
      handleClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteEducation.mutateAsync(deletingId);
      setDeletingId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSaving = createEducation.isPending || updateEducation.isPending;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Education</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your educational background and qualifications
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Education
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load education records. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && education?.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-brand-border bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10">
            <GraduationCap className="h-8 w-8 text-brand-blue" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-brand-dark">
            No education records yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Add your educational background to strengthen your profile.
          </p>
          <Button onClick={() => setShowForm(true)} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Education
          </Button>
        </div>
      )}

      {/* Education List */}
      {!isLoading && !error && education && education.length > 0 && (
        <div className="space-y-4">
          {education.map((edu) => (
            <div
              key={edu.id}
              className="flex items-start justify-between rounded-lg border border-brand-border bg-white p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue/10">
                  <GraduationCap className="h-6 w-6 text-brand-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-dark">{edu.degree}</h3>
                  <p className="text-sm text-slate-600">{edu.institution}</p>
                  {edu.fieldOfStudy && (
                    <p className="mt-1 text-sm text-slate-500">{edu.fieldOfStudy}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Graduated: {edu.yearCompleted}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(edu)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingId(edu.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Education Form Dialog */}
      <Dialog open={showForm} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEducation ? "Edit Education" : "Add Education"}
            </DialogTitle>
            <DialogDescription>
              {editingEducation
                ? "Update your educational record"
                : "Add your educational background"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="institution">Institution</FieldLabel>
              <FieldContent>
                <Input
                  id="institution"
                  placeholder="e.g., University of Rwanda"
                  {...form.register("institution")}
                />
              </FieldContent>
              <FieldError>
                {form.formState.errors.institution?.message}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="degree">Degree</FieldLabel>
              <FieldContent>
                <Input
                  id="degree"
                  placeholder="e.g., Bachelor of Laws (LLB)"
                  {...form.register("degree")}
                />
              </FieldContent>
              <FieldError>{form.formState.errors.degree?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="fieldOfStudy">Field of Study (Optional)</FieldLabel>
              <FieldContent>
                <Input
                  id="fieldOfStudy"
                  placeholder="e.g., Corporate Law"
                  {...form.register("fieldOfStudy")}
                />
              </FieldContent>
              <FieldError>
                {form.formState.errors.fieldOfStudy?.message}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="yearCompleted">Year Completed</FieldLabel>
              <FieldContent>
                <Input
                  id="yearCompleted"
                  type="number"
                  {...form.register("yearCompleted")}
                />
              </FieldContent>
              <FieldError>
                {form.formState.errors.yearCompleted?.message}
              </FieldError>
            </Field>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingEducation ? "Update" : "Add"} Education
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Education Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this education record? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteEducation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteEducation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
